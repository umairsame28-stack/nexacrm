/**
 * Encodes a cursor object (e.g. { id: "abc" }) to a base64 string.
 */
export function encodeCursor(data: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(data)).toString('base64');
}

/**
 * Decodes a base64 cursor string to an object.
 * Returns null if invalid.
 */
export function decodeCursor(cursor: string): Record<string, unknown> | null {
  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf8');
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Extracts the `id` field from a decoded cursor.
 */
export function cursorToId(cursor: string | undefined): string | undefined {
  if (!cursor) return undefined;
  const decoded = decodeCursor(cursor);
  if (!decoded || typeof decoded.id !== 'string') return undefined;
  return decoded.id;
}

/**
 * Standard paginated response shape.
 */
export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    hasNextPage: boolean;
    nextCursor: string | null;
    total?: number;
  };
}

/**
 * Builds a paginated result from an over-fetched array (length limit + 1).
 */
export function buildPaginatedResult<T extends { id: string }>(
  items: T[],
  limit: number,
  total?: number,
): PaginatedResult<T> {
  const hasNextPage = items.length > limit;
  const data = hasNextPage ? items.slice(0, limit) : items;
  const lastItem = data[data.length - 1];
  const nextCursor = hasNextPage && lastItem ? encodeCursor({ id: lastItem.id }) : null;

  return {
    data,
    pagination: {
      hasNextPage,
      nextCursor,
      total,
    },
  };
}
