/**
 * Represents the primitive types allowed in JSON.
 */
export type JsonPrimitive = string | number | boolean | null;

/**
 * Represents a JSON object structure with string keys and JsonValue values.
 */
export type JsonObject = {
	[key: string]: JsonValue;
};

/**
 * Represents a JSON array containing JsonValue elements.
 */
export type JsonArray = JsonValue[];

/**
 * Represents any valid JSON value: a primitive, an object, or an array.
 * This type does NOT include `undefined`.
 */
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

/**
 * Represents a JSON-like object structure that MAY contain `undefined` values.
 * This is often the case for in-memory TypeScript objects representing JSON data.
 */
export type JsonLikeObject = {
	[key: string]: JsonLikeValue;
};

/**
 * Represents a JSON-like array that MAY contain `undefined` elements.
 */
export type JsonLikeArray = JsonLikeValue[];

/**
 * Represents any value that might appear in a JavaScript object derived from JSON,
 * including `undefined` which is not valid in JSON itself but common in TS objects.
 */
export type JsonLikeValue =
	| JsonValue
	| JsonLikeObject
	| JsonLikeArray
	| undefined;
