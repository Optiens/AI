---
date: 2026-03-10
status: final
owner: architecture-agent
---

# リポジトリ構成推奨レポート — モノレポ vs 分離リポジトリ

> **対象**: Optiens IoT・SaaSシステム開発体制の整備
> **前提**: 代表1名・リーン開発・Claude Code活用・GitHub Actions CI/CD想定

---

## 1. 結論（推奨案）

**案C（ハイブリッド分離）を推奨する。** 具体的には、`optiens-hydroponics` はWebサイト専用のまま維持し、新規に `optiens-iot` リポジトリを作成してIoT・SaaSコードを集約する。ただし `optiens-iot` の内部構造はモノレポ的にエッジ・クラウド・管理画面を一括管理する。この構成により、Webサイトデプロイ（Vercel）とIoTシステムデプロイ（Supabase + RPi OTA）のCI/CDパイプラインを独立させつつ、IoT側コンポーネント間の共有型定義（センサーデータスキーマ等）を一元管理できる。1名体制でのコンテキスト管理コストを最小化しながら、将来のSaaSスケールアウトに耐える構造を今から確保できる点が決め手である。

---

## 2. 比較表

| 評価観点 | 案A: 既存リポジトリ拡張（完全モノレポ） | 案B: 完全分離（website / iot） | 案C: ハイブリッド分離（推奨） |
|---|---|---|---|
| **セットアップ工数** | 最小（今すぐ追加可能） | 中（新リポジトリ作成・初期設定） | 中（新リポジトリ1つ作成） |
| **1名体制での管理** | 一見シンプルだが `astro.config.mjs` や `node_modules` がPythonコードと混在しノイズが大きい | 2リポジトリを並行管理する認知負荷あり | IoT側は1リポジトリに集約、認知負荷は案Bと同等だが整理されている |
| **Vercel デプロイ** | IoTコードの変更でも毎回Vercelビルドがトリガーされる（無駄・リスク） | 完全に独立 | 完全に独立 |
| **CI/CD独立性** | Webサイト・RPi OTA・Supabaseマイグレーションが同一ワークフロー内に混在し複雑化 | 独立 | 独立 |
| **型定義・スキーマ共有** | 容易（同一リポジトリ） | 別途 shared パッケージ（npm private）が必要 | `optiens-iot/shared/` として内包（シンプル） |
| **Supabase CLIとの親和性** | `supabase/` を website ルートに置くと Supabase CLI のプロジェクトルート検出が競合しやすい | IoTリポジトリに独立して置ける | IoTリポジトリのルートに配置、干渉なし |
| **RPi OTA管理** | website のビルド成果物と混在するリスク | 独立 | 独立 |
| **将来のマルチリポジトリ化** | 分離コストが後で大きくなる（git history の分割が必要） | 既に分離済み | 既に適切に分離済み |
| **アクセス制御** | Webサイトリポジトリにセンサーキー・Supabase秘密鍵等が混入するリスク | シークレットをリポジトリ単位で分離可能 | シークレットをリポジトリ単位で分離可能 |
| **Claude Code コンテキスト** | 全コードが1コンテキストに入るため、WebサイトのClaude操作時にIoTコードが干渉する | コンテキストが明確に分離 | コンテキストが明確に分離 |
| **Phase 1〜3 スケーラビリティ** | 管理画面（Next.js等）追加時にリポジトリが肥大化 | IoTリポジトリ内で拡張可能 | IoTリポジトリ内で自然に拡張可能 |

### 採点サマリー（5点満点）

| 観点 | 案A | 案B | 案C |
|---|:---:|:---:|:---:|
| 初期セットアップ | 5 | 3 | 4 |
| 長期管理コスト | 2 | 4 | 5 |
| CI/CDクリーン度 | 2 | 5 | 5 |
| セキュリティ分離 | 2 | 5 | 5 |
| 型共有・一貫性 | 5 | 2 | 4 |
| SaaSスケール適合 | 2 | 4 | 5 |
| **合計** | **18** | **23** | **28** |

---

## 3. 推奨案C の詳細ディレクトリ構成

### リポジトリ1: `optiens-hydroponics`（現状維持）

```
optiens-hydroponics/               ← GitHub: optiens-hydroponics
├── src/
│   ├── pages/
│   │   ├── index.astro
│   │   ├── about.astro
│   │   ├── investors.astro
│   │   ├── roadmap.astro
│   │   ├── solutions/
│   │   ├── blog/
│   │   └── contact.astro
│   ├── components/
│   ├── layouts/
│   ├── content/
│   │   ├── blog/              ← Content Collections
│   │   └── config.ts
│   └── assets/
├── public/
├── astro.config.mjs
├── package.json
├── tsconfig.json
└── .github/
    └── workflows/
        └── deploy.yml         ← Vercel デプロイのみ
```

### リポジトリ2: `optiens-iot`（新規作成）

```
optiens-iot/                   ← GitHub: optiens-iot
│
├── edge/                      ← RPi エッジデバイスコード
│   ├── sensors/               ← センサー読取モジュール
│   │   ├── bme280.py          ← 温湿度・気圧
│   │   ├── ph_sensor.py       ← pH
│   │   ├── ec_sensor.py       ← 電気伝導度
│   │   └── light_ppfd.py      ← 光量子束密度
│   ├── camera/                ← カメラ撮影・画像処理
│   │   ├── capture.py
│   │   └── upload.py          ← Supabase Storage アップロード
│   ├── actuators/             ← ポンプ・ファン・照明制御
│   │   ├── pump.py
│   │   ├── fan.py
│   │   └── lights.py
│   ├── agent/                 ← メインループ・コマンドポーリング
│   │   ├── main.py
│   │   ├── command_poller.py  ← Supabase commands テーブルをポーリング
│   │   └── state_reporter.py  ← デバイス状態を Supabase に送信
│   ├── config/
│   │   ├── device.env.example ← device_id, supabase_url, supabase_key等
│   │   └── settings.py
│   ├── tests/                 ← ユニットテスト（pytest）
│   ├── requirements.txt
│   └── README.md
│
├── supabase/                  ← Supabase プロジェクト設定
│   ├── config.toml            ← Supabase CLI設定
│   ├── migrations/            ← DBマイグレーション（順番管理）
│   │   ├── 20260310_001_initial_schema.sql
│   │   ├── 20260310_002_add_commands_table.sql
│   │   └── ...
│   ├── functions/             ← Edge Functions（Deno/TypeScript）
│   │   ├── ingest-sensor/     ← センサーデータ受信・バリデーション
│   │   │   └── index.ts
│   │   ├── command-dispatch/  ← RPiへのコマンドキュー投入
│   │   │   └── index.ts
│   │   ├── alert-engine/      ← 閾値超過アラート処理
│   │   │   └── index.ts
│   │   └── _shared/           ← Edge Functions 間の共有コード
│   │       ├── types.ts       ← センサーデータ型定義
│   │       └── constants.ts
│   ├── seed/
│   │   └── demo_data.sql      ← 開発・デモ用シードデータ
│   └── tests/                 ← Edge Functions テスト（Deno test）
│
├── shared/                    ← エッジ・クラウド共通の定義
│   ├── schema/
│   │   ├── sensor_data.json   ← JSON Schema（データ検証の正典）
│   │   └── commands.json
│   └── docs/
│       └── api-reference.md   ← Edge Functions API仕様
│
├── dashboard/                 ← 将来の管理画面（Phase 2〜）
│   └── .gitkeep               ← 現在は空（Next.js or Astro で後で実装）
│
├── ota/                       ← RPi OTA更新の仕組み
│   ├── deploy.sh              ← rsync ベースのデプロイスクリプト
│   ├── inventory.yml          ← デバイスインベントリ（Ansible形式）
│   └── README.md
│
├── docs/                      ← 設計ドキュメント
│   ├── architecture.md
│   ├── data-model.md
│   ├── ota-process.md
│   └── api-versioning.md
│
├── .github/
│   └── workflows/
│       ├── edge-tests.yml     ← pytest (Python edge code)
│       ├── supabase-deploy.yml← supabase db push + functions deploy
│       └── ota-deploy.yml     ← 手動トリガー: 指定デバイスへOTA
│
├── .gitignore                 ← *.env, __pycache__, .supabase/
└── README.md
```

---

## 4. 移行ステップ

### Step 0: 準備（即座に実施可能）

```bash
# GitHub に新規リポジトリを作成
gh repo create optiens-iot --private --description "AquaLoop IoT・SaaS システム"

# ローカルに clone
git clone git@github.com:<org>/optiens-iot.git
cd optiens-iot
```

### Step 1: ディレクトリスケルトン作成（Phase 0 / 〜2026年6月）

1. `supabase/` ディレクトリを作成し、`supabase init` を実行
2. GASスプレッドシートのスキーマ（Data / Recipes / Commands / State）を `supabase/migrations/` の初期マイグレーションとして書き起こす
3. `edge/` ディレクトリを作成し、現在 SSH で直接編集している Python コードを移植
4. `shared/schema/` にセンサーデータの JSON Schema を定義（エッジ・クラウド両方が参照する単一正典）
5. `ota/deploy.sh` を整備（rsync によるシンプルなデプロイから開始）

### Step 2: GAS → Supabase 移行（Phase 1 前半 / 2026年7〜9月）

1. Supabase に本番プロジェクトを作成し、`supabase/migrations/` を適用
2. センサーデータ受信の Edge Function（`ingest-sensor`）を実装・デプロイ
3. RPi の送信先を GAS → Supabase Edge Function に切り替え（並行運用期間を設ける）
4. コマンドポーリング（`command_poller.py`）を実装し、GAS のコマンドキューを Supabase commands テーブルに移行
5. GAS を完全停止

### Step 3: CI/CD 整備（Phase 1 後半 / 2026年10〜12月）

1. `edge-tests.yml`: pytest を GitHub Actions で自動実行（PR時）
2. `supabase-deploy.yml`: `main` ブランチへのマージ時に `supabase db push` + Edge Functions デプロイ
3. `ota-deploy.yml`: 手動トリガーで指定 device_id のデバイスに rsync OTA

### Step 4: 管理画面・SaaS化（Phase 2 / 2027年4月〜）

1. `dashboard/` に管理画面を実装（Astro または Next.js）
2. Supabase Auth + Row Level Security でマルチテナント分離
3. `supabase/functions/` に Alert Engine・最適化レコメンデーション等を追加

---

## 5. リスクと注意点

### リスク1: `optiens-hydroponics` と `optiens-iot` の型定義の乖離

**リスク**: センサーデータ型定義を両リポジトリで別々に管理すると、ブログ記事やWebサイトのデータ表示部分（将来のダッシュボード埋め込み等）との整合性が崩れる。

**対策**: `optiens-iot/shared/schema/` を「単一正典」とし、Webサイト側でセンサーデータを扱う必要が生じた場合はこのリポジトリを参照する規約を設ける。当面はWebサイト側にIoTデータ表示は不要なため、Phase 2 開始時に改めて判断する。

### リスク2: Supabase の秘密鍵管理

**リスク**: `optiens-iot` リポジトリが private であっても、`service_role_key` などが `.env` ファイルにコミットされるリスク。

**対策**:
- `.gitignore` に `*.env`, `.env.*` を必ず含める
- `config/device.env.example` のみコミット（実際の値は含めない）
- GitHub Actions Secrets で管理し、ワークフロー内でのみ参照
- RPi の実機には `scp` または Ansible vault で配布

### リスク3: OTA 失敗によるデバイスの無応答化

**リスク**: RPi へのOTA中に電断・通信断が発生すると、デバイスが応答不能になる可能性がある。孤立環境（離島・船舶）では現地対応が困難。

**対策**:
- OTA はまず `staging` ディレクトリに展開し、ヘルスチェック後に `atomic rename` で切り替える
- 旧バージョンを `backup/` に保持し、ヘルスチェック失敗時に自動ロールバック
- `ota-deploy.yml` はデフォルトで manual trigger とし、自動OTAは Phase 3 以降に検討

### リスク4: Supabase Edge Functions の APIバージョニング

**リスク**: Edge Functions の API を変更すると、古いファームウェアの RPi が通信できなくなる。

**対策**:
- Edge Functions のエンドポイントに `/v1/` プレフィックスを付ける（例: `https://<project>.supabase.co/functions/v1/ingest-sensor`）
- RPi のファームウェアバージョンをリクエストヘッダー（`X-Firmware-Version`）に含め、Edge Function 側でバージョン差異を吸収する実装にする
- 破壊的変更前に必ず全デバイスのファームウェアを更新してから API を変更する手順を SOPとして文書化

### リスク5: 1名体制でのリポジトリ管理負荷

**リスク**: 2リポジトリの管理が面倒になり、どちらかが放置される。

**対策**:
- Claude Code の `CLAUDE.md` を `optiens-iot` にも作成し、コンテキストを自動ロードする
- Weekly で両リポジトリの `git status` を確認する習慣を設ける
- `optiens-hydroponics` に IoT コードを追加したくなる誘惑に抗う（分離の価値はデプロイの独立性にある）

---

## 付記: 案Aを選ぶべき唯一のケース

現在（2026年3月）の段階で **Supabase移行の完了を最優先とし、他を後回しにする** 場合、一時的に案Aで素早く動かすことは合理的である。ただしその場合も、以下の制約を守ること：

1. `edge/` と `supabase/` を `optiens-hydroponics` に追加する際、`astro.config.mjs` のビルド対象に含まれないよう `tsconfig.json` の `include` を明示的に設定する
2. Vercel の Ignored Build Step 設定で `edge/` や `supabase/` の変更時にデプロイをスキップする
3. Phase 1 開始前（2026年6月末）には必ず `optiens-iot` リポジトリに分離する

**結論として、1ヶ月以上の時間軸で見た場合、最初から案Cを選ぶ方がトータルコストは低い。**

---

*作成日: 2026-03-10 / アーキテクチャエージェント*
