# Optiens — Claude Code コンテキスト

## 事業概要
- **法人名**: 合同会社 Optiens（オプティエンス）※2026年4月設立予定
- **事業**: 閉鎖循環型水耕栽培モジュールの開発・販売＋運用SaaS（月額）
- **ターゲット**: 医療機関・防災拠点・孤立環境（離島・船舶・地下施設）
- **収益モデル**: ハード販売＋保守＋運用SaaS月額（遠隔監視・最適化・技術サポートを含む）
- **体制**: 代表1名（リーン開発）

## 禁止事項（必ず守る）
- 宇宙・宇宙農業に関する記述を追加・残さない
- 消費者向け（食育・家庭用・「美味しい」等）の訴求を追加しない
- 農家向け記述（後継者不足等）を追加しない
- コンサルティングを独立した収益モデルとして記述しない（SaaSに含む）
- 社保スキームをサイトに記載しない

## ブランドカラー
- Primary: `#2e574c` / Secondary: `#5ea89a` / Accent: `#ea4335`

## ロードマップ（変更不可）
- Phase 0: ～2026/6（設立・登記・BOM確定）
- Phase 1: 2026/7～2027/3（プロト・実証・SaaS v1）
- Phase 2: 2027/4～2028/3（連続運転・SOP・SaaS有償3社）
- Phase 3: 2028/4～2029/3（有償パイロット・SaaS10社以上）

## 技術スタック（サイト）
- Astro 5 + TypeScript、SSR on Vercel（hnd1）
- Content Collections（`src/content/blog/`）でブログ管理
- スタイル: scoped CSS + global.css（prose, card, hero等の共通クラス）
- デプロイ: `npx astro build` → Vercel

## 技術スタック（IoT/MVP）
- エッジ: Raspberry Pi + Node-RED（フロー制御・センサー統合）
- データ保存: InfluxDB（時系列）
- ダッシュボード: Grafana（監視・アラート）
- 画像認識: OpenCV + TensorFlow Lite
- クラウド/SaaS基盤: Supabase（DB・Auth・Edge Functions）
- ※GASはIoTリアルタイムデータ処理には使用しない

## 重要ファイル
- 詳細設計: `memory/SESSION.md`
- 事業計画書: `public/合同会社Optiens_事業計画書.pdf`
- エージェント: `.claude/agents/`
- スキル: `.claude/skills/`
- 詳細APIガイド: → 必要時 `docs/` 以下を参照

## AIエージェントへの行動規範
1. Plan Modeで作業概要を確認してから実装に進む
2. 不可逆的な操作（削除・git push等）は必ず確認を求める
3. 事業方針・ターゲット・ロードマップを変更する提案は人間の承認を得る
4. 補助金申請書やINVESTORSページの記述変更は特に慎重に扱う
