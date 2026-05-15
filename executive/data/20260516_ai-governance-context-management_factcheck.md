# シャドーAIを増やさない社内AI活用ルール ファクトチェック記録（2026-05-16）

## 対象

- 記事: `src/content/blog/20260516-ai-governance-context-management.md`
- 画像: `public/images/blog/20260516-ai-governance-context-management.webp`
- 元情報: 2026-05-16 CEO共有の動画文字起こし

## 判定

- 修正後公開可

## 確認結果

| 項目 | 判定 | 根拠・修正方針 |
|---|---|---|
| Microsoft 365 Copilot のデータ利用 | OK | Microsoft Learn で、Microsoft 365 Copilot が Microsoft Graph のユーザー権限内データを参照すること、プロンプト・回答・Graph 経由データが基盤LLM学習に使われないことを確認。記事では「何でも安全」と断定せず、社内規程・契約・権限確認を条件として記載。 |
| Google Workspace with Gemini のデータ利用 | OK | Google Workspace with Gemini Privacy Hub で、Workspace 顧客データを許可なく生成AIモデル学習に使わないこと、既存の権限・管理者設定に従うことを確認。記事では Google Workspace 管理下での利用に限定して記載。 |
| Teams 文字起こし | OK | Microsoft Support で、Teams の会議文字起こしが会議主催者の OneDrive for Business に保存され、Teams の会議チャットや Recap から参照できることを確認。 |
| Google Meet 文字起こし | OK | Google Meet Help / Google Workspace Admin Help で、会議後に文字起こしリンクが関係者へ送付され、Google Calendar イベントにも添付されること、Drive に保存されることを確認。 |
| シャドーAIに関する主張 | OK | 特定の統計や発生率は記載せず、未承認ツール利用リスクとして一般論に弱めた。 |
| Optiens の事業進捗 | OK | `AGENTS.md` と `src/content/blog/_project-status.md` を確認。水耕栽培の実績表現、旧方針、受注実績の断定は含めていない。AI支援は設計・支援方針として表現。 |
| アイキャッチ画像 | OK | `image:` と実ファイル slug が一致。初回生成画像に英字が入ったため破棄し、文字なしの画像を再生成した。モデルは `imagen-4.0-ultra-generate-001`。 |
| Actions Node 24 対応 | OK | `actions/checkout` 最新 release `v6.0.2`、`actions/setup-node` 最新 release `v6.4.0`、`actions/setup-python` 最新 release `v6.2.0` を確認して workflow を更新。 |

## 公開文で避けた表現

- 「Copilot/Gemini なら安全」
- 「会社情報を個人AIに入れてもよい」
- 「グレーゾーンを攻める」
- 「必ず成果が出る」
- 「誰でもすぐ自動化できる」

## 元ソース匿名化チェック

- 済
- 動画タイトル、チャンネル名、出演者名、宣伝CTA、コメント紹介、口癖は削除。
- 元の流れ（雑談 → 裏技 → 転職論 → コメント返し）をなぞらず、Optiens読者向けに「社内AIガバナンス」「コンテキスト管理」「会議記録」「関係者別説明」に再構成。
- 元動画固有の危うい例（個人端末・家庭AI・印刷物・規程の隙間を突く話）は、採用せず「シャドーAIを避ける運用」に置換。
- 文字起こしを事実源として扱わず、外部サービス仕様は公式情報で確認。

## 参照元

- Microsoft Learn: `https://learn.microsoft.com/en-us/microsoft-365/copilot/microsoft-365-copilot-privacy`
- Google Workspace with Gemini Privacy Hub: `https://knowledge.workspace.google.com/admin/gemini/generative-ai-in-google-workspace-privacy-hub`
- Microsoft Support: `https://support.microsoft.com/en-gb/office/start-stop-and-download-live-transcripts-in-microsoft-teams-meetings-dc1a8f23-2e20-4684-885e-2152e06a4a8b`
- Google Meet Help: `https://support.google.com/meet/answer/12849897`
- Google Workspace Admin Help: `https://support.google.com/a/answer/12076932`
- Google Cloud Vertex AI Imagen 4: `https://docs.cloud.google.com/vertex-ai/generative-ai/docs/models/imagen/4-0-generate`
