// types/microcms.d.ts

// 公式SDKの型を活用（npm i microcms-js-sdk）
import type {
  MicroCMSDate,
  MicroCMSImage,
  MicroCMSContentId,
  MicroCMSListResponse,
  MicroCMSQueries as _MicroCMSQueries,
} from 'microcms-js-sdk'

/**
 * microCMSの全コンテンツが共通で持つメタ情報
 * microcms-js-sdk の MicroCMSDate / MicroCMSContentId を再利用
 */
export type BaseContent = MicroCMSContentId & MicroCMSDate & {
  /** スラッグ。URLに使う想定 */
  slug?: string
  /** SEO用（任意） */
  metaTitle?: string
  metaDescription?: string
  /** OGP画像（任意） */
  ogImage?: MicroCMSImage
}

/** -------------------------
 * Solutions（プロダクト/ソリューション）
 * ------------------------ */
export type Solutions = BaseContent & {
  /** 表示名 */
  solutionName: string
  /** メイン画像（必須なら MicroCMSImage、無い可能性があるならオプショナル） */
  image?: MicroCMSImage
  /** 本文（Rich Editor のHTML文字列） */
  body: string
  /** 任意：カテゴリ/タグのリレーション例（不要なら削除OK） */
  category?: Category | null
  tags?: Tag[]
}

/** -------------------------
 * News（お知らせ/ブログ）
 * ------------------------ */
export type News = BaseContent & {
  /** タイトル */
  title: string
  /** 本文（Rich Editor のHTML文字列） */
  body: string
  /** サムネイル（任意） */
  thumbnail?: MicroCMSImage
  /** 任意：公開フラグや著者なども追加可 */
  authorName?: string
  isFeatured?: boolean
}

/** -------------------------
 * 単一ページ（会社情報/ポリシーなど）
 * ------------------------ */
export type PageContent = BaseContent & {
  /** 本文（Rich Editor のHTML文字列） */
  body: string
}

/** -------------------------
 * 参考：カテゴリ/タグ（リレーション例）
 * ------------------------ */
export type Category = BaseContent & {
  name: string
}
export type Tag = BaseContent & {
  name: string
}

/** -------------------------
 * リストレスポンス（SDKの型をそのまま再公開）
 * ------------------------ */
export type { MicroCMSListResponse }

/** -------------------------
 * クエリ型：公式の MicroCMSQueries を拡張
 * - fields は文字列（カンマ区切り）でOK
 * - draftKey を追加（プレビュー時に使用）
 * ------------------------ */
export type MicroCMSQueries = _MicroCMSQueries & {
  /** プレビュー用 */
  draftKey?: string
}

/** -------------------------
 * よく使うユーティリティ型
 * ------------------------ */

/** 任意フィールドだけを取得したい時のヘルパー（fieldsと揃える） */
export type PickFields<T, K extends keyof T> = Pick<T, K>

/** 詳細取得（ID指定）の戻り型（BaseContentを含む） */
export type DetailResponse<T> = T & BaseContent

/** 以下、互換性維持のための旧型名エイリアス（必要に応じて残す） */
// 旧: MicroCMSObjectContent<T> 相当（BaseContentで代替）
export type MicroCMSObjectContent<T> = T & BaseContent
