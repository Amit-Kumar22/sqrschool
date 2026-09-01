// Shared helpers for plain `<input type="date">` fields that talk to API
// fields typed as full ISO datetime strings. Uses a plain string slice rather
// than round-tripping through `Date`, which would shift the date near
// midnight depending on the browser's timezone.

/** ISO datetime string -> "yyyy-mm-dd" for a date input's value. */
export const toDateInput = (iso: string): string => (iso ? iso.slice(0, 10) : '');

/** "yyyy-mm-dd" from a date input -> a full ISO datetime string (midnight UTC) for the API. */
export const fromDateInput = (value: string): string => (value ? `${value}T00:00:00.000Z` : '');
