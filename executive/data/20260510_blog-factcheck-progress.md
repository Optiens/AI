# ブログ全記事ファクトチェック進捗

**開始日**: 2026-05-10
**対象**: src/content/blog/*.md（全 104 記事、`_project-status.md` 除く）
**進め方**: 5 記事ずつバッチ実行
**重大度**: Critical（虚偽・致命的） / Important（要修正・正確性懸念） / Minor（軽微）

---

## 進捗サマリー

| バッチ | 記事範囲 | 状態 | Critical | Important | Minor |
|---|---|---|---:|---:|---:|
| Batch 01 | 2026-01-26 〜 2026-03-06（5本） | ✅ 完了 | 0 | 7 | 3 |
| Batch 02 | 2026-03-09 〜 2026-03-23（5本予定） | 未着手 | - | - | - |
| ... | ... | ... | - | - | - |

---

## Batch 01: ✅ 完了

対象:
1. `generative-ai-business-2025.md`
2. `food-security-japan-2030.md`
3. `hydroponics-water-efficiency.md`
4. `official-website-launch.md`
5. `ai-agriculture-revolution-2025.md`

### 検出事項（Important）

| # | 記事 | 主張 | 修正後 | 出典 |
|---|---|---|---|---|
| 1 | generative-ai-business-2025 | 「2023年のChatGPT登場以来」 | 「2022年11月のChatGPT登場以来」 | OpenAI 公式（2022-11-30 公開） |
| 2 | food-security-japan-2030 | 「2023年度に38%まで低下」 | 「2023年度も38%にとどまり、3年連続で低水準」 | 農水省「食料需給表」 |
| 3 | food-security-japan-2030 | 「黒字化施設は半数程度」 | 「人工光型は黒字化2割弱」 | 日本施設園芸協会 R4年度実態調査 |
| 4 | hydroponics-water-efficiency | 「2050年100億人・食料1.5倍」 | 「2050年約97億人・2010年比50%以上増」 | UN WPP 2024 中位推計、WRI |
| 5 | official-website-launch | 「月額ライセンス料に縛られない」 | 「SaaSの月額ライセンス料に縛られない（任意の保守プランは別途）」 | 自社プラン整合 |
| 6 | ai-agriculture-revolution-2025 | 「2025年、〜進化を遂げています」+ タイトル「2025年の最前線」 | 「2025〜2026年〜急速に進化」+ タイトル「2025〜2026年の最前線」 | 公開日整合 |
| 7 | ai-agriculture-revolution-2025 | 「農薬使用量を最大40%削減」 | 「30〜90%削減（例: Blue River See & Sprayでは最大90%）」 | Built In, Greeneye Tech 等 |

### 検出事項（Minor）

| # | 記事 | 内容 |
|---|---|---|
| 1 | hydroponics-water-efficiency | 「世界の淡水70%」FAOは正確には約69%。出典明記推奨（修正なし） |
| 2 | hydroponics-water-efficiency | 80–90%削減は学術範囲内（修正なし） |
| 3 | ai-agriculture-revolution-2025 | 「誤差5%」を「先進事例」と限定する表現に修正済み |

### 修正対応: ✅ コミット予定

---

## 並行作業: 非日付プレフィックス記事 23 本の画像再生成

「水耕栽培の画像もおかしなものがあるため」のオーナー指示により、Batch 1 完了と同時に Imagen 4 Ultra で全 23 件再生成。

### 副次対応
- ai-agriculture-revolution-2025.md: image パス `ai-agriculture-revolution.png` → `ai-agriculture-revolution-2025.webp`
- food-security-japan-2030.md: `.png` → `.webp`
- generative-ai-business-2025.md: `.png` → `.webp`
- hydroponics-automation-global-market-2026.md: `hydroponics-automation-global-market.png` → `hydroponics-automation-global-market-2026.webp`
- hydroponics-water-efficiency.md: `.png` → `.webp`
- 旧 `.png` 6 ファイル（unreferenced）を削除

### コスト
- Imagen 4 Ultra: 23 × $0.06 × ¥150 ≒ ¥207
- 累計（5/9-10 全画像）: 約 ¥465 / クレジット残 ¥40,990

---

## 次バッチ予定

**Batch 02**: 2026-03-09 〜 2026-03-23
- hydroponics-automation-global-market-2026.md
- hydroponics-startup-cost-breakeven.md
- a-type-welfare-hydroponics-wages.md
- ai-plant-health-image-recognition.md
- food-miles-local-production-indoor-farming.md
