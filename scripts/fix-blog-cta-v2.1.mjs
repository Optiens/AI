/**
 * ブログCTA一括修正スクリプト（v2.1 案C採用に伴う実態合致）
 * 無料版で約束できない内容を削除/有料版誘導に書き換え
 */
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const blogDir = resolve(dirname(fileURLToPath(import.meta.url)), '../src/content/blog');

const fixes = [
  {
    file: '20260424-ai-agent-risks-smb-guide.md',
    replacements: [
      {
        old: '具体的には、無料の**AI活用診断レポート**で、御社の業務フローを分析し、AI導入で削減できる時間とコスト、導入時に注意すべきセキュリティポイントをまとめてご提供しています。',
        new: '具体的には、[無料AI活用診断](/free-diagnosis) で、フォーム入力をもとに **AI活用が効果的な業務TOP3 と削減時間・コストレンジ** をまとめた Google Slides レポート（5〜8枚）をお届けします。詳細な業務分析やセキュリティ要件の整理は [詳細レポート（¥5,500税込）](/free-diagnosis?paid=1) でお届けします。',
      },
    ],
  },
  {
    file: '20260424-nationwide-ai-consulting-security-action.md',
    replacements: [
      {
        old: 'これまでの無料診断は、ヒアリング内容をもとに口頭やメールでお伝えする形が中心でした。今回、診断結果をPDFレポートとして整形・納品する仕組みを構築したことで、より分かりやすく、お手元に残る形でお届けできるようになりました。',
        new: 'これまでの無料診断は、ヒアリング内容をもとに口頭やメールでお伝えする形が中心でした。今回、診断結果を Google Slides（URL共有）として整形・納品する仕組みを構築したことで、より分かりやすく、社内共有しやすい形でお届けできるようになりました。',
      },
    ],
  },
  {
    file: '20260430-cloud-db-ai-agent-for-smb.md',
    replacements: [
      {
        old: '「業務に合うか相談したい」という方は、まずは [無料AI診断](/free-diagnosis) で業務全体を見渡すところから始められます。「汎用SaaSのままで十分か」「専用構成が効きそうか」も含めて、率直にお伝えします。',
        new: '「業務に合うか相談したい」という方は、まずは [無料AI診断](/free-diagnosis) で **AI活用の方向性** から始められます。「汎用SaaSのままで十分か」「専用構成が効きそうか」の判断材料となる具体的なアーキテクチャ案・導入見積は [詳細レポート（¥5,500税込）](/free-diagnosis?paid=1) でお届けします。',
      },
    ],
  },
  {
    file: '20260501-ceo-ai-briefing-3-domains.md',
    replacements: [
      {
        old: '「うちの会社でも作れるか」を診断するには、**[無料AI診断](/free-diagnosis)**から始められます。経営者の方こそ、まず自分自身の業務をAIに任せてみるのが、AI導入の一番の近道だと考えています。',
        new: '「うちの業務にもAIが効きそうか」を確認するには、**[無料AI診断](/free-diagnosis)** から始められます。経営者の方こそ、まず自分自身の業務をAIに任せてみるのが、AI導入の一番の近道だと考えています。具体的な仕組み設計や費用は [詳細レポート（¥5,500税込）](/free-diagnosis?paid=1) で個別にお届けします。',
      },
    ],
  },
  {
    file: '20260504-ai-suishinho-smb-relation.md',
    replacements: [
      {
        old: 'Optiensでは、御社の現状をAI事業者ガイドライン1.1版の観点から整理し、「いま社内で着手すべきAI活用の優先順位」をレポートにまとめる**[無料AI診断](/free-diagnosis)**を提供しています。法律対応のためというより、**経営判断の材料として現状の棚卸し**にお使いください。',
        new: 'Optiens では **[無料AI診断](/free-diagnosis)** を提供しています。フォーム入力をもとに「業種に合った AI 活用の方向性」と「ROI 試算」をレポート化します。AI 事業者ガイドライン 1.1 版を踏まえた個別の運用要件整理は [詳細レポート（¥5,500税込）](/free-diagnosis?paid=1) でお届けします。',
      },
    ],
  },
  {
    file: '20260505-ai-automation-30percent-trap.md',
    replacements: [
      {
        old: '- **無料診断**: まずは現状の業務を聞かせていただき、AI化に向く業務とそうでない業務を整理します。レポートはPDFでお渡しします（[/free-diagnosis](/free-diagnosis)）',
        new: '- **無料診断**: フォーム入力をもとに、AI 化に向く業務の **方向性** を Google Slides レポートでお届けします（[/free-diagnosis](/free-diagnosis)）',
      },
    ],
  },
  {
    file: '20260505-ai-guidelines-checklist-smb.md',
    replacements: [
      {
        old: 'Optiensでは、御社の現状をAI事業者ガイドライン1.1版の観点から整理する **[無料AI診断](/free-diagnosis)** を提供しています。無料版では現状のヒアリングと優先順位の見立てをレポートでお返しし、有償の詳細レポート（¥5,500税込）では、本記事の10項目すべてについて「現状評価」「次の一手」「想定コスト感」をまとめてお渡しします。',
        new: 'Optiens の **[無料AI診断](/free-diagnosis)** では、フォーム入力をもとに「AI 活用が効果的な業務TOP3 と方向性」を Google Slides レポートでお返しします。本記事の10項目に基づく「現状評価」「次の一手」「想定コスト感」を個別にまとめた診断は、[詳細レポート（¥5,500税込）](/free-diagnosis?paid=1) でお届けします。',
      },
    ],
  },
  {
    file: '20260505-ai-implementation-pitfalls-5.md',
    replacements: [
      {
        old: 'Optiensの無料診断では、まず御社の主要業務を1日単位で書き出していただき、AIを差し込む「接点」を特定するところから始めます。',
        new: 'Optiens の無料診断では、フォーム入力をもとに、御社の業種・規模に合わせた AI 活用の方向性を Google Slides レポートでお届けします。',
      },
      {
        old: 'まずは現状の業務を一緒に棚卸しするところから始めませんか。**[無料AI診断](/free-diagnosis)**では、御社の業務を聞き取り、上記の落とし穴に該当していないかをチェックしたうえで、優先順位をつけたレポートをお届けします。',
        new: 'まずは **[無料AI診断](/free-diagnosis)** で AI 活用の方向性を確認してください。本記事の落とし穴を踏まえた個別チェックや具体的な優先順位付けは、[詳細レポート（¥5,500税込）](/free-diagnosis?paid=1) でお届けします。',
      },
    ],
  },
  {
    file: '20260505-ai-training-subsidy-2026.md',
    replacements: [
      {
        old: '「自社の場合、どの制度をどう組み合わせるべきか」を整理したい方は、[無料AI診断](/free-diagnosis)からご相談ください。AI導入と人材育成、両方の設計をまとめてサポートします。',
        new: '「自社の場合、どの補助金が該当しそうか」を確認したい方は、[無料AI診断](/free-diagnosis) からご相談ください。フォーム入力をもとに、該当しうる補助金の名称と AI 活用の方向性をレポートでお返しします（補助金の申請書作成支援は業務範囲外です）。',
      },
    ],
  },
  {
    file: '20260505-approval-workflow-license-free.md',
    replacements: [
      {
        old: '御社の承認業務にどのパターンがフィットするか、無料診断で **業務全体を見渡したうえでご提案** いたします。既製SaaS の継続コストを下げたい管理者層の方も、お気軽にご相談ください。',
        new: '御社の承認業務にどのパターンが効きそうか、[無料AI診断](/free-diagnosis) で **AI 活用の方向性** をレポートでお届けします。具体的な構成案・導入見積は [詳細レポート（¥5,500税込）](/free-diagnosis?paid=1) でお届けします。',
      },
    ],
  },
  {
    file: '20260505-chatai-vs-aiagent-housework.md',
    replacements: [
      {
        old: '「AIエージェントを試してみたいが、自社のどの業務が向いているのか自分では判断しづらい」という方向けに、Optiensでは **無料のAI活用診断** を提供しています。',
        new: '「AIエージェントを試してみたいが、自社のどの業務が向いているのか自分では判断しづらい」という方向けに、Optiens では **無料のAI活用診断** を提供しています。フォーム入力をもとに、業種・規模に合った活用方向性をレポートでお返しします。',
      },
    ],
  },
  {
    file: '20260505-free-diagnosis-report-content.md',
    replacements: [
      {
        old: 'ここまで読んでも「自社に当てはめるとどうなるか分からない」と感じる場合こそ、無料診断を試すタイミングです。レポートの紙の上で、御社の業務がAIとどう交差するかを具体的に見ていただくのが、一番早い判断材料になります。',
        new: 'ここまで読んでも「自社に当てはめるとどうなるか分からない」と感じる場合こそ、無料診断を試すタイミングです。Google Slides レポートで、御社の業種・規模に合った AI 活用の方向性をご確認いただけます。',
      },
    ],
  },
  {
    file: '20260505-hallucination-business-control.md',
    replacements: [
      {
        old: '御社の業務にどの設計が必要か、どこから着手するべきかは、業務内容・データの整備状況・許容できるリスクで変わります。まずは**[無料AI診断](/free-diagnosis)**で、御社の業務を5つの設計のどこに当てはめるべきかを一緒に整理しましょう。',
        new: '御社の業務にどの設計が必要か、どこから着手するべきかは、業務内容・データの整備状況・許容できるリスクで変わります。まずは **[無料AI診断](/free-diagnosis)** で、AI 活用の方向性とコスト感をご確認ください。本記事で取り上げた5つの設計を踏まえた個別の構成案は [詳細レポート（¥5,500税込）](/free-diagnosis?paid=1) でお届けします。',
      },
    ],
  },
  {
    file: '20260505-human-vs-ai-3-questions.md',
    replacements: [
      {
        old: '棚卸しの結果を踏まえて、「どの業務をどう自動化するか」の具体的な設計が必要になったら、Optiensの[無料AI診断](/free-diagnosis)をご利用ください。御社の業務リストを一緒に振り分け、優先順位とROIをセットで可視化したレポートをお届けします。',
        new: '棚卸しの結果を踏まえて、「どの業務をどう自動化するか」を検討するなら、Optiens の [無料AI診断](/free-diagnosis) をご利用ください。フォーム入力をもとに、業種・規模に合った AI 活用の方向性と ROI 試算をレポートでお届けします。個別業務の振り分け案は [詳細レポート（¥5,500税込）](/free-diagnosis?paid=1) でお届けします。',
      },
    ],
  },
  {
    file: '20260505-local-gov-ai-87percent-smb.md',
    replacements: [
      {
        old: 'Optiensでは、**御社の現状をAI事業者ガイドライン1.1版の観点から整理し、優先順位の見立てをレポートにまとめる[無料AI診断](/free-diagnosis)** を提供しています。費用は0円、フォームから業務状況をお伝えいただくだけです。',
        new: 'Optiens では **[無料AI診断](/free-diagnosis)** を提供しています。フォーム入力をもとに、業種・規模に合った AI 活用の方向性をレポートにまとめます。費用は0円、フォームから業務状況をお伝えいただくだけです。',
      },
      {
        old: 'Optiensの **[無料AI診断](/free-diagnosis)** では、御社の業務状況をうかがい、AI事業者ガイドライン1.1版の観点から「いま手を付けるべき優先順位」をレポートにまとめてお返しします。営業ツールを売り込むためのものではなく、**経営判断の材料として現状の棚卸し**にお使いください。',
        new: 'Optiens の **[無料AI診断](/free-diagnosis)** では、フォーム入力をもとに「業種に合った AI 活用の方向性」をレポートにまとめてお返しします。AI 事業者ガイドライン 1.1 版を踏まえた個別の運用要件整理は [詳細レポート（¥5,500税込）](/free-diagnosis?paid=1) でお届けします。',
      },
    ],
  },
  {
    file: '20260505-self-use-self-improve-crm.md',
    replacements: [
      {
        old: '「業務に合わせたCRM・業務システムを検討したい」「既存SaaSの月額が重くなってきた」という方は、まずは [無料AI診断](/free-diagnosis) で業務全体を見渡すところから始められます。Optiensが自社でどう運用しているかも含めて、率直にお伝えします。',
        new: '「業務に合わせたCRM・業務システムを検討したい」「既存SaaSの月額が重くなってきた」という方は、まずは [無料AI診断](/free-diagnosis) で **AI 活用の方向性** からご確認ください。具体的な専用構成案・導入見積は [詳細レポート（¥5,500税込）](/free-diagnosis?paid=1) でお届けします。',
      },
    ],
  },
  {
    file: '20260505-small-team-ai-agent-division.md',
    replacements: [
      {
        old: 'ご興味があれば、御社の業務フローに合わせて「最初の1役割」を一緒に設計します。無料診断では、現状の業務棚卸しとエージェント候補の提示までを行います。',
        new: 'ご興味があれば、まずは [無料AI診断](/free-diagnosis) で AI エージェント分業の方向性をご確認ください。具体的な「最初の1役割」の設計案は [詳細レポート（¥5,500税込）](/free-diagnosis?paid=1) でお届けします。',
      },
    ],
  },
  {
    file: '20260506-ai-agent-harness-design-5-patterns.md',
    replacements: [
      {
        old: 'Optiensは、AIエージェントの**設計から運用まで**、本稿で紹介した5つのハーネスパターンを標準実装としてご提供しています。「AI導入したいが暴走が怖い」という経営者の方は、[無料AI活用診断](/free-diagnosis)でご相談ください。御社の業務に合わせたハーネス設計案をレポートでお届けします。',
        new: 'Optiens は、AIエージェントの **設計から運用まで**、本稿で紹介した5つのハーネスパターンを標準実装としてご提供しています。「AI 導入したいが暴走が怖い」という経営者の方は、まず [無料AI活用診断](/free-diagnosis) で AI 活用の方向性をご確認ください。御社の業務に合わせた具体的なハーネス設計案は [詳細レポート（¥5,500税込）](/free-diagnosis?paid=1) でお届けします。',
      },
    ],
  },
  {
    file: '20260506-ai-agent-vs-chatbot-vs-rag-definition.md',
    replacements: [
      {
        old: '「うちはどれが必要?」がわからない段階で発注すると、必ず後悔します。Optiensの[無料AI活用診断](/free-diagnosis)では、御社の業務を見たうえで、**チャット型AI / RAG / AIエージェントのどれをどの順番で導入すべきか**をレポートでお届けします。',
        new: '「うちはどれが必要?」がわからない段階で発注すると、必ず後悔します。Optiens の [無料AI活用診断](/free-diagnosis) では、フォーム入力をもとに、業種・規模に応じた **チャット型AI / RAG / AIエージェントのどれが効きそうかの方向性** をレポートでお届けします。具体的な導入順序設計やアーキテクチャ図は [詳細レポート（¥5,500税込）](/free-diagnosis?paid=1) でお届けします。',
      },
    ],
  },
  {
    file: '20260506-ai-automation-quote-breakdown.md',
    replacements: [
      {
        old: 'Optiensは、**何にいくらかかるか**を最初の段階で明示することを徹底しています。「ブラックボックスの見積もりに不安を感じる」「他社見積もりの妥当性が知りたい」という方は、[無料AI活用診断](/free-diagnosis)でご相談ください。御社の業務に対する**目安レンジ**と、**見積もり項目の妥当性チェック**をレポートでお届けします。',
        new: 'Optiens は、**何にいくらかかるか** を最初の段階で明示することを徹底しています。「ブラックボックスの見積もりに不安を感じる」という方は、まず [無料AI活用診断](/free-diagnosis) で **コスト感の目安レンジ** をご確認ください。他社見積もりの妥当性チェックや個別の見積もり項目分析は [詳細レポート（¥5,500税込）](/free-diagnosis?paid=1) でお届けします。',
      },
    ],
  },
  {
    file: '20260506-ai-vs-rpa-smb-choice.md',
    replacements: [
      {
        old: '「自社の業務はどちらを選ぶべきか」「いま使っているRPAをAIに置き換えるべきか」といったご相談は、無料のAI活用診断で受け付けています。業務フローをヒアリングし、AI／RPA／併用のどれが妥当かを整理したレポートをお届けします。',
        new: '「自社の業務はどちらを選ぶべきか」「いま使っている RPA を AI に置き換えるべきか」といったご相談は、無料の AI 活用診断で受け付けています。フォーム入力をもとに、AI／RPA／併用のどれが効きそうかの方向性を Google Slides レポートでお届けします。具体的な置き換え設計や工数見積は [詳細レポート（¥5,500税込）](/free-diagnosis?paid=1) でお届けします。',
      },
    ],
  },
  {
    file: '20260506-chatgpt-claude-gemini-business-usage.md',
    replacements: [
      {
        old: '「自社にはどの組み合わせが合うのか」を知りたい方は、[無料のAI活用診断](/free-diagnosis)からお気軽にご相談ください。業務内容をお伺いし、貴社に合った構成案をレポートでお返しします。',
        new: '「自社にはどの組み合わせが合うのか」を知りたい方は、[無料の AI 活用診断](/free-diagnosis) からお気軽にご相談ください。フォーム入力をもとに、業種・規模に合った活用方向性をレポートでお返しします。具体的な構成案・契約推奨プランは [詳細レポート（¥5,500税込）](/free-diagnosis?paid=1) でお届けします。',
      },
    ],
  },
  {
    file: '20260506-clinic-ai-reservation-screening.md',
    replacements: [
      {
        old: 'Optiensでは、この構成を **保守ライトプラン（月額¥33,000・税込）** ベースで継続改善する形で提供しています。「自院の予約導線・患者数規模で本当に効果が出るのか」を含め、初回は無料診断で具体的な数字をお出しします。',
        new: 'Optiens では、この構成を **保守ライトプラン（月額¥33,000・税込）** ベースで継続改善する形で提供しています。「自院の予約導線・患者数規模で本当に効果が出るのか」をまず [無料診断](/free-diagnosis) で方向性とコスト感の目安レンジをご確認ください。具体的な数字や導入見積は [詳細レポート（¥5,500税込）](/free-diagnosis?paid=1) でお届けします。',
      },
    ],
  },
  {
    file: '20260506-construction-industry-ai-5-patterns.md',
    replacements: [
      {
        old: 'Optiensでは、北杜市・山梨県の地域工務店向けに、現場の運用に合わせた最小構成のAI導入支援を行っています。「うちの現場で何ができそうか」を確認したい方は、まず無料診断レポートからお試しください。過去案件・現状の業務フローを伺い、優先度の高い1パターンを具体的に提案します。',
        new: 'Optiens では、北杜市・山梨県の地域工務店向けに、現場の運用に合わせた最小構成の AI 導入支援を行っています。「うちの現場で何ができそうか」を確認したい方は、まず [無料診断レポート](/free-diagnosis) で活用方向性をご確認ください。過去案件や業務フローを踏まえた優先度の高い1パターンの具体提案は [詳細レポート（¥5,500税込）](/free-diagnosis?paid=1) でお届けします。',
      },
    ],
  },
  {
    file: '20260506-rag-ai-business-manual.md',
    replacements: [
      {
        old: '- **無料AI活用診断**: 御社の文書資産をヒアリングし、RAG適用範囲とコスト感をレポート化します → [/free-diagnosis](/free-diagnosis)',
        new: '- **無料AI活用診断**: フォーム入力をもとに、RAG 適用の方向性とコスト感の目安レンジをレポート化します → [/free-diagnosis](/free-diagnosis)。文書資産の詳細分析と個別 RAG 設計案は [詳細レポート（¥5,500税込）](/free-diagnosis?paid=1) でお届けします',
      },
    ],
  },
  {
    file: '20260506-solo-llc-ai-agent-management-optiens.md',
    replacements: [
      {
        old: '「うちも1人〜少人数で同じような体制を組みたい」という経営者の方は、[無料AI活用診断](/free-diagnosis)でご相談ください。御社の業務規模・既存ツールに合わせた**最適なAIエージェント構成案**をレポートでお届けします。**実際に動かしている事業者**ならではの、地に足のついた提案をお約束します。',
        new: '「うちも1人〜少人数で同じような体制を組みたい」という経営者の方は、[無料AI活用診断](/free-diagnosis) でまず方向性をご確認ください。御社の業務規模・既存ツールに合わせた **具体的なAIエージェント構成案** は [詳細レポート（¥5,500税込）](/free-diagnosis?paid=1) でお届けします。**実際に動かしている事業者** ならではの、地に足のついた提案をお約束します。',
      },
    ],
  },
  {
    file: '20260507-ai-as-extension-of-left-brain.md',
    replacements: [
      {
        old: '御社の業務のうち、どれが左脳業務で、どれが右脳業務か。Optiensの[無料AI活用診断](/free-diagnosis)では、この切り分けを起点にレポートをお届けします。',
        new: '御社の業務のうち、どれが AI に渡せて、どれが人間に残るか。Optiens の [無料AI活用診断](/free-diagnosis) では、業種・規模に合った AI 活用の方向性をレポートでお届けします。本記事で取り上げた左脳/右脳の切り分けに基づく個別業務分析は [詳細レポート（¥5,500税込）](/free-diagnosis?paid=1) でお届けします。',
      },
    ],
  },
  {
    file: '20260507-business-visualization-prerequisite-for-ai.md',
    replacements: [
      {
        old: '御社の業務がどこまで見える化されているか。Optiensの[無料AI活用診断](/free-diagnosis)では、現状の業務構造を整理した上で、**どこを自動化し、どこに属人性を残すか**の仕分け案をレポートでお届けします。',
        new: '御社の業務がどこまで見える化されているか。Optiens の [無料AI活用診断](/free-diagnosis) では、フォーム入力をもとに業種・規模に合った AI 活用の方向性をレポートでお届けします。業務見える化に基づく個別の自動化／属人性仕分け案は [詳細レポート（¥5,500税込）](/free-diagnosis?paid=1) でお届けします。',
      },
    ],
  },
  {
    file: '20260507-meaning-crisis-management.md',
    replacements: [
      {
        old: '御社で「意味の危機」がどう現れているか、どう対応すべきか。Optiens の[無料AI活用診断](/free-diagnosis)では、業務効率の話だけでなく、**働く人の役割再設計**もご提案します。',
        new: '御社で「意味の危機」がどう現れているか、まず [無料AI活用診断](/free-diagnosis) で AI 活用の方向性と業務効率改善の目安をご確認ください。働く人の役割再設計や組織設計の個別ご提案は、[詳細レポート（¥5,500税込）](/free-diagnosis?paid=1) でお届けします。',
      },
    ],
  },
  {
    file: '20260507-full-automation-limit-and-orchestrator.md',
    replacements: [
      {
        old: '御社にAIオーケストレーター候補の人材はいますか? Optiens の[無料AI活用診断](/free-diagnosis)では、導入計画と合わせて、**社内のオーケストレーター候補の特定と育成パス**もご提案します。',
        new: '御社にAIオーケストレーター候補の人材はいますか? まず [無料AI活用診断](/free-diagnosis) で AI 活用の方向性をご確認ください。具体的な導入計画や社内体制設計は [詳細レポート（¥5,500税込）](/free-diagnosis?paid=1) でお届けします。',
      },
    ],
  },
  {
    file: '20260507-ai-orchestrator-job-role-for-smb.md',
    replacements: [
      {
        old: '御社にオーケストレーター候補は誰がいるか。Optiens の[無料AI活用診断](/free-diagnosis)では、AI 導入計画と合わせて、**社内のオーケストレーター候補の特定と育成パス**もご提案します。',
        new: '御社のAI活用に向く方向性を確認したい方は、[無料AI活用診断](/free-diagnosis) からお試しください。具体的な AI 導入計画や社内体制設計は [詳細レポート（¥5,500税込）](/free-diagnosis?paid=1) でお届けします。',
      },
    ],
  },
];

let total = 0;
let success = 0;
const failures = [];

for (const fix of fixes) {
  const path = resolve(blogDir, fix.file);
  let content;
  try {
    content = readFileSync(path, 'utf-8');
  } catch (err) {
    console.error(`MISSING FILE: ${fix.file}`);
    failures.push({ file: fix.file, reason: 'file not found' });
    continue;
  }

  let modified = false;
  for (const r of fix.replacements) {
    total++;
    if (content.includes(r.old)) {
      content = content.replace(r.old, r.new);
      success++;
      modified = true;
    } else {
      failures.push({ file: fix.file, reason: 'old text not found', preview: r.old.slice(0, 80) });
    }
  }

  if (modified) {
    writeFileSync(path, content);
    console.log(`OK: ${fix.file}`);
  }
}

console.log(`\nDone: ${success}/${total} replacements successful`);
if (failures.length > 0) {
  console.log(`\nFailures (${failures.length}):`);
  failures.forEach(f => console.log(`  ${f.file}: ${f.reason}`, f.preview ? `→ "${f.preview}..."` : ''));
}
