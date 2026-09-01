import { v4 as uuidv4 } from "uuid";

export class IdempotencyUtil {
  static generateKey(): string {
    return uuidv4();
  }

  static isValidKey(key: string): boolean {
    const UUID_REGEX =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return UUID_REGEX.test(key);
  }
}
