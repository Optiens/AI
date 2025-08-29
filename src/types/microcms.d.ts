// types/microcms.d.ts

export type Solutions = {
  id: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  revisedAt: string;
  solutionName: string;
  slug: string;
  image: {
    url: string;
    width: number;
    height: number;
  };
  body: string;
  // 他にfieldsで取得している項目があれば追加してください
};

// microCMSから取得するニュース記事の型定義
export type News = {
  id: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  revisedAt: string;
  title: string;
  body: string; // リッチエディタのHTML内容
  slug: string; // URLスラッグ
  thumbnail?: { // サムネイル画像はOptional
    url: string;
    width: number;
    height: number;
  };
  // 必要に応じて他のフィールドを追加
};

// microCMSから取得する単一ページコンテンツの型定義
export type PageContent = {
  id: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  revisedAt: string;
  body: string; // リッチエディタのHTML内容
  // 必要に応じて他のフィールドを追加
};

// microCMSのAPIレスポンスの一般的な型定義（リスト形式の場合）
export type MicroCMSListResponse<T> = {
  contents: T[];
  totalCount: number;
  offset: number;
  limit: number;
};

// microCMSのAPIレスポンスの一般的な型定義（単一コンテンツの場合）
export type MicroCMSObjectContent<T> = T & {
  id: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  revisedAt: string;
};

// MicroCMSのAPIリクエストに含めるクエリパラメータの型定義
export type MicroCMSQueries = {
  orders?: string;
  fields?: string;
  limit?: number;
  offset?: number;
  q?: string;
  ids?: string;
  filters?: string;
};