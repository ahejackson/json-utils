import { canonicalize } from "./canonicalize.ts";
import type { JsonLikeValue, JsonValue } from "./types.ts";

/**
 * Generic type for a function that converts an item of type S into a string representation.
 * @template S The type of the item to stringify.
 * @param {S} arg The item to convert to a string.
 * @returns {string} The string representation of the item.
 */
export type Stringifier<T> = (item: T) => string;

/**
 * Creates a stable, canonical string representation of any JSON or JSON-like value
 * (potentially containing undefined properties or array elements)
 * by recursively sorting object keys and handling undefined according to
 * JSON.stringify rules before stringifying.
 *
 * By default this uses the `canonicalize` function for canonicalization, but a custom function can be passed.
 *
 * An optional whitespace parameter can be passed to JSON.stringify.
 *
 * @param item The JsonLikeValue to stringify canonically.
 * @param [canonicalizer=canonicalize] The function to use for canonicalization.
 * @param [space] Optional whitespace to use when stringifying.
 * @returns A string representation suitable for comparison.
 */
export function createCanonicalJsonString(
	item: JsonLikeValue,
	canonicalizer: (item: JsonLikeValue) => JsonValue = canonicalize,
	space?: string | number,
): string {
	// 1. Create the canonical JSON version of the item (type JsonValue).
	//    With the default canonicalizer, this step sorts keys,
	//    removes undefined properties, and converts undefined array elements to null.
	const canonicalItem: JsonValue = canonicalizer(item);

	// 2. Stringify the resulting canonical (and strictly valid JSON) structure.
	return JSON.stringify(canonicalItem, null, space);
}
