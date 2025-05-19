# json-utils

[![JSR](https://jsr.io/badges/@adamj/json-utils)](https://jsr.io/@adamj/json-utils)

Utility library for working with JSON and JSON-like data structures (with
`undefined` values), focusing on canonical representation and semantic
comparison.

## Description

This is a set of utilities for working with JSON data, or data that comes from
JSON-like sources. Its original motivation is to help with inconsistencies that
arise when working with data originating as JSON (like API responses) -
especially if you cannot guarantee the consistency of the source data.

**Inconsistent Object Key Orders**

Two objects with the same properties but with their keys occurring in different
orders will fail value equality comparisons that rely on simple string
comparison with `JSON.stringify`. For example,
`JSON.stringify({ a: 1, b: 2 }) !== JSON.stringify({ b: 2, a: 1 })`.

**Handling `undefined` Properties**

It's extremely common to represent optional properties using `undefined`, which
isn't part of the JSON standard. Utility functions designed to work with data
that strictly adheres to the JSON standard won't always handle `undefined`
values. Value equality functions might consider `{ a: 1, b: undefined }` and
`{ a: 1 }` to be different, which is not always what you want if you're
interested in the underlying meaning of the data.

**`json-utils` functionality**

This package contains utilities to help with:

- **Canonicalization:** Creating stable, standard representations of JSON-like
  data by sorting object keys recursively and handling `undefined` consistently
  (omits properties from objects, converts `undefined` array elements to
  `null`).
- **Canonical Stringification:** Generate stable string representations of any
  JSON-like value, suitable for hashing or reliable comparison.
- **Semantic Comparison:** Check if two JSON-like objects represent the _same
  underlying data or meaning_, irrespective of superficial differences like key
  order or how optional fields are represented (`undefined` vs. absent).
- **Semantic Deduplication:** Remove duplicate values from an array based on
  their semantic content, not just reference equality.
- **Typed Parsing:** Return typed JSON rather than `unknown`.

## Installation

Add the package to your project from [JSR](https://jsr.io/@adamj/json-utils).

Deno:

```sh
deno add jsr:@adamj/json-utils
```

pnpm 10.9+

```sh
pnpm add jsr:@adamj/json-utils
```

yarn 4.9+

```sh
yarn add jsr:@adamj/json-utils
```

npm

```sh
npx jsr add @adamj/json-utils
```

bun

```sh
bunx jsr add @adamj/json-utils
```

## Usage

### Types

Strict JSON

- `JsonPrimitive: string | number | boolean | null`
- `JsonObject: { [key: string]: JsonValue; }`
- `JsonArray: JsonValue[]`
- `JsonValue: JsonPrimitive | JsonObject | JsonArray`

Permissive JSON-like (May contain `undefined)

- `JsonLikeObject: { [key: string]: JsonLikeValue; }`
- `JsonLikeArray: JsonLikeValue[]`
- `JsonLikeValue: JsonValue | JsonLikeObject | JsonLikeArray | undefined`

### Canonicalization

`canonicalize(value: JsonLikeValue, compareFn?: ((a: string, b: string) => number) | undefined): JsonValue`

- Creates a deep copy of the input, converting it to a strict `JsonValue` by
  sorting object keys alphabetically (by default) and handling `undefined`
  values (properties with `undefined` values are omitted; `undefined` elements
  in arrays become `null`).
- Optionally takes a custom comparison function for sorting the object keys.

```typescript
import { canonicalize } from "jsr:@adamj/json-utils";

const messyObject = {
  c: 3,
  a: [1, undefined, { z: "last", x: "first" }],
  b: undefined,
};
const cleanJsonValue = canonicalize(messyObject);

console.log(cleanJsonValue);
// Output:
// {
//   a: [ 1, null, { x: "first", z: "last" } ],
//   c: 3
// }

console.log(canonicalize(undefined));
// Output: null

console.log(canonicalize([undefined, "hello"]));
// Output: [ null, 'hello' ]
```

### Canonical Stringification

`createCanonicalJsonString(item: JsonLikeValue, canonicalizer?: (item: JsonLikeValue) => JsonValue, space?: string | number): string`

Generates a stable JSON string representation after canonicalizing the input

- uses the `canonicalize` function by default.
- Takes an optional `space` argument that is passed to `JSON.stringify` for
  pretty-printing.

```typescript
import { createCanonicalJsonString } from "jsr:@adamj/json-utils";

const obj1 = { name: "Alice", id: 1, role: undefined };
const obj2 = { id: 1, name: "Alice" }; // Same data, different order, missing undefined property

const string1 = createCanonicalJsonString(obj1);
const string2 = createCanonicalJsonString(obj2);

console.log(string1); // Output: '{"id":1,"name":"Alice"}'
console.log(string2); // Output: '{"id":1,"name":"Alice"}'
console.log(string1 === string2); // Output: true
```

### Semantic Comparison

`semanticEquals(a: JsonLikeValue, b: JsonLikeValue): boolean`

Compares two values for semantic equality. It does this by generating canonical
JSON strings for both values and then comparing these strings. This means
differences in object key order or the distinction between an absent property, a
property with an `undefined` value, and an array element being `undefined`
(which becomes `null`) are ignored.

```typescript
import { semanticEquals } from "jsr:@adamj/json-utils";

const objA = { b: 2, a: [1, undefined] };
const objB = { a: [1, null], b: 2 }; // Semantically equal to objA
const objC = { a: [1, 2], b: 2 }; // Semantically different from objA

console.log(semanticEquals(objA, objB)); // Output: true
console.log(semanticEquals(objA, objC)); // Output: false
console.log(semanticEquals(undefined, null)); // Output: true
console.log(semanticEquals({ x: undefined }, {})); // Output: true
```

### Deduplication

`semanticDedupe<T extends JsonLikeValue>(items: T[]): T[]`

Removes duplicate items from an array based on their semantic content (using
`createCanonicalJsonString` to determine uniqueness). It preserves the first
occurrence of each unique item and maintains the original object references for
these first occurrences.

```typescript
import { semanticDedupe } from "jsr:@adamj/json-utils";

const item1 = { id: 1, value: "A" };
const item2 = { value: "A", id: 1 }; // Semantically same as item1
const item3 = { id: 2, value: "B", meta: undefined };
const item4 = { value: "B", id: 2 }; // Semantically same as item3
const item5 = [1, undefined];
const item6 = [1, null]; // Semantically same as item5

const list = [item1, item5, item3, item2, item6, item4, item1];
const uniqueList = semanticDedupe(list);

console.log(uniqueList);
// Output: [ { id: 1, value: 'A' }, [ 1, undefined ], { id: 2, value: 'B', meta: undefined } ]
// Note: References are preserved for the first unique instance, e.g., uniqueList[0] === item1 is true.
```

### Typed Parsing

`parse(jsonString: string): JsonValue`

A thin wrapper around `JSON.parse()`. It assumes the input string represents
valid JSON; otherwise, it throws a `SyntaxError`.

```typescript
import { parse } from "jsr:@adamj/json-utils";

const data = parse('{"count": 10, "enabled": true}');
console.log(data); // Output: { count: 10, enabled: true }

try {
  parse("{invalid json");
} catch (e) {
  console.error(e instanceof SyntaxError); // Output: true
}
```

`safeParse(jsonString: string): { success: true; data: JsonValue } | { success: false; error: SyntaxError }`

Parses a JSON string without throwing errors for invalid JSON, mirroring Zod's
`safeParse` function.

It returns a result object the same as indicating success or failure.

- If successful, the object contains `success: true` and the parsed `data`.
- If parsing fails, it contains `success: false` and the `error` (SyntaxError).

```typescript
import { safeParse } from "jsr:@adamj/json-utils";

const result1 = safeParse('{"name": "Example"}');
if (result1.success) {
  console.log("Parsed data:", result1.data); // Output: Parsed data: { name: 'Example' }
}

const result2 = safeParse('{"name": "Example",}'); // Invalid trailing comma
if (!result2.success) {
  console.error("Parsing failed:", result2.error.message); // Output: Parsing failed: ...
}
```
