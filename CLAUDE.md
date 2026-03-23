# Optiens — Claude Code コンテキスト

## 事業概要
- **屋号**: Optiens（オプティエンス）※個人事業主として活動中、法人化はPhase 2移行時に再検討
- **事業**: IoT×AI自動化による水耕栽培ハーブ生産
- **コンセプト**: 農家ではなく「農業システムの設計者」。センサー・AI・自動制御で仕組みを構築し、安定したらオペレーションは人に委託
- **生産品目**: バジル・マイクログリーン等の高単価ハーブ
- **販路**: 地元レストラン・道の駅・EC（食べチョク等）
- **体制**: 代表1名（Phase 2からパート雇用）

## 禁止事項（必ず守る）
- 宇宙・宇宙農業に関する記述を追加・残さない
- SaaSプラットフォームの外部販売を収益モデルとして記述しない（旧方針）
- 医療機関・防災拠点・孤立環境（離島・船舶・地下施設）をターゲットとして記述しない（旧方針）
- 家庭用ガーデニング・食育教室としてのポジショニング禁止（事業は業務用ハーブ生産）
- 社保スキームをサイトに記載しない

## ブランドカラー
- Primary: `#2e574c` / Secondary: `#5ea89a` / Accent: `#ea4335`

## ロードマップ（変更不可）
- Phase 1: 自宅テスト栽培（0-6ヶ月）— メタルラック1台、データ蓄積・IoTシステム安定化、販売なし
- Phase 2: 廃校教室で生産開始（7-12ヶ月目）— 北杜市廃校20m²、パート1名雇用、レストラン+道の駅+EC販売
- Phase 3: 拡大（2年目〜）— 教室2-3室60m²、EC定期便、月間利益10-20万円、横展開

## 技術スタック（サイト）
- Astro 5 + TypeScript、SSR on Vercel（hnd1）
- Content Collections（`src/content/blog/`）でブログ管理
- スタイル: scoped CSS + global.css（prose, card, hero等の共通クラス）
- デプロイ: `npx astro build` → Vercel

## 技術スタック（IoT/生産システム）
- エッジ: Raspberry Pi 4B ×2（Pi1: Zigbee2MQTT+MCP Server / Pi2: センサー+カメラ）
- センサー: EC/pH/水温/気温湿度/CO2/照度（MCP3008 ADC経由）
- 制御: Zigbeeスマートスイッチ + リレーモジュール（ポンプ・LED・ヒーター）
- 通信: MQTT（Mosquitto）、Zigbee2MQTT
- AI連携: Claude Code × MCP（Model Context Protocol）でiPhoneから音声操作
- クラウド: Supabase（データ蓄積・ダッシュボード）
- カメラ: WiFi IPカメラ（TY-Q2）+ RPiカメラ（OV5647）

## 重要ファイル
- 機器インベントリ: `memory/project_equipment-inventory.md`
- 循環式システム設計: `memory/project_hydro-system-design.md`
- 事業計画: `memory/project_herb-farm-plan.md`
- エージェント: `.claude/agents/`
- スキル: `.claude/skills/`

## AIエージェントへの行動規範
1. Plan Modeで作業概要を確認してから実装に進む
2. 不可逆的な操作（削除・git push等）は必ず確認を求める
3. 事業方針・ターゲット・ロードマップを変更する提案は人間の承認を得る
4. 補助金申請書やINVESTORSページの記述変更は特に慎重に扱う
