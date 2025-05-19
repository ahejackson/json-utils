import { expect } from "@std/expect";
import { createCanonicalJsonString } from "../src/stringify.ts";
import type { JsonLikeValue } from "../src/types.ts";

Deno.test("createCanonicalJsonString", async (t) => {
	await t.step("should stringify null", () => {
		// Arrange
		const input: JsonLikeValue = null;
		const expected = "null";

		// Act
		const result = createCanonicalJsonString(input);

		// Assert
		expect(result).toBe(expected);
	});

	await t.step("should stringify undefined as null", () => {
		// Arrange
		const input: JsonLikeValue = undefined;
		const expected = "null"; // undefined canonicalizes to null before stringify

		// Act
		const result = createCanonicalJsonString(input);

		// Assert
		expect(result).toBe(expected);
	});

	await t.step("should stringify primitives correctly (string)", () => {
		// Arrange
		const input: JsonLikeValue = "hello";
		const expected = '"hello"'; // JSON string representation

		// Act
		const result = createCanonicalJsonString(input);

		// Assert
		expect(result).toBe(expected);
	});

	await t.step("should stringify primitives correctly (number)", () => {
		// Arrange
		const input: JsonLikeValue = 123.45;
		const expected = "123.45";

		// Act
		const result = createCanonicalJsonString(input);

		// Assert
		expect(result).toBe(expected);
	});

	await t.step("should stringify primitives correctly (boolean true)", () => {
		// Arrange
		const input: JsonLikeValue = true;
		const expected = "true";

		// Act
		const result = createCanonicalJsonString(input);

		// Assert
		expect(result).toBe(expected);
	});

	await t.step("should stringify primitives correctly (boolean false)", () => {
		// Arrange
		const input: JsonLikeValue = false;
		const expected = "false";

		// Act
		const result = createCanonicalJsonString(input);

		// Assert
		expect(result).toBe(expected);
	});

	await t.step("should stringify an empty array", () => {
		// Arrange
		const input: JsonLikeValue = [];
		const expected = "[]";

		// Act
		const result = createCanonicalJsonString(input);

		// Assert
		expect(result).toBe(expected);
	});

	await t.step(
		"should stringify an array, converting undefined elements to null",
		() => {
			// Arrange
			const input: JsonLikeValue = [1, undefined, "a", true, undefined];
			const expected = '[1,null,"a",true,null]';

			// Act
			const result = createCanonicalJsonString(input);

			// Assert
			expect(result).toBe(expected);
		},
	);

	await t.step("should stringify an empty object", () => {
		// Arrange
		const input: JsonLikeValue = {};
		const expected = "{}";

		// Act
		const result = createCanonicalJsonString(input);

		// Assert
		expect(result).toBe(expected);
	});

	await t.step(
		"should stringify an object with keys sorted alphabetically",
		() => {
			// Arrange
			const input: JsonLikeValue = { c: 3, a: 1, b: "test" };
			const expected = '{"a":1,"b":"test","c":3}'; // Keys sorted

			// Act
			const result = createCanonicalJsonString(input);

			// Assert
			expect(result).toBe(expected);
		},
	);

	await t.step(
		"should stringify an object, omitting undefined properties",
		() => {
			// Arrange
			const input: JsonLikeValue = { c: 3, a: 1, b: undefined, d: null };
			const expected = '{"a":1,"c":3,"d":null}'; // b omitted, keys sorted

			// Act
			const result = createCanonicalJsonString(input);

			// Assert
			expect(result).toBe(expected);
		},
	);

	await t.step("should stringify nested structures canonically", () => {
		// Arrange
		const input: JsonLikeValue = {
			c: [1, undefined, { y: 2, x: undefined, z: 1 }],
			a: "hello",
			b: undefined,
		};
		// Expected canonicalization: { a: "hello", c: [1, null, { y: 2, z: 1 }] }
		const expected = '{"a":"hello","c":[1,null,{"y":2,"z":1}]}';

		// Act
		const result = createCanonicalJsonString(input);

		// Assert
		expect(result).toBe(expected);
	});

	await t.step(
		"should stringify object with numeric keys correctly (as strings)",
		() => {
			// Arrange
			const input: JsonLikeValue = { "2": "b", "1": "a" };
			const expected = '{"1":"a","2":"b"}'; // Keys are strings, sorted alphabetically

			// Act
			const result = createCanonicalJsonString(input);

			// Assert
			expect(result).toBe(expected);
		},
	);

	await t.step("should handle complex nested object consistently", () => {
		// Arrange
		const input1: JsonLikeValue = {
			id: 1,
			data: {
				values: [null, undefined, { b: 2, a: 1, c: undefined }],
				flag: true,
			},
			status: "ok",
			extra: undefined,
		};
		const input2: JsonLikeValue = {
			// Same semantic value, different structure
			status: "ok",
			data: { flag: true, values: [null, null, { a: 1, b: 2 }] },
			id: 1,
		};
		const expected =
			'{"data":{"flag":true,"values":[null,null,{"a":1,"b":2}]},"id":1,"status":"ok"}';

		// Act
		const result1 = createCanonicalJsonString(input1);
		const result2 = createCanonicalJsonString(input2);

		// Assert
		expect(result1).toBe(expected);
		expect(result2).toBe(expected);
		expect(result1).toBe(result2);
	});
});
