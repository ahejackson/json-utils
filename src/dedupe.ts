import { type Stringifier, createCanonicalJsonString } from "./stringify.ts";
import type { JsonLikeValue } from "./types.ts";

/**
 * Deduplicates an array of JSON-like items (extending {@linkcode JsonLikeValue}) items based on their semantic content,
 * ignoring the order of keys within objects and treating undefined properties/elements
 * consistently with JSON.stringify rules.
 *
 * This is a convenience wrapper for {@linkcode dedupeBy} using {@linkcode createCanonicalJsonString} as the stringifier.
 *
 * @template T - The type of items in the array, must extend `JsonLikeValue`.
 * @param {T[]} items - The array of items to deduplicate.
 * @returns {T[]} A new array containing only the unique items from the oriiginal array,
 * maintaining the order of the first occurrence.
 *
 * @example
 * ```ts
 * const data = [{ id: 1, name: "A", role: undefined }, { id: 2, name: "B" }, { name: "A", id: 1 }];
 * const uniqueData = dedupeBy(data);
 * // uniqueData will be [{ id: 1, name: "A" }, { id: 2, name: "B" }]
 * ```
 */
export function semanticDedupe<T extends JsonLikeValue>(items: T[]): T[] {
	return dedupeBy(items, createCanonicalJsonString);
}

/**
 * Deduplicates an array of items using a custom stringifier function to determine uniqueness.
 *
 * @template T The type of items in the array. Must extend the type S accepted by the stringifier.
 * @template S The type accepted by the custom stringifier function.
 * @param {T[]} items The array of items to deduplicate.
 * @param {Stringifier<S>} stringifier The function to convert an item of type S (or T which extends S) into a string key for comparison.
 * @returns {T[]} A new array containing only the unique items from the original array,
 * maintaining the order of the first occurrence.
 *
 * @example
 * ```ts
 * interface User { id: number; name: string; }
 * const users: User[] = [{ id: 1, name: "Alice" }, { id: 2, name: "Bob" }, { id: 1, name: "Alicia" }];
 *
 * // Deduplicate based only on the 'id' property
 * const uniqueById = dedupeBy(users, (user: { id: number }) => String(user.id));
 * // uniqueById will be [{ id: 1, name: "Alice" }, { id: 2, name: "Bob" }]
 * ```
 */
export function dedupeBy<T extends S, S>(
	items: T[],
	stringifier: Stringifier<S>,
): T[] {
	const seen = new Set<string>();
	const uniqueItems: T[] = [];

	for (const item of items) {
		// Generate the string key for the current item using the selected stringifier.
		const key = stringifier(item);

		if (!seen.has(key)) {
			seen.add(key);
			uniqueItems.push(item);
		}
	}
	return uniqueItems;
}
