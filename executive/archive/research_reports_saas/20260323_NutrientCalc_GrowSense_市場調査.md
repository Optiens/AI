---
source: Web検索（Google）・GitHub・Reddit・各社公式サイト・市場調査レポート各社
date: 2026-03-23
category: 市場調査（競合・新規プロダクト検証）
status: FINAL
owner: market-researcher（リサーチ部）
---

# NutrientCalc Pro / GrowSense Hub — 競合・市場調査レポート

**調査日時**: 2026年3月23日
**調査者**: market-researcher（リサーチ部）

---

## エグゼクティブサマリー

1. **養液計算ツール市場は「無料が当たり前」の世界**。HydroBuddy（OSS）を筆頭に主要ツールはすべて無料。有償SaaS化には「AIによる自動最適化」「水質データ連携」など明確な差別化が不可欠。
2. **水耕IoTモニタリングのOSSはMycodo（GitHub 3,200+ stars）が支配的**。ただしUXが技術者向けで初心者には敷居が高い。
3. **水耕栽培市場全体はCAGR 8.7〜13%で成長中**（2025年 約$6〜17B）。ホビー層のRedditコミュニティは推定50万人超。

---

## Part 1: NutrientCalc Pro

### 既存の養液計算ツール

| ツール名 | 価格 | プラットフォーム | 最終更新 | 特徴 |
|---|---|---|---|---|
| **HydroBuddy** | 無料(OSS) | Win/Mac/Linux/Android | 2022年頃 | 最も知名度高い。化学者が開発。開発停止気味 |
| **NuteMix** | 無料 | ブラウザ | 2025年アクティブ | HydroBuddy代替。プリセットあり |
| **BudLabs** | 無料 | iOS/Android | アクティブ | Advanced Nutrients社公式。同社製品専用 |
| **Growee** | ハード$995〜 | iOS/Android | アクティブ | IoTデバイスとセット。自動pH/EC制御 |
| **HydroCal** | 無料(OSS) | ブラウザ | 不明 | シンプルなJS計算機 |

### ユーザーの不満（Reddit/フォーラム）

- HydroBuddyは「化学の知識がないと使えない」「UI古すぎ」「EC推定が不正確」
- 初心者の最大ペイン: pH/EC管理の混乱、水源の水質考慮が困難、成長ステージ別調整がわからない
- HydroBuddy開発停止（2022年〜）で後継ツールを求める声あり

### 市場規模

- グローバル水耕栽培市場: $6〜17B（2025年）、CAGR 8.7〜13%
- 英語圏ホビー層: 推定50〜100万人（Reddit r/hydroponics 30万〜50万人超）
- **MRR試算**: ホビー5万人TAM × 無料1万人獲得 × 有償転換3% = 300人 × $8/月 = **$2,400/月**

---

## Part 2: GrowSense Hub

### 既存OSS水耕IoTプロジェクト

| プロジェクト | Stars | 最終更新 | 特徴 |
|---|---|---|---|
| **Mycodo** | 3,200+ | 2025年10月 | RPi環境モニタリング+PID制御。最も活発 |
| **DRO-Matic** | 326 | 2018年（停止） | Arduino水耕自動化OS |
| **hydromisc** | 295 | 2024年 | ESP32 EC/pH計測+ポンプ制御 |
| **OpenMinder** | 少数 | 2018年（停止） | Autogrow社RPi HAT |
| **OpenAg (MIT)** | — | 終了 | 不祥事で2019年終了 |

### OSSプレミアム成功事例

| プロジェクト | ARR | モデル |
|---|---|---|
| Plausible Analytics（2人チーム） | $3.1M/年 | OSS + Cloud SaaS |
| Home Assistant / Nabu Casa | 推定$15〜30M/年 | OSS + Cloud $6.50/月 |
| ソロ開発者事例 | $14.2K/月 | OSS + プレミアム |

### DIYコミュニティ規模

- RPi水耕DIYビルダー: 推定1〜3万人（英語圏）
- Home Assistant 200万インストールへの連携で拡大可能性あり

---

## 示唆

- NutrientCalc Pro: TAMは小さい（$2,400/月上限）が、参入ハードルも低い
- GrowSense Hub: Mycodoが強いが、モダンUI+モバイル+AI異常検知で差別化余地あり
- 両方ともホビー（消費者向け）ターゲットであり、CLAUDE.mdの方針変更が必要
