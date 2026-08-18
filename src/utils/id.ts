export function createId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  /*
   * Fallback for environments where
   * randomUUID() is unavailable.
   *
   * Important: this function must call
   * crypto.randomUUID() above — never
   * createId() itself.
   */
  const bytes = crypto.getRandomValues(new Uint8Array(16));

  /*
   * UUID v4 version and variant bits.
   */
  bytes[6] = (bytes[6] & 0x0f) | 0x40;

  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));

  return [
    hex.slice(0, 4).join(""),
    hex.slice(4, 6).join(""),
    hex.slice(6, 8).join(""),
    hex.slice(8, 10).join(""),
    hex.slice(10, 16).join(""),
  ].join("-");
}
