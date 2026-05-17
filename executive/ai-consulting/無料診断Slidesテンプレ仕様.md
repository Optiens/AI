---
name: 無料診断レポート Google Slides テンプレ仕様 v1.0
date: 2026-05-07
status: 設計案（CEO承認後にGoogle Slidesに実装）
owner: CEO
related:
  - executive/ai-consulting/無料版vs有償版_定義.md (v2.1)
  - executive/marketing/brand-guideline.md (v1.0)
---

# 無料診断レポート Google Slides テンプレ仕様 v1.0

## 1. 全体構成

| Slide | タイトル | 内容 | プレースホルダー |
|---|---|---|---|
| 1 | 表紙 | 顧客名・診断日・Optiens ロゴ | `{{customer_name}}` `{{diagnosis_date}}` |
| 2 | 御社の現状サマリー | フォーム入力読み取り（200字以内） | `{{current_summary}}` |
| 3 | AI活用が効果的な業務 TOP3 | 業種×規模の汎用パターンから推定 | `{{top3_area_1}}` `{{top3_area_2}}` `{{top3_area_3}}` |
| 4 | 自動化／人間残しの方向性 | 業種特性に応じた判断軸（v2.1 追加） | `{{automation_direction}}` |
| 5 | チャット型／RAG／エージェントの効きどころ | どのタイプが効きそうか方向性（v2.1 追加） | `{{ai_type_recommendation}}` |
| 6 | 仕組みの記述 | 連携サービス名 + 処理の流れ（文章） | `{{mechanism_description}}` |
| 7 | ROI 試算 | 月間削減時間 × 標準時給 = 月間効果額 | `{{monthly_hours_saved}}` `{{monthly_value_yen}}` |
| 8 | コストレンジ | 「月額数千円程度」レベル | `{{cost_range}}` |
| 9 | 補助金の活用可能性 | 該当しうる補助金の名称のみ | `{{subsidies}}` |
| 10 | 次のステップ | 詳細レポート（¥5,500）への案内 | （固定文） |
| 11 | 裏表紙 | 連絡先・URL | （固定） |

合計 **11枚**（v2.0 では5〜8枚 → v2.1 で「方向性」レイヤー2枚追加して 11枚に拡張）

## 2. デザイン仕様

### スライドサイズ
- 16:9（標準ワイド）

### カラー
| 用途 | カラー | コード |
|---|---|---|
| 背景 | 純白 | `#FFFFFF` |
| 主要見出し | ラピス濃 | `#152870` |
| サブ見出し | ディープラピス | `#1F3A93` |
| 本文 | ダークスレート | `#0f172a` |
| アクセント（強調・グラデ終点） | 桜 | `#E48A95` |
| カード背景 | 薄グレー | `#F9FAFB` |
| 罫線 | 境界線 | `#E5E7EB` |
| **グラデ** | ディープラピス → 桜 | `linear-gradient(135deg, #1F3A93, #E48A95)` |

### フォント
- 和文: **Noto Sans JP**
- 欧文: **Inter**（または Helvetica）
- サイズ目安:
  - スライドタイトル: 32〜40pt
  - サブ見出し: 22〜28pt
  - 本文: 16〜18pt
  - キャプション: 12〜14pt

### 共通要素
- **左上**: Optiens ロゴ（小さく、20×20px相当）
- **右下**: ページ番号（「02 / 11」形式）
- **左下フッター**: optiens.com（小さく薄いグレー）
- **タイトル下にディープラピス→桜のグラデーションライン**（1px、装飾アクセント）

## 3. 各スライドの詳細仕様

### Slide 1: 表紙
```
┌──────────────────────────────────┐
│  [Optiensロゴ]                  │
│                                  │
│  AI活用診断 レポート              │
│  〜〜〜 (グラデライン)             │
│                                  │
│  {{customer_name}} 様            │
│                                  │
│  発行日: {{diagnosis_date}}      │
│                                  │
│  合同会社 Optiens               │
│  optiens.com                    │
└──────────────────────────────────┘
```

### Slide 2: 御社の現状サマリー
- 上部: 「Section 01 / 御社の現状」（小さめのEyebrow）
- 中央: 200字以内の要約
- 下部: 「※ 本レポートはフォーム入力をもとに、業種・規模に応じた汎用パターンから生成しています」

### Slide 3: AI活用が効果的な業務 TOP3
- 横並び3カラム or 縦並び3行
- 各カードに:
  - 番号バッジ（01/02/03）
  - 業務領域名
  - 1行の理由
  - 適合タイプアイコン（💬 チャット / 🔍 RAG / 🤖 エージェント）
- フッター: 「優先順位・構成案・概算費用は [詳細レポート（¥5,500税込）](https://optiens.com/free-diagnosis?paid=1) で整理します」

### Slide 4: 自動化／人間残しの方向性（v2.1 新規）
- 左カラム: 「**AIに任せやすい業務**」（ディープラピス枠）
  - 業種に応じた汎用列挙
- 右カラム: 「**人間に残すべき業務**」（桜枠）
  - 業種に応じた汎用列挙
- 下部メモ: 「※ 個別業務の具体的な仕分け案は詳細レポートで」

### Slide 5: チャット型／RAG／エージェントの効きどころ（v2.1 新規）
- 3つの矩形を横並び（チャット / RAG / エージェント）
- 各矩形に「適合度」バー（高/中/低）
- フッター: 「個別の導入順序・やらないこと・構成案は詳細レポートで」

### Slide 6: 仕組みの記述
- 文章説明（300〜500字）
- 連携サービス名: LINE公式 / freee / Googleカレンダー / Notion 等（業種に応じて）
- 「※ 個別の構成案は詳細レポートで」

### Slide 7: ROI 試算
- 大きな数字: 「月 ¥XX,XXX」（ディープラピス濃、太字、48pt）
- 計算式表示:
  ```
  月間削減時間: {{monthly_hours_saved}} 時間
  × 標準時給: ¥1,500
  = 月間効果額: {{monthly_value_yen}} 円
  ```
- 注記: 「※ 標準時給1,500円ベースの目安です」

### Slide 8: コストレンジ
- 大きな表示: 「月額数千円〜数万円程度」
- 注記: 「具体額は構成・規模により変動します。詳細レポートで個別試算をお届けします」

### Slide 9: 補助金の活用可能性
- 該当しうる補助金の名称リスト（最大3件）
- 注記: 「※ 補助金の申請書作成・申請サポートは Optiens の業務範囲外です」
- デジタル化補助金は除外（Optiens は IT導入支援事業者未登録）

### Slide 10: 次のステップ
```
┌──────────────────────────────────┐
│  次のステップ                     │
│  〜〜〜                            │
│                                  │
│  ✓ 詳細レポート（¥5,500税込）     │
│    - 優先順位とやらないこと       │
│    - 構成案と自動化提案 5〜7件    │
│    - 概算費用と次の一手           │
│    - 必要に応じてAI診断官β / スポット相談│
│                                  │
│  [お申し込みはこちら]             │
│  optiens.com/free-diagnosis?paid=1│
└──────────────────────────────────┘
```

### Slide 11: 裏表紙
```
┌──────────────────────────────────┐
│  ご質問・ご相談                   │
│                                  │
│  合同会社 Optiens               │
│  〒407-0301                      │
│  山梨県北杜市高根町清里3545-2483  │
│                                  │
│  Web: https://optiens.com        │
│  お問い合わせ: optiens.com/contact│
│                                  │
│  [Optiens ロゴ]                  │
└──────────────────────────────────┘
```

## 4. プレースホルダー命名規則

すべて `{{snake_case}}` 形式:

| プレースホルダー | 内容 | データ型 | 最大長 |
|---|---|---|---|
| `{{customer_name}}` | 顧客会社名 | string | 50 |
| `{{diagnosis_date}}` | 診断発行日 | string (YYYY/MM/DD) | 10 |
| `{{current_summary}}` | 現状サマリー | string | 200 |
| `{{top3_area_1/2/3}}` | TOP3業務領域名 | string | 30 |
| `{{top3_reason_1/2/3}}` | TOP3理由 | string | 60 |
| `{{top3_type_1/2/3}}` | 適合AIタイプ | enum (chat/RAG/agent) | - |
| `{{automation_direction}}` | 方向性メモ | string | 300 |
| `{{ai_type_recommendation}}` | AI種別の方向性 | string | 200 |
| `{{mechanism_description}}` | 仕組み説明 | string | 500 |
| `{{monthly_hours_saved}}` | 月間削減時間 | number (10〜200) | - |
| `{{monthly_value_yen}}` | 月間効果額 | number (¥15,000〜¥300,000) | - |
| `{{cost_range}}` | コストレンジ | enum | - |
| `{{subsidies}}` | 補助金名リスト | array of string (max 3) | - |

## 5. JSON Schema（Claude API 構造化出力用）

```typescript
const DiagnosisOutputSchema = {
  type: "object",
  required: ["current_summary", "top3", "automation_direction", "ai_type_recommendation",
             "mechanism_description", "roi", "cost_range", "subsidies"],
  properties: {
    current_summary: { type: "string", maxLength: 200 },
    top3: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        required: ["area", "reason", "type"],
        properties: {
          area: { type: "string", maxLength: 30 },
          reason: { type: "string", maxLength: 60 },
          type: { type: "string", enum: ["chat", "RAG", "agent"] },
        },
      },
    },
    automation_direction: { type: "string", maxLength: 300 },
    ai_type_recommendation: { type: "string", maxLength: 200 },
    mechanism_description: { type: "string", maxLength: 500 },
    roi: {
      type: "object",
      required: ["monthly_hours_saved", "monthly_value_yen"],
      properties: {
        monthly_hours_saved: { type: "number", minimum: 10, maximum: 200 },
        monthly_value_yen: { type: "number", minimum: 15000, maximum: 300000 },
      },
    },
    cost_range: {
      type: "string",
      enum: ["月額数千円程度", "月額1〜3万円程度", "月額3〜10万円程度"],
    },
    subsidies: {
      type: "array",
      maxItems: 3,
      items: { type: "string", maxLength: 50 },
    },
  },
};
```

## 6. バリデーションルール（Edge Function内）

1. **JSON Schema 検証**: 上記スキーマを満たさなければ `manual_review`
2. **プレースホルダー残存チェック**: `{{`, `[未入力]`, `XXX`, `TODO`, `T.B.D.` が含まれていればエラー
3. **整合性チェック**:
   - `monthly_value_yen ≈ monthly_hours_saved × 1500` （±10%以内）
   - `top3` 全項目に `area` と `reason` が埋まっている
4. **長さチェック**: 各フィールドの maxLength 超過は切り詰め or エラー

## 7. テンプレ作成手順（Optiens 内製）

1. Google Slides で新規プレゼンテーション作成
2. 上記11スライドを Brand Guideline 準拠で手動デザイン
3. プレースホルダー文字列（`{{customer_name}}` 等）を **そのまま** テンプレ内に埋め込む
4. テンプレを Drive に保存し、Service Account にアクセス権付与
5. テンプレ ID を Edge Function の環境変数に設定
6. Edge Function は Slides API で:
   - テンプレをコピー
   - `BatchUpdate` で `replaceAllText` を使ってプレースホルダーを置換
   - Drive API で共有設定を「リンクを知っている人 / 閲覧者」に変更

## 8. CEO レビューチェックリスト

公開前に CEO が確認:
- [ ] Brand Guideline v1.0 と整合（カラー・フォント・トーン）
- [ ] 設立日 2026-04-06 ・法人番号等の事実関係
- [ ] 「無料版で約束していい内容」のみ（v2.1 定義書と整合）
- [ ] 詳細レポート（¥5,500税込）への誘導が明示
- [ ] 補助金は名称のみ・デジタル化補助金除外
- [ ] AIツール固有名詞（Claude/ChatGPT等）が出ていない
- [ ] アーキテクチャ図が含まれていない
- [ ] 文体: 過度な煽りなし
- [ ] 連絡先・URL の正確性

## 9. 改訂履歴

| 日付 | バージョン | 変更内容 |
|---|---|---|
| 2026-05-07 | v1.0 | 初版作成。v2.1「方向性」レイヤー反映、Brand Guideline v1.0 準拠 |
