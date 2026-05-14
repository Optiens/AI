export type KnowledgeDoc = {
  id: string
  title: string
  category: 'business' | 'sales' | 'operations' | 'ai' | 'hydroponics' | 'brand' | 'governance'
  owner: string
  updatedAt: string
  visibility: 'internal' | 'demo-safe'
  maturity: 'seed' | 'operational' | 'demo-ready'
  summary: string
  body: string
  tags: string[]
}

export const knowledgeDocs: KnowledgeDoc[] = [
  {
    id: 'business-overview',
    title: 'Optiensの事業概要',
    category: 'business',
    owner: 'COO',
    updatedAt: '2026-05-14',
    visibility: 'demo-safe',
    maturity: 'operational',
    summary: 'AI支援事業を最優先に進め、水耕栽培事業は長期の実証・導入支援モデルとして育てる。',
    tags: ['事業概要', 'ロードマップ', 'AI支援', '水耕栽培'],
    body: [
      '合同会社Optiensは、AI支援事業を当面の最優先事業として進める。',
      'Phase A1では無料診断、詳細レポート、導入支援への導線を磨き、まず有償案件1件を獲得する。',
      '水耕栽培事業は室内LEDとIoT水耕栽培を前提に、自社実証から就労支援事業所・自治体への導入支援へ展開する。',
      'Optiensは農家ではなく、農業システムの設計者として振る舞う。',
    ].join('\n'),
  },
  {
    id: 'ai-support-flow',
    title: 'AI支援事業の基本フロー',
    category: 'sales',
    owner: 'CEO',
    updatedAt: '2026-05-14',
    visibility: 'demo-safe',
    maturity: 'operational',
    summary: '無料診断から詳細レポート、MTG、導入支援へ進めるための標準フロー。',
    tags: ['無料診断', '詳細レポート', '導入支援', '営業'],
    body: [
      '入口は無料診断フォーム。AIで一次診断レポートを作成し、顧客に具体的な業務改善の方向性を示す。',
      '詳細レポート+60分MTGは税込5,500円の有償確認枠として扱う。単体利益よりも、導入支援に進むべきかの見極めが目的。',
      '導入支援は個別見積。対象業務、連携先、データ状態、運用担当者を確認してから提案する。',
      '保守は月額契約として、改善、障害対応、運用定着を支える。',
    ].join('\n'),
  },
  {
    id: 'daily-ops',
    title: '毎朝の確認手順',
    category: 'operations',
    owner: 'COO',
    updatedAt: '2026-05-14',
    visibility: 'demo-safe',
    maturity: 'operational',
    summary: '毎朝9時のメールと管理画面で確認すべき項目。',
    tags: ['日次運用', 'レポート', 'Google Tasks', 'アラート'],
    body: [
      '毎朝9時の日次メールで、今日の対応、期限超過タスク、7日以内のタスク、AI/API問題、入金待ち、当月API費用を確認する。',
      '管理画面のレポートは、過去資料の置き場ではなく、今日対応するべきことを一覧化するための画面。',
      '対応優先度は、API障害、手動確認リード、期限超過タスク、入金待ち、詳細レポート送付、MTGフォローの順に高く扱う。',
    ].join('\n'),
  },
  {
    id: 'report-portfolio',
    title: '管理画面レポートの設計方針',
    category: 'operations',
    owner: 'COO',
    updatedAt: '2026-05-14',
    visibility: 'demo-safe',
    maturity: 'operational',
    summary: 'Optiensの管理画面レポートは、日次対応、営業、納品、AI/API、財務、集客、リスク、ナレッジ、水耕栽培を分けて設計する。',
    tags: ['レポート', '管理画面', '運用設計', 'ダッシュボード'],
    body: [
      'レポートは資料置き場ではなく、次に何を判断するかを明確にするための運用画面。',
      '最優先は今日の対応、営業ファネル、AI/API信頼性、タスク期限。ここは毎日または週次で確認する。',
      '次に、納品・顧客対応SLA、自動化ジョブ稼働、品質・禁止事項チェック、データ品質、ナレッジDBデモ化を整備する。',
      '将来は、売上・キャッシュ、保守・継続顧客、集客チャネル、コンテンツ、営業パートナー、補助金、セキュリティ、代表稼働、水耕栽培KPIまで拡張する。',
      '各レポートには、目的だけでなく「その画面で判断すること」を必ず持たせる。',
    ].join('\n'),
  },
  {
    id: 'api-operations',
    title: 'AI/API運用の確認ポイント',
    category: 'ai',
    owner: 'CTO',
    updatedAt: '2026-05-14',
    visibility: 'internal',
    maturity: 'operational',
    summary: 'AI処理、API接続、エラー、トークン、費用推定の確認方法。',
    tags: ['OpenAI', 'Anthropic', 'API', 'エラー', '費用'],
    body: [
      'AI/APIの実行ログはai_api_eventsに集約する。',
      'OpenAI、Anthropic、Resend、Google Slides、Supabaseの接続状況をAPI稼働状況ページで確認する。',
      'エラー、再試行、レイテンシ、トークン数、残りコンテキスト、当月API費用推定を確認する。',
      'API費用は環境変数の単価とUSD/JPYレートを使って推定する。正確な請求額は各プロバイダの管理画面で最終確認する。',
    ].join('\n'),
  },
  {
    id: 'lead-sop',
    title: 'リード管理SOP',
    category: 'sales',
    owner: 'CEO',
    updatedAt: '2026-05-14',
    visibility: 'demo-safe',
    maturity: 'operational',
    summary: 'リードのステータスごとに取るべき対応。',
    tags: ['リード', '入金', 'MTG', 'フォロー'],
    body: [
      'newは受付内容を確認する。',
      'verifiedまたはprocessingが長く残る場合はAI生成の停滞を疑う。',
      'manual_review、limit_exceeded、quota_retry_pendingは当日確認する。',
      'pending_paymentは入金確認を行い、3日以上残る場合はリマインドを検討する。',
      'paidは詳細レポート作成へ進める。report_createdは送付し、report_sentまたはsentはMTG化をフォローする。',
    ].join('\n'),
  },
  {
    id: 'hydroponics-kpi',
    title: '水耕栽培H1/H2判定',
    category: 'hydroponics',
    owner: 'CFO / CRO',
    updatedAt: '2026-05-14',
    visibility: 'demo-safe',
    maturity: 'seed',
    summary: 'H2移行前に必ず見るユニットエコノミクスと安定性。',
    tags: ['水耕栽培', 'ユニットエコノミクス', 'H1', 'H2'],
    body: [
      'H1は自宅テスト栽培で、ラック1台、IoTシステム開発、ユニットエコノミクス証明を目的とする。販売はしない。',
      'H2移行条件は、1株あたりコストが販売価格の40%以下、週次収穫量CVが20%以下、レストラン2軒以上の継続発注、IoT1ヶ月無停止の4項目。',
      '管理するKPIは、1株あたり生産コスト、LED電気代比率、kWh/kg、収穫量CV、IoT停止時間。',
    ].join('\n'),
  },
  {
    id: 'brand-rules',
    title: 'ブランド・禁止表現',
    category: 'brand',
    owner: 'CMO',
    updatedAt: '2026-05-14',
    visibility: 'internal',
    maturity: 'operational',
    summary: 'Web・資料・ナレッジで守る表現ルール。',
    tags: ['ブランド', '表記', '禁止事項'],
    body: [
      'ブランドカラーはDeep Lapis #1F3A93、Lapis Light #6B85C9、Sakura #E48A95を基準にする。',
      '宇宙、宇宙農業、SaaSプラットフォーム外販、医療機関、防災拠点、孤立環境、家庭用ガーデニング、食育教室、個人向けEC、ビニールハウス転換、社保スキームは記述しない。',
      'AI支援では煽りや確約を避け、現状整理、業務分解、現実的な導入判断を重視する。',
    ].join('\n'),
  },
  {
    id: 'onboarding',
    title: '新しく人が入った時のオンボーディング',
    category: 'governance',
    owner: 'COO',
    updatedAt: '2026-05-14',
    visibility: 'demo-safe',
    maturity: 'operational',
    summary: '社員・業務委託・パートが最初に読むべき順番。',
    tags: ['採用', '教育', 'SOP', 'オンボーディング'],
    body: [
      '最初に事業概要、AI支援フロー、毎朝の確認手順、リード管理SOP、ブランド・禁止表現を読む。',
      '作業に入る前に、今日の対応、担当タスク、顧客情報、禁止表現を確認する。',
      'わからないことはナレッジDBの質問欄で質問し、回答に不足があればSOPに追記する。',
    ].join('\n'),
  },
  {
    id: 'knowledge-db-product',
    title: 'ナレッジDB販売デモ構想',
    category: 'business',
    owner: 'CEO / COO',
    updatedAt: '2026-05-14',
    visibility: 'demo-safe',
    maturity: 'seed',
    summary: '社内ナレッジDBを、将来的に中小企業向けの主力販売デモとして見せられるように育てる。',
    tags: ['ナレッジDB', '販売デモ', '主力商品', '業務引き継ぎ'],
    body: [
      'ナレッジDBは、社員や業務委託が入った時に「会社の仕事を質問できる」状態を作るための社内基盤。',
      '将来は、Optiens自身が使っている実例として公開デモ化し、中小企業向けの販売ツールにする。',
      'デモでは、顧客情報、APIキー、内部メモ、未公開の財務情報を出さない。公開可能なSOP、業務フロー、判断基準、サンプル質問を中心に見せる。',
      '価値訴求は「マニュアルを探す」ではなく「質問すると会社の標準回答が返る」。新人教育、属人化解消、引き継ぎ、問い合わせ対応に効く。',
    ].join('\n'),
  },
  {
    id: 'knowledge-growth-loop',
    title: 'ナレッジ追加ループ',
    category: 'operations',
    owner: 'COO',
    updatedAt: '2026-05-14',
    visibility: 'demo-safe',
    maturity: 'seed',
    summary: '質問に答えられなかった内容を、次のナレッジ追加候補として蓄積する。',
    tags: ['ナレッジ追加', 'SOP', '改善ループ'],
    body: [
      'ナレッジDBは最初から完成させるものではなく、日々の質問と業務で増やす。',
      '回答に「現時点のナレッジには不足」と出た場合、その質問をSOP化候補として残す。',
      '追加する優先順位は、毎日使う手順、顧客対応で迷う判断、禁止事項、金額や納期に関わるもの、障害対応の順に高い。',
      '追加後は、責任者、最終更新日、公開デモに出せるかを必ず設定する。',
    ].join('\n'),
  },
]

function tokenize(input: string) {
  return input
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}ー一-龠ぁ-んァ-ヶ]+/gu, ' ')
    .split(/\s+/)
    .filter(Boolean)
}

export function searchKnowledge(query: string, limit = 5) {
  const terms = tokenize(query)
  if (!terms.length) return knowledgeDocs.slice(0, limit).map((doc) => ({ doc, score: 0 }))

  return knowledgeDocs
    .map((doc) => {
      const haystack = `${doc.title} ${doc.summary} ${doc.body} ${doc.tags.join(' ')}`.toLowerCase()
      const score = terms.reduce((sum, term) => sum + (haystack.includes(term) ? 1 : 0), 0)
      return { doc, score }
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

export function buildKnowledgeContext(query: string) {
  const rows = searchKnowledge(query, 6)
  const selected = rows.length ? rows : knowledgeDocs.slice(0, 5).map((doc) => ({ doc, score: 0 }))
  return selected.map(({ doc }) => [
    `# ${doc.title}`,
    `category: ${doc.category}`,
    `visibility: ${doc.visibility}`,
    `maturity: ${doc.maturity}`,
    doc.summary,
    doc.body,
  ].join('\n')).join('\n\n')
}
