import { expect } from "@std/expect";
import { canonicalize } from "../src/canonicalize.ts";
import type { JsonLikeValue, JsonValue } from "../src/types.ts";

Deno.test("canonicalize", async (t) => {
	await t.step("should return null when input is undefined", () => {
		// Arrange
		const input: JsonLikeValue = undefined;
		const expected: JsonValue = null;

		// Act
		const result = canonicalize(input);

		// Assert
		expect(result).toBe(expected);
	});

	await t.step("should return null when input is null", () => {
		// Arrange
		const input: JsonLikeValue = null;
		const expected: JsonValue = null;

		// Act
		const result = canonicalize(input);

		// Assert
		expect(result).toBe(expected);
	});

	await t.step("should return the same primitive value for strings", () => {
		// Arrange
		const input: JsonLikeValue = "hello";
		const expected: JsonValue = "hello";

		// Act
		const result = canonicalize(input);

		// Assert
		expect(result).toBe(expected);
	});

	await t.step("should return the same primitive value for numbers", () => {
		// Arrange
		const input: JsonLikeValue = 123.45;
		const expected: JsonValue = 123.45;

		// Act
		const result = canonicalize(input);

		// Assert
		expect(result).toBe(expected);
	});

	await t.step(
		"should return the same primitive value for boolean true",
		() => {
			// Arrange
			const input: JsonLikeValue = true;
			const expected: JsonValue = true;

			// Act
			const result = canonicalize(input);

			// Assert
			expect(result).toBe(expected);
		},
	);

	await t.step(
		"should return the same primitive value for boolean false",
		() => {
			// Arrange
			const input: JsonLikeValue = false;
			const expected: JsonValue = false;

			// Act
			const result = canonicalize(input);

			// Assert
			expect(result).toBe(expected);
		},
	);

	await t.step(
		"should return an empty array when input is an empty array",
		() => {
			// Arrange
			const input: JsonLikeValue = [];
			const expected: JsonValue = [];

			// Act
			const result = canonicalize(input);

			// Assert
			expect(result).toEqual(expected);
			expect(Array.isArray(result)).toBe(true); // Ensure it's still an array
		},
	);

	await t.step(
		"should return an array with nulls when input array contains undefined",
		() => {
			// Arrange
			const input: JsonLikeValue = [1, undefined, "hello", undefined, true];
			const expected: JsonValue = [1, null, "hello", null, true];

			// Act
			const result = canonicalize(input);

			// Assert
			expect(result).toEqual(expected);
		},
	);

	await t.step(
		"should return an array with canonicalized nested values",
		() => {
			// Arrange
			const input: JsonLikeValue = [1, { b: undefined, a: 1 }, [undefined, 2]];
			const expected: JsonValue = [1, { a: 1 }, [null, 2]];

			// Act
			const result = canonicalize(input);

			// Assert
			expect(result).toEqual(expected);
		},
	);

	await t.step(
		"should return an empty object when input is an empty object",
		() => {
			// Arrange
			const input: JsonLikeValue = {};
			const expected: JsonValue = {};

			// Act
			const result = canonicalize(input);

			// Assert
			expect(result).toEqual(expected);
		},
	);

	await t.step(
		"should return an object with keys sorted alphabetically",
		() => {
			// Arrange
			const input: JsonLikeValue = { c: 3, a: 1, b: 2 };
			const expected: JsonValue = { a: 1, b: 2, c: 3 };
			// Note: Direct comparison works because canonicalize produces the sorted version
			// For string comparison, see stringify tests

			// Act
			const result = canonicalize(input);

			// Assert
			expect(result).toEqual(expected);
			// Also check key order explicitly
			expect(Object.keys(result as object)).toEqual(["a", "b", "c"]);
		},
	);

	await t.step("should omit properties with undefined values", () => {
		// Arrange
		const input: JsonLikeValue = { a: 1, b: undefined, c: 3, d: undefined };
		const expected: JsonValue = { a: 1, c: 3 };

		// Act
		const result = canonicalize(input);

		// Assert
		expect(result).toEqual(expected);
	});

	await t.step(
		"should handle nested objects with undefined values and unsorted keys",
		() => {
			// Arrange
			const input: JsonLikeValue = {
				c: 3,
				a: {
					z: undefined,
					y: "hello",
					x: [1, undefined, { bar: undefined, foo: "baz" }],
				},
				b: undefined,
			};
			const expected: JsonValue = {
				a: {
					x: [1, null, { foo: "baz" }],
					y: "hello",
				},
				c: 3,
			};

			// Act
			const result = canonicalize(input);

			// Assert
			expect(result).toEqual(expected);
			// Check key order in nested objects
			expect(Object.keys(result as object)).toEqual(["a", "c"]);
			expect(Object.keys((result as any).a)).toEqual(["x", "y"]);
			expect(Object.keys((result as any).a.x[2])).toEqual(["foo"]);
		},
	);

	await t.step("should use custom compare function for sorting keys", () => {
		// Arrange
		const input: JsonLikeValue = { c: 3, a: 1, b: 2, d: 4 };
		// Reverse alphabetical sort
		const compareFn = (a: string, b: string) => b.localeCompare(a);
		const expected: JsonValue = { d: 4, c: 3, b: 2, a: 1 };

		// Act
		const result = canonicalize(input, compareFn);

		// Assert
		expect(result).toEqual(expected);
		expect(Object.keys(result as object)).toEqual(["d", "c", "b", "a"]);
	});

	await t.step("should handle object with null value correctly", () => {
		// Arrange
		const input: JsonLikeValue = { a: 1, b: null };
		const expected: JsonValue = { a: 1, b: null };

		// Act
		const result = canonicalize(input);

		// Assert
		expect(result).toEqual(expected);
	});

	await t.step(
		"should handle complex nested structure with mixed types",
		() => {
			// Arrange
			const input: JsonLikeValue = {
				id: 123,
				user: { name: "Alice", role: undefined, groups: ["admin", "dev"] },
				settings: [{ theme: "dark", notifications: undefined }, null],
				active: true,
				metadata: undefined,
			};
			const expected: JsonValue = {
				active: true,
				id: 123,
				settings: [{ theme: "dark" }, null],
				user: { name: "Alice", groups: ["admin", "dev"] },
			};

			// Act
			const result = canonicalize(input);

			// Assert
			expect(result).toEqual(expected);
			expect(Object.keys(result as object)).toEqual([
				"active",
				"id",
				"settings",
				"user",
			]);
			expect(Object.keys((result as any).user)).toEqual(["groups", "name"]);
			expect(Object.keys((result as any).settings[0])).toEqual(["theme"]);
		},
	);
});
