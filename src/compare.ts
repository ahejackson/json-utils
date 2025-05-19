import { createCanonicalJsonString } from "./stringify.ts";
import type { JsonLikeValue } from "./types.ts";

/**
 * Performs a semantic comparison of two JSON-like values.
 * Returns `true` if the values are equivalent after canonicalization, `false` otherwise.
 *
 * Equivalence means:
 * - Primitives are compared strictly (`===`).
 * - Objects are equivalent if they have the same set of keys, and the corresponding values are recursively equivalent (key order does not matter). Properties with `undefined` values are ignored.
 * - Arrays are equivalent if they have the same elements in the same order, after each element is canonicalized (`undefined` elements become `null`).
 * - `undefined` as a top-level value is considered equivalent to `null`.
 *
 * @param a The first JsonLikeValue to compare.
 * @param b The second JsonLikeValue to compare.
 * @returns `true` if the values are semantically equal, `false` otherwise.
 * @performance This function relies on canonical stringification (`createCanonicalJsonString`). For very large or deeply nested objects/arrays, this can be computationally intensive if called frequently in performance-critical code sections.
 */
export function semanticEquals(a: JsonLikeValue, b: JsonLikeValue): boolean {
	// Quick check for primitives and identity. Also handles both being undefined.
	if (a === b) {
		return true;
	}

	// Generate canonical strings for both values and compare them.
	// This handles key order, undefined properties/elements, and nested structures correctly.
	return createCanonicalJsonString(a) === createCanonicalJsonString(b);
}
