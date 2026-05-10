/**
 * ブログ記事の公開判定ヘルパー
 *
 * 公開条件:
 * - draft: true でないこと（未指定は公開扱い）
 * - 公開日（date フロントマター）が今日以前であること（未来日は非公開）
 *
 * Astro の Content Collection の post.data を受け取り、boolean を返す。
 */
type PostLike = {
  data: {
    date: string;
    draft?: boolean;
  };
};

export function isPublished(post: PostLike, now: Date = new Date()): boolean {
  if (post.data.draft === true) return false;

  // 日付パース（YYYY-MM-DD or YYYY/MM/DD）
  const d = new Date(post.data.date);
  if (Number.isNaN(d.getTime())) return false;

  // 比較は日付単位（時刻を 23:59:59 に丸めて当日中も含める）
  const endOfPostDay = new Date(d);
  endOfPostDay.setHours(23, 59, 59, 999);

  return endOfPostDay.getTime() <= now.getTime() ||
    d.toDateString() === now.toDateString();
}

export function filterPublishedPosts<T extends PostLike>(posts: T[], now: Date = new Date()): T[] {
  return posts.filter((p) => isPublished(p, now));
}
