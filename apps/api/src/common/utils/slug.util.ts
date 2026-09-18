/**
 * Converts a string to a URL-safe slug.
 * e.g. "Acme Corp" → "acme-corp"
 */
export function toSlug(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^a-z0-9\s-]/g, '')   // remove non-alphanumeric
    .replace(/\s+/g, '-')            // spaces to hyphens
    .replace(/-+/g, '-')             // collapse consecutive hyphens
    .replace(/^-|-$/g, '');          // trim leading/trailing hyphens
}

/**
 * Appends a numeric suffix to make a slug unique.
 * e.g. "acme-corp" → "acme-corp-2"
 */
export function uniqueSlug(base: string, suffix: number): string {
  return `${base}-${suffix}`;
}
