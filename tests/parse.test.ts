import { expect } from "@std/expect";
import { parse, safeParse } from "../src/parse.ts";
import type { JsonValue } from "../src/types.ts";

Deno.test("parse", async (t) => {
	await t.step("should correctly parse a valid JSON object string", () => {
		// Arrange
		const jsonString =
			'{"a": 1, "b": "hello", "c": true, "d": null, "e": [1, 2], "f": {}}';
		const expected: JsonValue = {
			a: 1,
			b: "hello",
			c: true,
			d: null,
			e: [1, 2],
			f: {},
		};

		// Act
		const result = parse(jsonString);

		// Assert
		expect(result).toEqual(expected);
	});

	await t.step("should correctly parse a valid JSON array string", () => {
		// Arrange
		const jsonString = '[1, "a", true, null, {"key": "value"}, []]';
		const expected: JsonValue = [1, "a", true, null, { key: "value" }, []];

		// Act
		const result = parse(jsonString);

		// Assert
		expect(result).toEqual(expected);
	});

	await t.step(
		"should correctly parse a valid JSON primitive string (number)",
		() => {
			// Arrange
			const jsonString = "123.45";
			const expected: JsonValue = 123.45;

			// Act
			const result = parse(jsonString);

			// Assert
			expect(result).toBe(expected);
		},
	);

	await t.step(
		"should correctly parse a valid JSON primitive string (string)",
		() => {
			// Arrange
			const jsonString = '"hello world"';
			const expected: JsonValue = "hello world";

			// Act
			const result = parse(jsonString);

			// Assert
			expect(result).toBe(expected);
		},
	);

	await t.step(
		"should correctly parse a valid JSON primitive string (boolean true)",
		() => {
			// Arrange
			const jsonString = "true";
			const expected: JsonValue = true;

			// Act
			const result = parse(jsonString);

			// Assert
			expect(result).toBe(expected);
		},
	);

	await t.step(
		"should correctly parse a valid JSON primitive string (boolean false)",
		() => {
			// Arrange
			const jsonString = "false";
			const expected: JsonValue = false;

			// Act
			const result = parse(jsonString);

			// Assert
			expect(result).toBe(expected);
		},
	);

	await t.step(
		"should correctly parse a valid JSON primitive string (null)",
		() => {
			// Arrange
			const jsonString = "null";
			const expected: JsonValue = null;

			// Act
			const result = parse(jsonString);

			// Assert
			expect(result).toBe(expected);
		},
	);

	await t.step(
		"should throw SyntaxError for invalid JSON string (missing quote)",
		() => {
			// Arrange
			const jsonString = '{"a": 1, "b": hello}'; // invalid string value

			// Act & Assert
			expect(() => parse(jsonString)).toThrow(SyntaxError);
		},
	);

	await t.step(
		"should throw SyntaxError for invalid JSON string (trailing comma)",
		() => {
			// Arrange
			const jsonString = '{"a": 1,}'; // invalid trailing comma

			// Act & Assert
			expect(() => parse(jsonString)).toThrow(SyntaxError);
		},
	);

	await t.step("should throw SyntaxError for empty string", () => {
		// Arrange
		const jsonString = "";

		// Act & Assert
		expect(() => parse(jsonString)).toThrow(SyntaxError);
	});

	await t.step("should throw SyntaxError for non-JSON string", () => {
		// Arrange
		const jsonString = "just text";

		// Act & Assert
		expect(() => parse(jsonString)).toThrow(SyntaxError);
	});
});

Deno.test("safeParse", async (t) => {
	await t.step(
		"should return success true and data for a valid JSON object string",
		() => {
			// Arrange
			const jsonString = '{"a": 1, "b": "hello"}';
			const expectedData: JsonValue = { a: 1, b: "hello" };

			// Act
			const result = safeParse(jsonString);

			// Assert
			expect(result.success).toBe(true);
			if (result.success) {
				// Type guard
				expect(result.data).toEqual(expectedData);
			} else {
				throw new Error("Expected success: true");
			}
		},
	);

	await t.step(
		"should return success true and data for a valid JSON array string",
		() => {
			// Arrange
			const jsonString = '[1, "a", null]';
			const expectedData: JsonValue = [1, "a", null];

			// Act
			const result = safeParse(jsonString);

			// Assert
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data).toEqual(expectedData);
			} else {
				throw new Error("Expected success: true");
			}
		},
	);

	await t.step(
		"should return success true and data for a valid JSON primitive string (number)",
		() => {
			// Arrange
			const jsonString = "123";
			const expectedData: JsonValue = 123;

			// Act
			const result = safeParse(jsonString);

			// Assert
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data).toBe(expectedData);
			} else {
				throw new Error("Expected success: true");
			}
		},
	);

	// Add similar steps for other primitives (string, boolean, null) if desired, follows same pattern

	await t.step(
		"should return success false and SyntaxError for invalid JSON string (missing quote)",
		() => {
			// Arrange
			const jsonString = '{"a": hello}';

			// Act
			const result = safeParse(jsonString);

			// Assert
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error).toBeInstanceOf(SyntaxError);
				// Optionally check error message if consistent across JS engines
				// expect(result.error.message).toContain("token");
			} else {
				throw new Error("Expected success: false");
			}
		},
	);

	await t.step(
		"should return success false and SyntaxError for invalid JSON string (trailing comma)",
		() => {
			// Arrange
			const jsonString = "[1, 2,]";

			// Act
			const result = safeParse(jsonString);

			// Assert
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error).toBeInstanceOf(SyntaxError);
			} else {
				throw new Error("Expected success: false");
			}
		},
	);

	await t.step(
		"should return success false and SyntaxError for empty string",
		() => {
			// Arrange
			const jsonString = "";

			// Act
			const result = safeParse(jsonString);

			// Assert
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error).toBeInstanceOf(SyntaxError);
				expect(result.error.message).toContain("Unexpected end"); // Common message
			} else {
				throw new Error("Expected success: false");
			}
		},
	);

	await t.step(
		"should return success false and SyntaxError for non-JSON string",
		() => {
			// Arrange
			const jsonString = "not json";

			// Act
			const result = safeParse(jsonString);

			// Assert
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error).toBeInstanceOf(SyntaxError);
			} else {
				throw new Error("Expected success: false");
			}
		},
	);
});
