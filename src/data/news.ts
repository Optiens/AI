/**
 * ニュース記事データ
 * 新しい記事はこのファイルに追記してください。
 * slug はURLに使用されます（英数字・ハイフンのみ）。
 * date は YYYY-MM-DD 形式で記載してください。
 * body は HTML 文字列です（改行は <br>、段落は <p>...</p>）。
 */
export type NewsArticle = {
  slug: string;
  title: string;
  date: string;
  body: string;
};

export const newsArticles: NewsArticle[] = [
  {
    slug: 'official-website-launch',
    title: 'Optiens 公式ウェブサイト公開のお知らせ',
    date: '2026-03-01',
    body: `
<p>平素より大変お世話になっております。</p>
<p>この度、Optiensの公式ウェブサイトが公開されましたことをお知らせいたします。</p>
<p>当サイトでは、弊社のビジョン、AI駆動型水耕栽培ソリューションの詳細、持続可能な農業への取り組みをご紹介しております。</p>
<p>今後、ウェブサイトを通じて、最新の技術情報、研究成果、イベント情報などを定期的に発信してまいります。</p>
<p>皆様の農業における課題解決と、持続可能な食の未来への貢献を目指し、尽力してまいりますので、引き続きご支援ご鞭撻を賜りますようお願い申し上げます。</p>
<p>どうぞよろしくお願いいたします。</p>
    `,
  },
];
