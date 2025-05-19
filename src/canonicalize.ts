import type {
	JsonArray,
	JsonLikeValue,
	JsonObject,
	JsonPrimitive,
	JsonValue,
} from "./types.ts";

/**
 * Recursively traverses a JSON-like value (potentially containing undefined properties or array elements)
 * and returns a new, strictly valid JSON value (JsonValue) suitable for stringification or comparison.
 * This function effectively performs a deep clone while canonicalizing.
 *
 * Canonicalization rules:
 * - Object keys with `undefined` values are omitted.
 * - `undefined` elements within arrays are converted to `null`.
 * - All object keys at all levels are sorted alphabetically by default in the output object.
 * - Primitives (`string`, `number`, `boolean`, `null`) are returned as is.
 * - The input value `undefined` is converted to `null`.
 *
 * @param value The JsonLikeValue to canonicalize.
 * @param compareFn An optional custom comparison function for sorting object keys. If omitted, keys are sorted alphabetically using default string comparison.
 * @returns A strict JsonValue representing the canonical form of the input: object keys sorted recursively, no undefined values, and a deep copy of the original structure.
 * @throws {RangeError} Potentially throws if the object graph is too deep, leading to a stack overflow (similar limitation to `JSON.stringify`). Circular references are not explicitly handled and will cause infinite recursion.
 */
export function canonicalize(
	value: JsonLikeValue,
	compareFn?: ((a: string, b: string) => number) | undefined,
): JsonValue {
	// Case 1: If the value is explicitly undefined, treat it like an undefined array element -> null
	// Consistent with JSON.stringify([undefined]) -> [null]
	if (value === undefined) {
		return null;
	}

	// Case 2: Primitives (string, number, boolean, null) are returned directly.
	// Need explicit null check because typeof null is 'object'.
	if (value === null || typeof value !== "object") {
		// We already handled `undefined` above, so `value` here is JsonPrimitive
		return value as JsonPrimitive;
	}

	// Case 3: Arrays - Recursively canonicalize each element, converting undefined to null.
	// 'value' is JsonLikeArray (JsonLikeValue[]) potentially containing undefined elements
	if (Array.isArray(value)) {
		const newArray: JsonArray = [];
		for (const element of value) {
			// Recursively call canonicalize for each element
			newArray.push(canonicalize(element, compareFn)); // Pass compareFn down for nested objects
		}
		return newArray; // Return the new array containing only JsonValue elements
	}

	// Case 4: Objects - Sort keys, recursively canonicalize values, skipping undefined values.
	// 'value' is JsonLikeObject potentially containing undefined properties
	const sortedKeys = Object.keys(value).sort(compareFn); // Sort keys alphabetically or with custom compareFn
	const newObj: JsonObject = {};

	for (const key of sortedKeys) {
		// Check if the property exists and get its value
		// Using Object.prototype.hasOwnProperty.call is safer for potentially complex objects
		// Although not strictly necessary here as we get keys from Object.keys, it's robust.
		if (Object.prototype.hasOwnProperty.call(value, key)) {
			const propertyValue = value[key];

			// CRITICAL: Skip properties whose value is undefined.
			if (propertyValue !== undefined) {
				// Recursively call canonicalize for the property value
				newObj[key] = canonicalize(propertyValue, compareFn);
			}
		}
	}
	return newObj;
}
