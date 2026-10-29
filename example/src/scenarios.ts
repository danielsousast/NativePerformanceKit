export const CHUNK_BYTES = 16 * 1024 * 1024;
export const MAX_CHUNKS = 10;
export const FRAME_LOAD_MS = 5000;
export const FRAME_LOAD_VIEWS = 1500;

/**
 * Allocates and touches one chunk so its pages are resident (a zero-filled buffer may not be
 * committed until written). Returns false once the cap is reached.
 */
export function allocateChunk(held: Uint8Array[]): boolean {
  if (held.length >= MAX_CHUNKS) {
    return false;
  }
  held.push(new Uint8Array(CHUNK_BYTES).fill(1));
  return true;
}
