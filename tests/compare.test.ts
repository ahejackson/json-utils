import { expect } from "@std/expect";
import { semanticEquals } from "../src/compare.ts";
import type { JsonLikeValue } from "../src/types.ts";

Deno.test("areJsonLikeEqual", async (t) => {
	await t.step(
		"should return true for identical primitive values (string)",
		() => {
			// Arrange
			const a: JsonLikeValue = "hello";
			const b: JsonLikeValue = "hello";

			// Act & Assert
			expect(semanticEquals(a, b)).toBe(true);
		},
	);

	await t.step(
		"should return true for identical primitive values (number)",
		() => {
			// Arrange
			const a: JsonLikeValue = 123;
			const b: JsonLikeValue = 123;

			// Act & Assert
			expect(semanticEquals(a, b)).toBe(true);
		},
	);

	await t.step(
		"should return true for identical primitive values (boolean)",
		() => {
			// Arrange
			const a: JsonLikeValue = true;
			const b: JsonLikeValue = true;

			// Act & Assert
			expect(semanticEquals(a, b)).toBe(true);
		},
	);

	await t.step("should return true for null values", () => {
		// Arrange
		const a: JsonLikeValue = null;
		const b: JsonLikeValue = null;

		// Act & Assert
		expect(semanticEquals(a, b)).toBe(true);
	});

	await t.step("should return true for undefined values", () => {
		// Arrange
		const a: JsonLikeValue = undefined;
		const b: JsonLikeValue = undefined;

		// Act & Assert
		expect(semanticEquals(a, b)).toBe(true);
	});

	await t.step(
		"should return true for undefined and null (canonicalized)",
		() => {
			// Arrange
			const a: JsonLikeValue = undefined;
			const b: JsonLikeValue = null;
			// They canonicalize to the same value (null)

			// Act & Assert
			expect(semanticEquals(a, b)).toBe(true);
		},
	);

	await t.step("should return false for different primitive values", () => {
		// Arrange
		const a: JsonLikeValue = "hello";
		const b: JsonLikeValue = "world";

		// Act & Assert
		expect(semanticEquals(a, b)).toBe(false);
	});

	await t.step(
		"should return false for different types (string vs number)",
		() => {
			// Arrange
			const a: JsonLikeValue = "123";
			const b: JsonLikeValue = 123;

			// Act & Assert
			expect(semanticEquals(a, b)).toBe(false);
		},
	);

	await t.step("should return true for identical simple arrays", () => {
		// Arrange
		const a: JsonLikeValue = [1, "a", true];
		const b: JsonLikeValue = [1, "a", true];

		// Act & Assert
		expect(semanticEquals(a, b)).toBe(true);
	});

	await t.step("should return false for arrays with different order", () => {
		// Arrange
		const a: JsonLikeValue = [1, "a"];
		const b: JsonLikeValue = ["a", 1];

		// Act & Assert
		expect(semanticEquals(a, b)).toBe(false);
	});

	await t.step("should return false for arrays with different lengths", () => {
		// Arrange
		const a: JsonLikeValue = [1, "a"];
		const b: JsonLikeValue = [1, "a", true];

		// Act & Assert
		expect(semanticEquals(a, b)).toBe(false);
	});

	await t.step(
		"should return true for arrays with undefined elements becoming null",
		() => {
			// Arrange
			const a: JsonLikeValue = [1, undefined, "a"];
			const b: JsonLikeValue = [1, null, "a"];
			// Both canonicalize to [1, null, "a"]

			// Act & Assert
			expect(semanticEquals(a, b)).toBe(true);
		},
	);

	await t.step("should return true for identical simple objects", () => {
		// Arrange
		const a: JsonLikeValue = { x: 1, y: "test" };
		const b: JsonLikeValue = { x: 1, y: "test" };

		// Act & Assert
		expect(semanticEquals(a, b)).toBe(true);
	});

	await t.step(
		"should return true for objects with same keys/values but different order",
		() => {
			// Arrange
			const a: JsonLikeValue = { x: 1, y: "test" };
			const b: JsonLikeValue = { y: "test", x: 1 };
			// Canonicalization sorts keys

			// Act & Assert
			expect(semanticEquals(a, b)).toBe(true);
		},
	);

	await t.step("should return false for objects with different keys", () => {
		// Arrange
		const a: JsonLikeValue = { x: 1, y: "test" };
		const b: JsonLikeValue = { x: 1, z: "test" };

		// Act & Assert
		expect(semanticEquals(a, b)).toBe(false);
	});

	await t.step("should return false for objects with different values", () => {
		// Arrange
		const a: JsonLikeValue = { x: 1, y: "test" };
		const b: JsonLikeValue = { x: 1, y: "testing" };

		// Act & Assert
		expect(semanticEquals(a, b)).toBe(false);
	});

	await t.step(
		"should return true for objects where undefined properties are omitted",
		() => {
			// Arrange
			const a: JsonLikeValue = { x: 1, y: "test", z: undefined };
			const b: JsonLikeValue = { y: "test", x: 1 };
			// Both canonicalize to {"x":1,"y":"test"}

			// Act & Assert
			expect(semanticEquals(a, b)).toBe(true);
		},
	);

	await t.step(
		"should return false when one object has an extra defined property",
		() => {
			// Arrange
			const a: JsonLikeValue = { x: 1, y: "test", z: null }; // z is defined as null
			const b: JsonLikeValue = { y: "test", x: 1 };

			// Act & Assert
			expect(semanticEquals(a, b)).toBe(false);
		},
	);

	await t.step(
		"should return true for complex nested objects with different key order and undefined handling",
		() => {
			// Arrange
			const a: JsonLikeValue = {
				c: 3,
				a: {
					z: undefined,
					y: "hello",
					x: [1, undefined, { bar: undefined, foo: "baz" }],
				},
				b: undefined,
			};
			const b: JsonLikeValue = {
				a: {
					y: "hello",
					x: [1, null, { foo: "baz" }], // Note null instead of undefined in array
				},
				c: 3,
			};
			// Both canonicalize to {"a":{"x":[1,null,{"foo":"baz"}],"y":"hello"},"c":3}

			// Act & Assert
			expect(semanticEquals(a, b)).toBe(true);
		},
	);

	await t.step(
		"should return false for complex nested objects with subtle differences",
		() => {
			// Arrange
			const a: JsonLikeValue = {
				c: 3,
				a: {
					y: "hello",
					x: [1, null, { foo: "baz" }],
				},
			};
			const b: JsonLikeValue = {
				a: {
					x: [1, null, { foo: "bar" }], // Difference here
					y: "hello",
				},
				c: 3,
			};

			// Act & Assert
			expect(semanticEquals(a, b)).toBe(false);
		},
	);

	await t.step("should return true for empty objects", () => {
		// Arrange
		const a: JsonLikeValue = {};
		const b: JsonLikeValue = {};

		// Act & Assert
		expect(semanticEquals(a, b)).toBe(true);
	});

	await t.step("should return true for empty arrays", () => {
		// Arrange
		const a: JsonLikeValue = [];
		const b: JsonLikeValue = [];

		// Act & Assert
		expect(semanticEquals(a, b)).toBe(true);
	});

	await t.step("should return false for empty object vs empty array", () => {
		// Arrange
		const a: JsonLikeValue = {};
		const b: JsonLikeValue = [];

		// Act & Assert
		expect(semanticEquals(a, b)).toBe(false);
	});
});
