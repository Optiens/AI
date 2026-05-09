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
| Batch 02 | 2026-03-09 〜 2026-03-20（5本） | ✅ 完了 | 2 | 9 | 10 |
| Batch 03 | 2026-03-23 〜 （次バッチ） | 未着手 | - | - | - |

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

## Batch 02: ✅ 完了

対象:
1. `hydroponics-automation-global-market-2026.md`（2026-03-09）
2. `hydroponics-startup-cost-breakeven.md`（2026-03-13）
3. `a-type-welfare-hydroponics-wages.md`（2026-03-16）
4. `ai-plant-health-image-recognition.md`（2026-03-18）
5. `food-miles-local-production-indoor-farming.md`（2026-03-20）

### 検出事項（Critical: 2件）

| # | 記事 | 主張 | 修正後 | 出典 |
|---|---|---|---|---|
| 1 | hydroponics-automation-global-market-2026 | 「日本垂直農法市場 2025年10月時点で6.8億ドル」 | 「2024年で約4〜5億ドル規模」 | Grand View Research, IMARC |
| 2 | a-type-welfare-hydroponics-wages | A型平均賃金「約8万3,000円（令和5年度）」 | 「86,752円（令和5年度）」 | 厚労省 令和5年度工賃実績 |

### 検出事項（Important: 9件）

| # | 記事 | 修正概要 |
|---|---|---|
| 1 | 自動化市場 | FAO「25-70%増」→「60-70%増」（25%下限の出典なし） |
| 2 | 自動化市場 | オランダ12階建て・4,500トン詳細 → 「都市部設置を促す動き」レベルに緩和（VegOut単独情報源） |
| 3 | 自動化市場 | 北米シェア35.2%/APAC 28.3% → レンジ表記（30-40%/25-28%） |
| 4 | 自動化市場 | 倒産企業表現 → 「事業停止・破綻」+ 各社状況詳細（AeroFarms再建、Plenty追加） |
| 5 | 自動化市場 | 古賀大貴「テスラのロードスター戦略」直接引用 → 「テスラ型のプレミアム戦略」 |
| 6 | 自動化市場 | 農業ロボット市場「200億ドル超」 → 「80〜200億ドル（推計機関により幅）」 |
| 7 | 自動化市場 | Local Bounti「前年比50%増」 → 「2023・2024年とも38〜42%増」 |
| 8 | フードマイル | CO2排出原単位の年度・出典明記（IATA / 国交省過去値、最新値補記） |

### 検出事項（Minor: 10件）

| # | 記事 | 修正概要 |
|---|---|---|
| 1 | 自動化市場 | CNN精度「99.2%」→「99.35%」（Mohanty et al., 2016 出典明記） |
| 2 | 自動化市場 | ピッキング速度「最大40%向上」→「数倍規模」（出典確認できず） |
| 3 | 損益分岐点 | LED 20%/30%経験則 → 「Optiens運用KPI」と表記 |
| 4 | 損益分岐点 | バジル価格 → 「地元レストラン直販想定価格」と販路限定 |
| 5 | A型工賃 | わーくはぴねす農園「500社超」 → 「700社超・累計5,000名以上」（最新数値） |
| 6 | AI画像認識 | PlantVillage「38作物」→「14作物・26病害・38クラス」 |
| 7 | AI画像認識 | Penn State単独 → 「Penn State + EPFL 共同研究」 |
| 8 | AI画像認識 | Plantix「数百万人」→「1,000万ダウンロード超、月間100万人規模」 |
| 9 | フードマイル | 「1994年ティム・ラング提唱」→「1990年代初頭にSAFE Allianceで提唱、1994年Paxton執筆」 |
| 10 | フードマイル | ロス率「5-10%」→ 「平成17年度試算」と出典明記 |

### 修正対応: ✅ コミット予定

---

## 次バッチ予定

**Batch 03**: 2026-03-23 〜（次の5本）
- iot-ai-hydroponic-herb-production.md（2026-03-23）
- mqtt-supabase-farm-dashboard.md（2026-03-25）
- abandoned-school-agriculture-revitalization.md（2026-03-27）
- welfare-hydroponics-social-impact.md（2026-03-30）
- mcp-model-context-protocol-farm-control.md（2026-04-01）
