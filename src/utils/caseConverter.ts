/**
 * Converts a snake_case string to camelCase
 */
export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z0-9])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Converts a camelCase string to snake_case
 */
export function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Recursively converts object keys to camelCase
 */
export function keysToCamel<T = any>(obj: any): T {
  if (Array.isArray(obj)) {
    return obj.map((v) => keysToCamel(v)) as unknown as T;
  }
  if (obj !== null && typeof obj === 'object' && !(obj instanceof Date) && !(obj instanceof RegExp)) {
    // If it's a Sequelize instance with toJSON
    const target = typeof obj.toJSON === 'function' ? obj.toJSON() : obj;
    return Object.keys(target).reduce((result: any, key: string) => {
      const camelKey = snakeToCamel(key);
      result[camelKey] = keysToCamel(target[key]);
      return result;
    }, {}) as T;
  }
  return obj;
}

/**
 * Recursively converts object keys to snake_case
 */
export function keysToSnake<T = any>(obj: any): T {
  if (Array.isArray(obj)) {
    return obj.map((v) => keysToSnake(v)) as unknown as T;
  }
  if (obj !== null && typeof obj === 'object' && !(obj instanceof Date) && !(obj instanceof RegExp)) {
    return Object.keys(obj).reduce((result: any, key: string) => {
      const snakeKey = camelToSnake(key);
      result[snakeKey] = keysToSnake(obj[key]);
      return result;
    }, {}) as T;
  }
  return obj;
}

