/**
 * Blog publishing helpers.
 *
 * Dates in frontmatter are authored as Japan business dates. Vercel builds run
 * in UTC, so comparing `YYYY-MM-DD` with the server-local date can hide posts
 * during the first several hours of a Japan-time publish day.
 */
type PostLike = {
  data: {
    date: string;
    draft?: boolean;
  };
};

const tokyoDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Tokyo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function tokyoDateKey(date: Date): string {
  const parts = tokyoDateFormatter.formatToParts(date);
  const year = parts.find((p) => p.type === 'year')?.value;
  const month = parts.find((p) => p.type === 'month')?.value;
  const day = parts.find((p) => p.type === 'day')?.value;
  return `${year}-${month}-${day}`;
}

function normalizePostDateKey(value: string): string | null {
  const dateOnly = value.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (dateOnly) {
    const [, year, month, day] = dateOnly;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return tokyoDateKey(parsed);
}

export function isPublished(post: PostLike, now: Date = new Date()): boolean {
  if (post.data.draft === true) return false;

  const postDateKey = normalizePostDateKey(post.data.date);
  if (!postDateKey) return false;

  return postDateKey <= tokyoDateKey(now);
}

export function filterPublishedPosts<T extends PostLike>(posts: T[], now: Date = new Date()): T[] {
  return posts.filter((p) => isPublished(p, now));
}
