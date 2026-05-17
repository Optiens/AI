export type AdminReportStatus = 'live' | 'next' | 'planned'
export type AdminReportArea =
  | 'daily'
  | 'sales'
  | 'delivery'
  | 'ai'
  | 'operations'
  | 'finance'
  | 'growth'
  | 'knowledge'
  | 'risk'
  | 'hydroponics'

export type AdminReport = {
  id: string
  title: string
  area: AdminReportArea
  purpose: string
  decision: string
  cadence: string
  owner: string
  status: AdminReportStatus
  href?: string
  source: string
  checks: string[]
}

export const adminReports: AdminReport[] = [
  {
    id: 'today-actions',
    title: '今日の対応',
    area: 'daily',
    purpose: '毎朝、今日処理すべきリード、入金、AI/API障害、Google Tasksの期限を一箇所で見る。',
    decision: '今日、人間が対応すべきものを漏らしていないか。',
    cadence: '毎日 09:00 JST',
    owner: 'COO',
    status: 'live',
    href: '/admin/reports#today-actions',
    source: 'diagnosis_leads, ai_api_events, Google Tasks',
    checks: ['期限超過', '今日が期限', 'AI/APIエラー', '入金待ち', '詳細レポート送付', 'MTGフォロー'],
  },
  {
    id: 'sales-funnel',
    title: '営業ファネル',
    area: 'sales',
    purpose: '無料診断から導入支援まで、どこで詰まっているかを数字で判断する。',
    decision: 'どのステージを改善すれば受注に近づくか。',
    cadence: '週次',
    owner: 'CEO',
    status: 'live',
    href: '/admin/funnel',
    source: 'diagnosis_leads',
    checks: ['有償化率', '入金率', 'レポート送付率', 'MTG化率', '導入支援化率', '離脱箇所'],
  },
  {
    id: 'api-reliability',
    title: 'AI/API信頼性',
    area: 'ai',
    purpose: 'AIで処理している業務の通信、エラー、再試行、費用、コンテキスト余力を見る。',
    decision: '自動処理を安心して任せ続けられる状態か。',
    cadence: '毎日/障害時',
    owner: 'CTO',
    status: 'live',
    href: '/admin/api-status',
    source: 'ai_api_events, environment variables',
    checks: ['OpenAI接続', 'Anthropic接続', 'Resend接続', 'Google Slides接続', '当月API費用', '残りコンテキスト'],
  },
  {
    id: 'task-deadlines',
    title: 'タスク・期限',
    area: 'operations',
    purpose: '事業関連タスクの期限超過、今日、7日以内を確認する。',
    decision: '期限に対して、代表の次アクションが詰まっていないか。',
    cadence: '毎日 09:00 JST',
    owner: 'COO',
    status: 'live',
    href: '/admin/reports#task-deadlines',
    source: 'Google Tasks',
    checks: ['AI支援事業タスク', '水耕栽培事業タスク', 'AI小説事業タスク', '期限なしタスク'],
  },
  {
    id: 'delivery-sla',
    title: '納品・顧客対応SLA',
    area: 'delivery',
    purpose: '無料診断、有償レポート、AI診断官β案内、顧客返信の遅延を確認する。',
    decision: '顧客を待たせて信頼を落とすリスクがないか。',
    cadence: '毎日',
    owner: 'COO / CEO',
    status: 'next',
    source: 'diagnosis_leads, email events, Google Tasks',
    checks: ['無料診断納期', '有償レポート5営業日', '未返信顧客', 'AI診断官βフォロー', '納品後フォロー'],
  },
  {
    id: 'automation-health',
    title: '自動化ジョブ稼働',
    area: 'operations',
    purpose: 'Cron、Webhook、Supabase Functions、メール送信などの定期処理が止まっていないかを見る。',
    decision: '自動化に任せている処理が、裏で止まっていないか。',
    cadence: '毎日/障害時',
    owner: 'CTO',
    status: 'next',
    source: 'ai_api_events, Vercel logs, Supabase function logs',
    checks: ['最終成功時刻', '連続失敗', 'Webhook未処理', 'メール送信失敗', 'Cron認証'],
  },
  {
    id: 'quality-review',
    title: '品質・禁止事項チェック',
    area: 'risk',
    purpose: '診断レポート、LP、ブログ、ナレッジが品質基準と禁止事項を守っているかを見る。',
    decision: '公開・納品してよい品質になっているか。',
    cadence: '週次/公開前',
    owner: 'CMO / CSO',
    status: 'next',
    source: 'content files, report outputs, quality check scripts',
    checks: ['禁止事項', '確約表現', '数値根拠', 'リンク切れ', 'レポート品質基準', '公開前レビュー'],
  },
  {
    id: 'data-quality',
    title: 'データ品質・欠損',
    area: 'operations',
    purpose: 'リード、タスク、APIログ、ナレッジの欠損や重複を検出する。',
    decision: 'ダッシュボードの数字を信じて判断できる状態か。',
    cadence: '週次',
    owner: 'CTO / COO',
    status: 'next',
    source: 'diagnosis_leads, ai_api_events, Google Tasks, optiens-knowledge',
    checks: ['必須項目欠損', '重複リード', '不正ステータス', '古い未処理データ', 'ログ未記録'],
  },
  {
    id: 'knowledge-health',
    title: 'ナレッジ鮮度',
    area: 'knowledge',
    purpose: 'SOP、判断基準、禁止事項、テンプレが古くなっていないかを見る。',
    decision: '新しく人が入っても、ナレッジだけで仕事の流れを理解できるか。',
    cadence: '月次',
    owner: 'CMO / COO',
    status: 'next',
    href: '/admin/knowledge',
    source: 'optiens-knowledge, blog content, executive docs',
    checks: ['最終更新日', '責任者', '不足質問', '公開デモ化可否', 'SOP化待ち'],
  },
  {
    id: 'demo-readiness',
    title: 'ナレッジDBデモ化',
    area: 'knowledge',
    purpose: '社内ナレッジDBを、将来の公開デモ・販売ツールとして見せられる状態に近づける。',
    decision: '顧客に見せてもよい実例と、伏せるべき内部情報が分離できているか。',
    cadence: '隔週/月次',
    owner: 'CEO / COO',
    status: 'next',
    href: '/admin/knowledge',
    source: 'optiens-knowledge, demo-safe flags, anonymized examples',
    checks: ['demo-safe件数', 'demo-ready件数', '匿名化待ち', 'サンプル質問', '営業デモ導線'],
  },
  {
    id: 'finance-cash',
    title: '売上・キャッシュ',
    area: 'finance',
    purpose: '入金済、未入金、見込み売上、固定費、API費用をまとめて見る。',
    decision: '今月の資金余力と、次に取りに行くべき売上が見えているか。',
    cadence: '週次/月次',
    owner: 'CFO',
    status: 'planned',
    source: 'diagnosis_leads, freee, ai_api_events',
    checks: ['入金済売上', '未入金', '見込み売上', 'API費用', '固定費', '粗利見通し'],
  },
  {
    id: 'maintenance-revenue',
    title: '保守・継続顧客',
    area: 'finance',
    purpose: '保守契約、継続顧客、追加開発、解約リスクを追う。',
    decision: '単発売上だけでなく、安定収益に育っているか。',
    cadence: '月次',
    owner: 'CEO / CFO',
    status: 'planned',
    source: 'contracts, invoices, support tasks, customer records',
    checks: ['MRR', 'ARR', '更新月', '解約リスク', '追加開発候補', '保守対応工数'],
  },
  {
    id: 'marketing-source',
    title: '集客チャネル・LP',
    area: 'growth',
    purpose: 'どのページ、記事、紹介元が無料診断と有償化につながっているかを見る。',
    decision: '時間をかけるべき集客チャネルはどれか。',
    cadence: '週次/月次',
    owner: 'CMO / CRO',
    status: 'planned',
    source: 'analytics, diagnosis_leads, referrer data',
    checks: ['流入元', 'LP CVR', 'フォーム離脱', '業種別CVR', '有償化チャネル', '地域別反応'],
  },
  {
    id: 'content-pipeline',
    title: 'コンテンツ・事例化',
    area: 'growth',
    purpose: 'ブログ、サンプル、事例、品質基準ページの更新候補を管理する。',
    decision: '次に公開すべきコンテンツが、営業ファネルに効くものになっているか。',
    cadence: '週次',
    owner: 'CMO',
    status: 'planned',
    source: 'src/content/blog, public pages, Google Tasks',
    checks: ['公開予定', '下書き', '更新が古いページ', '事例化候補', '検索流入候補', '禁止表現確認'],
  },
  {
    id: 'partner-pipeline',
    title: '営業パートナー',
    area: 'sales',
    purpose: '商工会、福祉コンサルタント、紹介者などの候補と紹介状況を追う。',
    decision: '代表一人の営業から、紹介経由の再現性に移れるか。',
    cadence: '月次',
    owner: 'CEO / CRO',
    status: 'planned',
    source: 'partner records, referral leads, Google Tasks',
    checks: ['候補者', '接触状況', '紹介件数', '成約率', 'コミッション条件', 'フォロー予定'],
  },
  {
    id: 'subsidy-monitor',
    title: '補助金・助成金',
    area: 'finance',
    purpose: '新規公募、締切、申請可否、採択後の報告期限を確認する。',
    decision: '申請すべき制度と、逃してはいけない締切が明確か。',
    cadence: '月次/公募更新時',
    owner: 'CFO / CRO',
    status: 'planned',
    source: 'Google Tasks, executive/research, web research',
    checks: ['新規公募', '締切', '適合度', '必要書類', '採択後期限'],
  },
  {
    id: 'security-access',
    title: 'セキュリティ・アクセス',
    area: 'risk',
    purpose: 'APIキー、管理画面、Supabase、Vercel、メール送信、ドメインの安全性を見る。',
    decision: '秘密情報や顧客情報を安全に扱える運用になっているか。',
    cadence: '月次/変更時',
    owner: 'CTO',
    status: 'planned',
    source: 'environment variables, Supabase policies, Vercel settings, domain records',
    checks: ['環境変数', 'キー更新日', 'RLS', '管理者認証', 'ドメイン期限', '公開情報の混入'],
  },
  {
    id: 'capacity-planning',
    title: '代表稼働・納期余力',
    area: 'operations',
    purpose: '案件数、納品待ち、保守対応、開発タスクから、代表一人で回る範囲を確認する。',
    decision: '受注してよい量か、外注・パート化の準備が必要か。',
    cadence: '週次',
    owner: 'COO / CEO',
    status: 'planned',
    source: 'Google Tasks, diagnosis_leads, support records',
    checks: ['進行中案件', '納品待ち', '今週工数', 'ボトルネック', '委任候補', 'パート雇用トリガー'],
  },
  {
    id: 'experiment-learning',
    title: '施策検証・学習',
    area: 'growth',
    purpose: 'LP、価格、メール文面、診断サンプル、営業導線の仮説と結果を残す。',
    decision: '思いつきではなく、学習が積み上がる営業改善になっているか。',
    cadence: '隔週/月次',
    owner: 'CSO / CMO',
    status: 'planned',
    source: 'analytics, diagnosis_leads, experiment notes',
    checks: ['仮説', '変更内容', '対象期間', '結果', '次アクション', '中止判断'],
  },
  {
    id: 'vendor-subscriptions',
    title: '契約・サブスク棚卸',
    area: 'finance',
    purpose: 'Vercel、Supabase、OpenAI、Anthropic、freee、ドメインなどの契約と更新を確認する。',
    decision: '止まると困る契約や不要コストを見逃していないか。',
    cadence: '月次/年次',
    owner: 'CFO / CTO',
    status: 'planned',
    source: 'vendor dashboards, invoices, calendar reminders',
    checks: ['更新日', '支払い失敗', 'プラン上限', '不要契約', '請求額', '管理者アカウント'],
  },
  {
    id: 'hydroponics-h1',
    title: '水耕栽培H1/H2判定',
    area: 'hydroponics',
    purpose: 'H2移行条件を満たしているかを、ユニットエコノミクスと安定性で確認する。',
    decision: '拡大してよい実証結果が揃っているか。',
    cadence: '栽培サイクルごと',
    owner: 'CFO / CRO',
    status: 'planned',
    source: 'sensor_data, crop_cycles, unit economics',
    checks: ['1株あたりコスト', 'kWh/kg', '収穫量CV', 'IoT停止時間', '継続発注'],
  },
  {
    id: 'iot-maintenance',
    title: 'IoT機器・栽培設備',
    area: 'hydroponics',
    purpose: 'Raspberry Pi、Zigbee、センサー、カメラ、ポンプ、LEDの稼働と保守予定を見る。',
    decision: '栽培実証データを継続して取れる設備状態か。',
    cadence: '週次/月次',
    owner: 'CTO / CRO',
    status: 'planned',
    source: 'sensor logs, equipment inventory, maintenance tasks',
    checks: ['センサー欠測', 'Zigbee停止', 'カメラ稼働', 'LED点灯時間', '消耗品', '予備機材'],
  },
]

export function areaLabel(area: AdminReportArea) {
  const labels: Record<AdminReportArea, string> = {
    daily: '日次運用',
    sales: '営業',
    delivery: '納品',
    ai: 'AI/API',
    operations: '業務',
    finance: '財務',
    growth: '集客',
    knowledge: 'ナレッジ',
    risk: 'リスク',
    hydroponics: '水耕栽培',
  }
  return labels[area]
}

export function statusLabel(status: AdminReportStatus) {
  if (status === 'live') return '稼働中'
  if (status === 'next') return '次に実装'
  return '計画中'
}

export function statusTone(status: AdminReportStatus) {
  if (status === 'live') return 'ok'
  if (status === 'next') return 'warn'
  return 'muted'
}
