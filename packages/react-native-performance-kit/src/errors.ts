export type PerformanceKitErrorCode =
  'E_INVALID_INTERVAL' | 'E_MEMORY_UNAVAILABLE' | 'E_UNKNOWN';

const KNOWN_CODES: readonly string[] = [
  'E_INVALID_INTERVAL',
  'E_MEMORY_UNAVAILABLE',
];

/** Every failure of the public API is a `PerformanceKitError` with a stable `code`. */
export class PerformanceKitError extends Error {
  readonly code: PerformanceKitErrorCode;

  constructor(code: PerformanceKitErrorCode, message: string) {
    super(message);
    this.name = 'PerformanceKitError';
    this.code = code;
  }
}

/** Maps anything thrown by the native module (or validation) to a `PerformanceKitError`. */
export function normalizeError(error: unknown): PerformanceKitError {
  if (error instanceof PerformanceKitError) {
    return error;
  }
  const { code, message } = (error ?? {}) as {
    code?: unknown;
    message?: unknown;
  };
  return new PerformanceKitError(
    typeof code === 'string' && KNOWN_CODES.includes(code)
      ? (code as PerformanceKitErrorCode)
      : 'E_UNKNOWN',
    typeof message === 'string' ? message : 'Unknown native error'
  );
}
