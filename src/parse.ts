import type { JsonValue } from "./types.ts";

/**
 * Parses a JSON string into a `JsonValue`.
 * This is a thin wrapper around `JSON.parse()`.
 * It assumes the input string represents valid JSON; otherwise, it throws an error.
 *
 * @param jsonString The JSON string to parse.
 * @returns The parsed `JsonValue`.
 * @throws {SyntaxError} If the `jsonString` is not valid JSON.
 */
export function parse(jsonString: string): JsonValue {
	// Attempt to parse the string
	const parsedData: unknown = JSON.parse(jsonString);

	// Although JSON.parse returns 'any', we treat it as 'unknown' initially.
	// If JSON.parse succeeded without throwing, the structure inherently
	// conforms to what JsonValue can represent (primitives, objects, arrays).
	// No deep validation is needed here beyond what JSON.parse provides.
	return parsedData as JsonValue;
}

/**
 * Safely parses a JSON string, returning a result object indicating success or failure.
 * Does not throw errors for invalid JSON.
 *
 * @param jsonString The string to parse.
 * @returns An object with `success: true` and the parsed `data` (as `JsonValue`) if successful,
 * or an object with `success: false` and the `error` (SyntaxError) if parsing fails.
 */
export function safeParse(
	jsonString: string,
): { success: true; data: JsonValue } | { success: false; error: SyntaxError } {
	try {
		const data = parse(jsonString);
		return { success: true, data: data };
	} catch (error) {
		// Check if the error is specifically a SyntaxError, which JSON.parse throws for invalid JSON.
		if (error instanceof SyntaxError) {
			return { success: false, error: error };
		}
		// If it's another type of error (less likely here but possible in complex scenarios),
		// wrap it in a generic SyntaxError to maintain a consistent error type in the failure case.
		return {
			success: false,
			error: new SyntaxError(`Unknown parsing error: ${error}`),
		};
	}
}
