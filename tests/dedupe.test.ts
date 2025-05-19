import { expect } from "@std/expect";
import { canonicalize } from "../src/canonicalize.ts";
import { dedupeBy, semanticDedupe } from "../src/dedupe.ts";
import type { Stringifier } from "../src/stringify.ts";
import type { JsonLikeValue } from "../src/types.ts";

// --- Tests for semanticDedupe (uses canonical JSON stringification) ---

Deno.test("semanticDedupe", async (t) => {
	await t.step("should return an empty array when given an empty array", () => {
		// Arrange
		const items: JsonLikeValue[] = [];
		const expected: JsonLikeValue[] = [];

		// Act
		const result = semanticDedupe(items);

		// Assert
		expect(result).toEqual(expected);
		expect(result.length).toBe(0);
	});

	await t.step("should deduplicate primitive values", () => {
		// Arrange
		const items: JsonLikeValue[] = [1, "hello", 1, true, "hello", null, 1];
		const expected: JsonLikeValue[] = [1, "hello", true, null]; // Keep first occurrence

		// Act
		const result = semanticDedupe(items);

		// Assert
		expect(result).toEqual(expected);
	});

	// Note - this behaviour is a bit unintuitive, but it's consistent with the behaviour of JSON.stringify
	// The first occurrence of each unique canonical form is kept - so either null or undefined
	await t.step(
		"should treat undefined elements of arrays as equal to null",
		() => {
			// Arrange
			const items: JsonLikeValue[] = [undefined, null, undefined];
			const expected: JsonLikeValue[] = [undefined];

			// Act
			const result = semanticDedupe(items);

			// Assert
			expect(result).toEqual(expected);
			expect(result.length).toBe(1);
		},
	);

	await t.step(
		"should treat null elements of arrays as equal to undefined ones",
		() => {
			// Arrange
			const items: JsonLikeValue[] = [null, undefined, null, undefined];
			const expected: JsonLikeValue[] = [null];

			// Act
			const result = semanticDedupe(items);

			// Assert
			expect(result).toEqual(expected);
			expect(result.length).toBe(1);
		},
	);

	await t.step("should deduplicate simple identical objects", () => {
		// Arrange
		const obj1 = { a: 1, b: 2 };
		const obj2 = { a: 1, b: 2 };
		const items: JsonLikeValue[] = [obj1, obj2];
		const expected: JsonLikeValue[] = [obj1]; // Keep the first instance

		// Act
		const result = semanticDedupe(items);

		// Assert
		expect(result).toEqual(expected);
		expect(result.length).toBe(1);
		expect(result[0]).toBe(obj1); // Should keep the original reference
	});

	await t.step("should deduplicate objects with different key order", () => {
		// Arrange
		const obj1 = { a: 1, b: 2 };
		const obj2 = { b: 2, a: 1 };
		const items: JsonLikeValue[] = [obj1, "unique", obj2];
		const expected: JsonLikeValue[] = [obj1, "unique"]; // obj2 is a duplicate of obj1

		// Act
		const result = semanticDedupe(items);

		// Assert
		expect(result).toEqual(expected);
		expect(result.length).toBe(2);
		expect(result[0]).toBe(obj1);
	});

	await t.step(
		"should deduplicate objects with undefined properties (omitted during canonicalization)",
		() => {
			// Arrange
			const obj1 = { a: 1, b: 2, c: undefined }; // 'c' is omitted
			const obj2 = { b: 2, a: 1 };
			const items: JsonLikeValue[] = [obj1, obj2];
			const expected: JsonLikeValue[] = [obj1]; // obj1 canonicalizes same as obj2

			// Act
			const result = semanticDedupe(items);

			// Assert
			expect(result).toEqual(expected);
			expect(result.length).toBe(1);
			expect(result[0]).toBe(obj1);
		},
	);

	await t.step(
		"should not deduplicate objects with subtle value differences",
		() => {
			// Arrange
			const obj1 = { a: 1, b: 2 };
			const obj2 = { a: 1, b: 3 };
			const items: JsonLikeValue[] = [obj1, obj2];
			const expected: JsonLikeValue[] = [obj1, obj2]; // Not duplicates

			// Act
			const result = semanticDedupe(items);

			// Assert
			expect(result).toEqual(expected);
			expect(result.length).toBe(2);
		},
	);

	await t.step("should deduplicate identical arrays", () => {
		// Arrange
		const arr1 = [1, 2, 3];
		const arr2 = [1, 2, 3];
		const items: JsonLikeValue[] = [arr1, arr2];
		const expected: JsonLikeValue[] = [arr1];

		// Act
		const result = semanticDedupe(items);

		// Assert
		expect(result).toEqual(expected);
		expect(result.length).toBe(1);
		expect(result[0]).toBe(arr1);
	});

	await t.step("should not deduplicate arrays with different order", () => {
		// Arrange
		const arr1 = [1, 2, 3];
		const arr2 = [3, 2, 1];
		const items: JsonLikeValue[] = [arr1, arr2];
		const expected: JsonLikeValue[] = [arr1, arr2]; // Array order matters

		// Act
		const result = semanticDedupe(items);

		// Assert
		expect(result).toEqual(expected);
		expect(result.length).toBe(2);
	});

	await t.step(
		"should deduplicate arrays considering undefined elements (canonicalizing to null)",
		() => {
			// Arrange
			const arr1 = [1, undefined, 3]; // undefined becomes null
			const arr2 = [1, null, 3];
			const items: JsonLikeValue[] = [arr1, arr2];
			const expected: JsonLikeValue[] = [arr1]; // arr1 canonicalizes same as arr2

			// Act
			const result = semanticDedupe(items);

			// Assert
			expect(result).toEqual(expected);
			expect(result.length).toBe(1);
			expect(result[0]).toBe(arr1);
		},
	);

	await t.step(
		"should handle mixed types including complex nested structures",
		() => {
			// Arrange
			const objA = { name: "Alice", data: [1, { id: 101, value: undefined }] }; // value: undefined omitted
			const objB = { data: [1, { id: 101 }], name: "Alice" }; // Same canonical form as objA
			const objC = { name: "Bob", data: [2] };
			const arrA = [1, null, true];
			const arrB = [1, undefined, true]; // Same canonical form as arrA (undefined -> null)
			const items: JsonLikeValue[] = [
				objA,
				"string1",
				arrA,
				objC,
				objB, // duplicate of objA
				arrB, // duplicate of arrA
				123,
				null,
				objA, // duplicate of objA
				undefined, // duplicate of null canonical form
				"string1", // duplicate
			];
			// Expected order preserves the first occurrence of each unique canonical form
			const expected: JsonLikeValue[] = [
				objA, // First object form {data:[1,{id:101}], name:"Alice"}
				"string1", // First string "string1"
				arrA, // First array form [1, null, true]
				objC, // First object form {data:[2], name:"Bob"}
				123, // First number 123
				null, // First null (from `null` or `undefined`)
			];

			// Act
			const result = semanticDedupe(items);

			// Assert
			expect(result.length).toBe(6);
			expect(result).toEqual(expected); // Checks content equality

			// Verify canonical forms manually for clarity
			const expectedCanonicalStrings = [
				'{"data":[1,{"id":101}],"name":"Alice"}',
				'"string1"',
				"[1,null,true]",
				'{"data":[2],"name":"Bob"}',
				"123",
				"null",
			];
			const resultCanonicalStrings = result.map((item) =>
				JSON.stringify(canonicalize(item)),
			);
			expect(resultCanonicalStrings).toEqual(expectedCanonicalStrings);

			// Check that original references are preserved
			expect(result[0]).toBe(objA);
			expect(result[1]).toBe("string1");
			expect(result[2]).toBe(arrA);
			expect(result[3]).toBe(objC);
			expect(result[4]).toBe(123);
			expect(result[5]).toBe(null); // or undefined if that came first
		},
	);

	await t.step(
		"should preserve original object references in the output",
		() => {
			// Arrange
			const obj1 = { a: 1 };
			const obj2 = { a: 1 }; // Different reference, same content
			const obj3 = { b: 2 };
			const items: JsonLikeValue[] = [obj1, obj2, obj3];
			const _expected: JsonLikeValue[] = [obj1, obj3]; // Keep obj1, skip obj2, keep obj3

			// Act
			const result = semanticDedupe(items);

			// Assert
			expect(result.length).toBe(2);
			expect(result[0]).toBe(obj1); // Check reference equality for the first item
			expect(result[0]).toEqual({ a: 1 });
			expect(result[1]).toBe(obj3);
			expect(result[1]).toEqual({ b: 2 });
		},
	);
});

// --- Tests for dedupeBy (generic deduplication with custom stringifier) ---

Deno.test("dedupeBy", async (t) => {
	await t.step("should return an empty array when given an empty array", () => {
		// Arrange
		const items: string[] = [];
		const stringifier: Stringifier<string> = (s) => s;
		const expected: string[] = [];

		// Act
		const result = dedupeBy(items, stringifier);

		// Assert
		expect(result).toEqual(expected);
		expect(result.length).toBe(0);
	});

	await t.step(
		"should return the same array when all items produce unique string keys",
		() => {
			// Arrange
			const items: number[] = [1, 2, 3, 4];
			const stringifier: Stringifier<number> = (n) => `key_${n}`;
			const expected: number[] = [1, 2, 3, 4];

			// Act
			const result = dedupeBy(items, stringifier);

			// Assert
			expect(result).toEqual(expected);
		},
	);

	await t.step("should deduplicate based on the stringifier result", () => {
		// Arrange
		const items: number[] = [10, 25, 10, 30, 25, 10];
		// Simple string conversion for uniqueness
		const stringifier: Stringifier<number> = (n) => String(n);
		const expected: number[] = [10, 25, 30]; // Keep first 10, first 25, first 30

		// Act
		const result = dedupeBy(items, stringifier);

		// Assert
		expect(result).toEqual(expected);
	});

	await t.step(
		"should deduplicate objects based on a specific property",
		() => {
			// Arrange
			interface User {
				id: number;
				name: string;
				email?: string;
			}
			const user1: User = { id: 1, name: "Alice" };
			const user2: User = { id: 2, name: "Bob" };
			const user3: User = { id: 1, name: "Alicia", email: "a@e.com" }; // Same id as user1
			const user4: User = { id: 3, name: "Charlie" };
			const items: User[] = [user1, user2, user3, user4];

			// Stringifier based only on the 'id' property
			const stringifier: Stringifier<User> = (user) => String(user.id);
			const expected: User[] = [user1, user2, user4]; // user3 is skipped (duplicate id '1')

			// Act
			const result = dedupeBy(items, stringifier);

			// Assert
			expect(result).toEqual(expected);
			expect(result.length).toBe(3);
			expect(result[0]).toBe(user1); // Check references
			expect(result[1]).toBe(user2);
			expect(result[2]).toBe(user4);
		},
	);

	await t.step(
		"should handle different types if the stringifier supports them",
		() => {
			// Arrange
			const items: (string | number | boolean)[] = [
				1,
				"1",
				true,
				1,
				"true",
				false,
				"1",
			];
			// Use typeof to group items, potentially causing collisions intended for testing
			const stringifier: Stringifier<string | number | boolean> = (item) =>
				typeof item;
			// Expect first of each type: number, string, boolean
			const expected: (string | number | boolean)[] = [1, "1", true];

			// Act
			const result = dedupeBy(items, stringifier);

			// Assert
			expect(result).toEqual(expected);
			expect(result.length).toBe(3);
		},
	);

	await t.step(
		"should treat items as duplicates if stringifier returns the same key",
		() => {
			// Arrange
			const items: string[] = ["apple", "banana", "apricot", "blueberry"];
			// Stringifier based on the first letter
			const stringifier: Stringifier<string> = (s) => s.charAt(0);
			// Expected: first 'a' word, first 'b' word
			const expected: string[] = ["apple", "banana"];

			// Act
			const result = dedupeBy(items, stringifier);

			// Assert
			expect(result).toEqual(expected);
			expect(result.length).toBe(2);
		},
	);

	await t.step(
		"should preserve original object references in the output",
		() => {
			// Arrange
			const obj1 = { val: 10 };
			const obj2 = { val: 20 };
			const obj3 = { val: 10 }; // Different reference, stringifier will yield same key as obj1
			const items = [obj1, obj2, obj3];
			const stringifier: Stringifier<{ val: number }> = (o) => String(o.val);
			const _expected = [obj1, obj2]; // Keep obj1, keep obj2, skip obj3

			// Act
			const result = dedupeBy(items, stringifier);

			// Assert
			expect(result.length).toBe(2);
			expect(result[0]).toBe(obj1); // Check reference equality
			expect(result[1]).toBe(obj2);
			expect(result).toEqual([{ val: 10 }, { val: 20 }]); // Check content
		},
	);

	await t.step("should handle stringifier returning empty strings", () => {
		// Arrange
		const items: string[] = ["a", "", "b", "", "c"];
		const stringifier: Stringifier<string> = (s) => s; // Identity
		const expected: string[] = ["a", "", "b", "c"]; // Keeps first empty string

		// Act
		const result = dedupeBy(items, stringifier);

		// Assert
		expect(result).toEqual(expected);
		expect(result.length).toBe(4);
	});
});
