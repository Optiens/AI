/**
 * /review-monitor デモ用 事前用意レビュー返信データ
 *
 * - 各レビュー × 言語(ja/en) × 口調(polite/standard/friendly) = 6 通り × 10 レビュー = 60 件
 * - 「AI で返信下書きを生成」ボタン押下時に API を呼ばず、ここから即座に返す
 * - デモ目的なので OpenAI API 利用料を消費しない構成
 */

export type ReplyLang = 'ja' | 'en'
export type ToneStyle = 'polite' | 'standard' | 'friendly'

type ReviewReply = {
  text: string
  tone: 'low_rating' | 'mid_rating' | 'high_rating'
  key_points: string[]
  alert_priority: 'high' | 'medium' | 'low'
}

type ReviewReplyMap = {
  [reviewId: string]: {
    [lang in ReplyLang]: {
      [tone in ToneStyle]: ReviewReply
    }
  }
}

// ─────────────────────────────────────────
// 事前用意済みのサンプル応答（10 レビュー × 6 通り）
// ─────────────────────────────────────────
export const MOCK_REPLIES: ReviewReplyMap = {
  // =============================================================
  // R-2003: 食べログ ★2 「料理は美味しいが提供が遅い」(ja, low)
  // =============================================================
  'R-2003': {
    ja: {
      polite: {
        text: 'この度はご多忙のところご来店を賜り、誠にありがとうございました。\n\n土曜日のお昼時という最も混雑する時間帯にもかかわらず、お料理のご提供までに 45 分もお待たせしてしまいましたこと、心よりお詫び申し上げます。お子様連れでお越しいただいたお客様に、楽しいひとときをお届けできなかったことを深く反省しております。\n\nピーク時の調理オペレーションを改めて点検し、ご提供までのお時間短縮に向けて改善に取り組んで参ります。\n\nお料理自体はお気に召していただけたとのお言葉、何より励みとなります。何卒ご寛恕賜りますとともに、改めましてのご来訪を心よりお待ち申し上げております。',
        tone: 'low_rating',
        key_points: ['提供時間 45分', 'お子様連れ', 'ピーク時オペレーション'],
        alert_priority: 'high',
      },
      standard: {
        text: 'この度はご来店いただき、誠にありがとうございました。\n\n土曜のお昼時という混雑時間にもかかわらず、オムライスのご提供までに 45 分もお待たせしてしまい、大変申し訳ございませんでした。お子様連れでお越しいただいたにもかかわらず、ゆっくりお食事を楽しんでいただけなかったこと、深くお詫び申し上げます。\n\nピーク時の調理・配膳オペレーションを見直し、ご提供時間の改善に取り組んで参ります。料理を美味しいと評価いただけたことが何よりの励みです。\n\nまたの機会がございましたら、ぜひお越しいただけますと幸いです。',
        tone: 'low_rating',
        key_points: ['提供時間 45分', 'オムライス', 'お子様連れ'],
        alert_priority: 'high',
      },
      friendly: {
        text: 'ご来店いただきありがとうございました。\n\n土曜のお昼にお子様連れでお越しいただいたのに、オムライスのご提供まで 45 分もお待たせしてしまい、本当に申し訳ありませんでした！お子様もきっと飽きてしまいましたよね…。\n\nピーク時のオペレーション、しっかり見直していきます。料理を美味しいと言っていただけて、すごく励みになります。\n\nまたぜひお越しください！次回はもっとスムーズにご案内できるようにします。',
        tone: 'low_rating',
        key_points: ['オムライス', 'お子様', 'ピーク時'],
        alert_priority: 'high',
      },
    },
    en: {
      polite: {
        text: 'Thank you very much for taking the time to visit us and for sharing your honest feedback.\n\nWe are deeply sorry that the wait time for your omurice extended to 45 minutes during our busy Saturday lunch service. We can only imagine how difficult that was, especially with a small child who became restless during the wait.\n\nWe will be carefully reviewing our peak-hour kitchen operations to significantly reduce wait times in the future. It is genuinely encouraging to hear that you found the food enjoyable.\n\nWe sincerely hope to have the privilege of welcoming you back to our cafe.',
        tone: 'low_rating',
        key_points: ['45-minute wait', 'omurice', 'family with child'],
        alert_priority: 'high',
      },
      standard: {
        text: 'Thank you for visiting us and for taking the time to share your feedback.\n\nWe sincerely apologize that the omurice took 45 minutes to be served on a busy Saturday lunch — we can only imagine how trying it was with a small child waiting. We are reviewing our peak-hour kitchen operations to ensure faster service going forward.\n\nIt means a lot that you found the food itself enjoyable. We hope to have the chance to provide a much smoother experience on your next visit.',
        tone: 'low_rating',
        key_points: ['45-minute wait', 'omurice', 'kids'],
        alert_priority: 'high',
      },
      friendly: {
        text: "Thanks so much for visiting and for being honest with us!\n\nWe are really sorry your omurice took 45 minutes on that busy Saturday — that's just way too long, especially with a little one in tow. We're working on tightening up the kitchen flow during peak hours.\n\nGlad the food itself hit the spot. Please give us another try — we promise a smoother experience next time!",
        tone: 'low_rating',
        key_points: ['omurice', 'wait time', 'kids'],
        alert_priority: 'high',
      },
    },
  },

  // =============================================================
  // R-2002: Google ★5 「八ヶ岳の眺めが最高」(ja, high)
  // =============================================================
  'R-2002': {
    ja: {
      polite: {
        text: 'この度はご来店、ならびに温かいお言葉を賜り、誠にありがとうございました。\n\n八ヶ岳の眺めにご満足いただけましたこと、ハーブティーや季節のサラダプレートをお楽しみいただけましたこと、スタッフ一同心より光栄に存じます。「絶対に行きたい」とのお言葉は、これ以上ない励みでございます。\n\n季節ごとに移ろう景色と、その時期にしか味わえないメニューをご用意してお待ち申し上げております。お近くへお越しの際は、何卒お立ち寄りいただけますと幸甚に存じます。',
        tone: 'high_rating',
        key_points: ['八ヶ岳の眺め', 'ハーブティー', '季節のサラダプレート'],
        alert_priority: 'low',
      },
      standard: {
        text: 'ご来店・温かい口コミをいただきありがとうございました。\n\n八ヶ岳の眺めに癒され、ハーブティーや季節のサラダプレートをお楽しみいただけたとのこと、スタッフ一同とても嬉しく思っております。「絶対に行きたい」とのお言葉、何よりの励みです。\n\n季節ごとに変わる景色とメニューをご用意してお待ちしております。またのご来店を心よりお待ち申し上げております。',
        tone: 'high_rating',
        key_points: ['八ヶ岳の眺め', 'ハーブティー', '季節のサラダ'],
        alert_priority: 'low',
      },
      friendly: {
        text: '素敵な口コミをありがとうございました！\n\n八ヶ岳の眺めとハーブティー、季節のサラダプレートを気に入っていただけて、私たちもすごく嬉しいです！スタッフへのお言葉も励みになります。\n\n季節ごとに景色もメニューも変わるので、ぜひまた違う季節に遊びに来てくださいね。お待ちしてます！',
        tone: 'high_rating',
        key_points: ['八ヶ岳', 'ハーブティー', 'サラダプレート'],
        alert_priority: 'low',
      },
    },
    en: {
      polite: {
        text: 'Thank you most sincerely for your visit and for these wonderful words about our cafe.\n\nWe are truly honored that you enjoyed the view of Mt. Yatsugatake, our herbal tea, and the seasonal salad plate. Your kind words about our staff are the greatest possible encouragement.\n\nThe scenery and our menu change with each season, and we would be deeply grateful for the opportunity to welcome you back to experience them.',
        tone: 'high_rating',
        key_points: ['Mt. Yatsugatake view', 'herbal tea', 'seasonal salad'],
        alert_priority: 'low',
      },
      standard: {
        text: 'Thank you so much for the wonderful review and for visiting us.\n\nWe are delighted that you enjoyed the view of Mt. Yatsugatake, our herbal tea, and the seasonal salad plate. Your kind comments about our staff mean the world to us.\n\nWe look forward to welcoming you back to experience our changing seasonal scenery and menu.',
        tone: 'high_rating',
        key_points: ['Mt. Yatsugatake', 'herbal tea', 'seasonal salad'],
        alert_priority: 'low',
      },
      friendly: {
        text: "What a lovely review — thank you so much!\n\nWe're thrilled you enjoyed the Yatsugatake view, the herbal tea, and our seasonal salad. Your kind words about the staff really made our day!\n\nThe view and menu change with the seasons, so please come back and see us again sometime!",
        tone: 'high_rating',
        key_points: ['view', 'herbal tea', 'salad'],
        alert_priority: 'low',
      },
    },
  },

  // =============================================================
  // R-2001: Google ★4 Hannah K.（英語口コミ, high）
  // =============================================================
  'R-2001': {
    ja: {
      polite: {
        text: '海外からのお客様にお越しいただき、また温かい口コミを賜り、誠にありがとうございます。\n\n八ヶ岳の眺めとバジルパスタの香りをお楽しみいただけましたこと、スタッフ一同光栄に存じます。週末はやはり混雑しがちでございますが、お気持ちよくお過ごしいただけますよう、よりサービス向上に努めて参ります。\n\nまた清里にお越しの際は、ぜひお立ち寄りいただけますと幸甚に存じます。',
        tone: 'high_rating',
        key_points: ['八ヶ岳の眺め', 'バジルパスタ', '海外ゲスト'],
        alert_priority: 'low',
      },
      standard: {
        text: '海外からのお客様にお越しいただき、温かい口コミをいただきありがとうございました。\n\n八ヶ岳の眺めとバジルパスタを楽しんでいただけたとのこと、スタッフ一同嬉しく思います。週末は確かに混雑することが多いため、より快適にお過ごしいただける運営を心がけて参ります。\n\nまた清里にお越しの際は、ぜひお立ち寄りください。',
        tone: 'high_rating',
        key_points: ['八ヶ岳', 'バジルパスタ', '週末の混雑'],
        alert_priority: 'low',
      },
      friendly: {
        text: '海外からお越しいただいて、しかも素敵な口コミをありがとうございます！\n\n八ヶ岳の眺めとバジルパスタを楽しんでいただけて、スタッフ一同とっても嬉しいです。週末は混雑しがちですが、平日もおすすめですよ。\n\nまた清里に来られた際はぜひ寄ってください！お待ちしてます。',
        tone: 'high_rating',
        key_points: ['view', 'basil pasta', '清里'],
        alert_priority: 'low',
      },
    },
    en: {
      polite: {
        text: 'Thank you most sincerely for visiting our cafe from abroad and for taking the time to leave such a thoughtful review.\n\nWe are deeply honored that you enjoyed the view of Mt. Yatsugatake and our basil pasta. We acknowledge that weekends can be quite busy, and we are continuously working to enhance the experience for all our guests during peak times.\n\nShould you find yourself in Kiyosato again, we would be most grateful for the opportunity to welcome you back.',
        tone: 'high_rating',
        key_points: ['Mt. Yatsugatake', 'basil pasta', 'international guest'],
        alert_priority: 'low',
      },
      standard: {
        text: 'Thank you so much for visiting us from abroad and for leaving such a kind review.\n\nWe are glad you enjoyed the view of Mt. Yatsugatake and our basil pasta. You are right that weekends can get quite busy — we appreciate your patience and are always working on improving the flow during peak times.\n\nWe hope to welcome you back next time you are in Kiyosato!',
        tone: 'high_rating',
        key_points: ['Mt. Yatsugatake', 'basil pasta', 'weekend busy'],
        alert_priority: 'low',
      },
      friendly: {
        text: "Thank you so much for visiting all the way from abroad and leaving such a kind review!\n\nSo glad you enjoyed the Yatsugatake view and the basil pasta. You're right — weekends can get really busy, but weekdays are a hidden gem if you're ever in the area again!\n\nLooking forward to seeing you next time you swing through Kiyosato!",
        tone: 'high_rating',
        key_points: ['view', 'basil pasta', 'Kiyosato'],
        alert_priority: 'low',
      },
    },
  },

  // =============================================================
  // R-1999: Instagram ★4「キッシュ美味しかった」(ja, high)
  // =============================================================
  'R-1999': {
    ja: {
      polite: {
        text: '清里へお越しの際にお立ち寄りいただき、また温かいコメントを賜り誠にありがとうございました。\n\n本日のキッシュをお気に召していただけたこと、スタッフ一同光栄に存じます。塩味のバランスは日々調整しておりますので、季節ごとの違いもお楽しみいただけますと幸いです。\n\n朝の時間帯は焼きたてパンや爽やかな空気の中でのコーヒーをお召し上がりいただける、特別なひとときでございます。ぜひ朝のご来店もお待ち申し上げております。',
        tone: 'high_rating',
        key_points: ['キッシュ', '塩味', '朝の時間帯'],
        alert_priority: 'low',
      },
      standard: {
        text: '清里にお越しの際にお立ち寄りいただきありがとうございます。\n\n本日のキッシュ、塩味のバランスを気に入っていただけて嬉しいです。スタッフが日々調整しているポイントなので、励みになります。\n\n朝の時間帯は焼きたてパンとモーニングコーヒーをご用意していて、空気感も格別です。ぜひ朝もお試しください！',
        tone: 'high_rating',
        key_points: ['キッシュ', '塩味', '朝モーニング'],
        alert_priority: 'low',
      },
      friendly: {
        text: 'いつもありがとうございます！\n\n今日のキッシュ、しっかりめの塩味、気に入ってもらえてよかったです！日替わりでちょっとずつ変えてるので、また違うバージョンも試してみてくださいね。\n\n朝の時間帯、焼きたてパンとコーヒーがおすすめです。次は朝に会えるのを楽しみにしてます！',
        tone: 'high_rating',
        key_points: ['キッシュ', '塩味', '朝'],
        alert_priority: 'low',
      },
    },
    en: {
      polite: {
        text: 'Thank you most sincerely for stopping by during your visit to Kiyosato and for taking the time to share your thoughts.\n\nWe are honored that you enjoyed our quiche of the day. The salt balance is something our kitchen carefully adjusts daily, and we hope you continue to enjoy the seasonal variations.\n\nOur morning hours offer fresh-baked breads and a particularly serene atmosphere with coffee. We would be delighted to welcome you in the morning on your next visit.',
        tone: 'high_rating',
        key_points: ['quiche', 'salt balance', 'morning hours'],
        alert_priority: 'low',
      },
      standard: {
        text: "Thank you for stopping by while visiting Kiyosato!\n\nGlad you enjoyed today's quiche — the salt balance is something we adjust daily, so it's great to hear it landed well. Our morning hours feature fresh-baked breads and a wonderful atmosphere — please give the morning a try next time!",
        tone: 'high_rating',
        key_points: ['quiche', 'salt', 'morning'],
        alert_priority: 'low',
      },
      friendly: {
        text: "Thanks for swinging by!\n\nGlad today's quiche hit the spot — we're always tweaking the seasoning, so it's nice to hear it worked! Mornings here are something special with fresh bread and coffee. Hope to see you for breakfast next time!",
        tone: 'high_rating',
        key_points: ['quiche', 'morning'],
        alert_priority: 'low',
      },
    },
  },

  // =============================================================
  // R-1998: 食べログ ★3 「デザートは良かった」(ja, mid)
  // =============================================================
  'R-1998': {
    ja: {
      polite: {
        text: 'この度はご来店ならびに率直なご感想を賜り、誠にありがとうございました。\n\nハンバーグの味付けがお口に合いませんでしたこと、申し訳なく存じます。日々味の調整は行っておりますが、お客様一人ひとりのお好みに完全にお応えするのは難しく、貴重なご意見として受け止めております。\n\nバスクチーズケーキを「絶品」とお褒めいただきましたこと、デザート担当のパティシエ共々深く感謝申し上げます。雰囲気目当ての再訪というお言葉も、心より光栄に存じます。\n\n何卒、改めましてのご来訪を心よりお待ち申し上げております。',
        tone: 'mid_rating',
        key_points: ['ハンバーグの味', 'バスクチーズケーキ', '雰囲気'],
        alert_priority: 'medium',
      },
      standard: {
        text: 'ご来店・率直な口コミをいただきありがとうございました。\n\nハンバーグの味付けがお好みに合わなかったとのこと、申し訳ございません。味の濃さは個人差が大きい部分ですが、いただいたご意見として受け止めて参ります。\n\nバスクチーズケーキを絶品とお褒めいただけたこと、パティシエ含めスタッフ一同とても嬉しいです。立地・雰囲気を気に入っていただけたとのこと、また再訪のお言葉も励みになります。\n\nまたのお越しをお待ちしております。',
        tone: 'mid_rating',
        key_points: ['ハンバーグ', 'バスクチーズケーキ', '立地'],
        alert_priority: 'medium',
      },
      friendly: {
        text: '率直な口コミ、ありがとうございました。\n\nハンバーグの味付け、お口に合わずにすみません！味の濃さはお好み分かれるところなので、貴重な意見として受け止めます。\n\nバスクチーズケーキを「絶品」と言ってもらえて、パティシエが大喜びです！立地と雰囲気で再訪してくださるとのこと、本当にうれしいです。\n\nまたぜひお越しください！',
        tone: 'mid_rating',
        key_points: ['ハンバーグ', 'チーズケーキ', '雰囲気'],
        alert_priority: 'medium',
      },
    },
    en: {
      polite: {
        text: 'Thank you sincerely for your visit and for sharing such candid feedback.\n\nWe are truly sorry that the hamburger seasoning was not to your taste. While we do adjust seasonings daily, we recognize that taste preferences vary greatly, and we will take your comments as valuable input.\n\nWe are deeply honored that you described our Basque cheesecake as exceptional. Our pastry chef will be most encouraged by your kind words. We are also grateful that the location and atmosphere drew you to consider a return visit.\n\nWe sincerely look forward to welcoming you back.',
        tone: 'mid_rating',
        key_points: ['hamburger seasoning', 'Basque cheesecake', 'atmosphere'],
        alert_priority: 'medium',
      },
      standard: {
        text: 'Thank you for visiting and for the honest review.\n\nWe are sorry the hamburger seasoning was a bit too strong for your taste — we acknowledge that flavor intensity is quite personal, and your feedback is valuable to us.\n\nIt means a lot that you praised our Basque cheesecake — our pastry chef will be thrilled! And thank you for considering a return visit for the location and atmosphere. We look forward to welcoming you back.',
        tone: 'mid_rating',
        key_points: ['hamburger', 'cheesecake', 'atmosphere'],
        alert_priority: 'medium',
      },
      friendly: {
        text: "Thanks for the honest review!\n\nSorry the hamburger was a bit much in the seasoning department — flavor intensity is super personal, and we appreciate the heads-up. Stoked you loved the Basque cheesecake — our pastry chef will be over the moon!\n\nLooking forward to seeing you back for the view and vibe. Thanks again!",
        tone: 'mid_rating',
        key_points: ['hamburger', 'cheesecake', 'view'],
        alert_priority: 'medium',
      },
    },
  },

  // =============================================================
  // R-1997: Google ★5 まるちゃん「ベビーカーで入りやすい」(ja, high)
  // =============================================================
  'R-1997': {
    ja: {
      polite: {
        text: 'この度はご来店ならびに丁寧な口コミを賜り、誠にありがとうございました。\n\n駐車場から店内まで段差を抑えた設計や、お子様メニューへのご評価、心より光栄に存じます。お子様連れのお客様にも安心してお過ごしいただける店舗づくりは、私どもが大切にしている点でございます。\n\nまたお近くへお越しの際は、ぜひご家族でお立ち寄りいただけますと幸甚に存じます。',
        tone: 'high_rating',
        key_points: ['段差なし設計', 'ベビーカー', 'お子様メニュー'],
        alert_priority: 'low',
      },
      standard: {
        text: 'ご来店・温かい口コミをありがとうございました。\n\n駐車場から店内までの段差を抑えた設計、お子様メニューが助けになったとのこと、お客様にとって安心してお過ごしいただける店舗を目指す上で、何よりの励みです。\n\nぜひまたご家族でお越しください。お待ちしております。',
        tone: 'high_rating',
        key_points: ['ベビーカー', '段差', 'お子様メニュー'],
        alert_priority: 'low',
      },
      friendly: {
        text: 'ご来店ありがとうございました！\n\nベビーカーで入りやすかったとのこと、お子様メニューも気に入っていただけて、本当にうれしいです。お子様連れのお客様にもゆっくり過ごしてもらえるお店を目指してます。\n\nまたぜひご家族でお越しください！',
        tone: 'high_rating',
        key_points: ['ベビーカー', 'お子様'],
        alert_priority: 'low',
      },
    },
    en: {
      polite: {
        text: 'Thank you sincerely for your visit and for taking the time to write such a thoughtful review.\n\nWe are honored by your kind comments regarding our step-free design from the parking area and our children\'s menu. Creating an environment where families with small children can feel at ease is something we hold dear.\n\nWe would be most delighted to welcome you and your family back on your next visit.',
        tone: 'high_rating',
        key_points: ['step-free design', 'stroller-friendly', "kids menu"],
        alert_priority: 'low',
      },
      standard: {
        text: "Thank you for your visit and for the kind review!\n\nWe're so glad the step-free access from the parking lot and our kids menu were helpful. Making our cafe comfortable for families with young children is something we really care about.\n\nPlease come back and visit us as a family anytime!",
        tone: 'high_rating',
        key_points: ['step-free', 'kids menu'],
        alert_priority: 'low',
      },
      friendly: {
        text: "Thanks so much for the kind review!\n\nWe're really glad the stroller access and the kids menu worked out for you. Making it easy for families to enjoy themselves is exactly what we're going for!\n\nCan't wait to see you and the kids again!",
        tone: 'high_rating',
        key_points: ['stroller', 'family'],
        alert_priority: 'low',
      },
    },
  },

  // =============================================================
  // R-1996: 食べログ ★1 「予約していたのに席がなかった」(ja, low - critical)
  // =============================================================
  'R-1996': {
    ja: {
      polite: {
        text: 'この度は当店をご予約いただきましたにもかかわらず、お席をご用意できず 30 分もお待たせするという、あってはならない事態を招きましたこと、心より深くお詫び申し上げます。\n\nお客様への対応に至らぬ点があり、お料理以前の問題であったとのご指摘、すべて私どもの責任でございます。\n\n予約管理の運用フローを直ちに見直し、ダブルブッキング防止の手順を再構築いたします。改善状況のご報告も含め、責任をもって対応させていただきたく存じますので、お差し支えなければ別途ご連絡を頂戴できますと幸いでございます。\n\n二度とこのようなことがないよう、店舗運営の根本から改めて参ります。',
        tone: 'low_rating',
        key_points: ['予約システム', '30分待ち', '対応の問題'],
        alert_priority: 'high',
      },
      standard: {
        text: 'この度は当店をご予約いただいたにもかかわらず、お席をご用意できず 30 分お待たせしてしまう事態となり、心よりお詫び申し上げます。\n\nお料理以前の問題であるとのご指摘、ごもっともです。予約管理の運用フローを直ちに見直し、ダブルブッキング防止の仕組みを再構築いたします。\n\n改善のご報告も含め、責任をもって対応させていただきたく存じます。お差し支えなければ別途ご連絡をいただけますでしょうか。二度と同様のことが起きぬよう、店舗運営の根本から改めて参ります。',
        tone: 'low_rating',
        key_points: ['予約', '30分待ち', '管理ミス'],
        alert_priority: 'high',
      },
      friendly: {
        text: '予約をいただいていたのに、お席のご用意ができず 30 分もお待たせしてしまい、本当に申し訳ありませんでした。料理以前の問題で、完全に私たちの責任です。\n\n予約管理の仕組みを根本から見直して、ダブルブッキングが起きない運用に再構築します。よろしければ別途ご連絡いただけませんか。改善状況も含めてしっかり対応させてください。\n\nこのようなご迷惑、二度と起こさないよう徹底します。',
        tone: 'low_rating',
        key_points: ['予約', '30分'],
        alert_priority: 'high',
      },
    },
    en: {
      polite: {
        text: 'We sincerely and deeply apologize that despite your reservation, we were unable to provide a seat and kept you waiting for 30 minutes. This is wholly unacceptable.\n\nYour observation that the issue lies before food service is entirely correct, and the responsibility rests entirely with us.\n\nWe will immediately review our reservation management flow and rebuild safeguards against double-booking. We would be grateful for the opportunity to follow up on the corrective actions directly with you, should you be willing to share contact details.\n\nWe will work to ensure this never happens again.',
        tone: 'low_rating',
        key_points: ['reservation', '30-minute wait', 'mismanagement'],
        alert_priority: 'high',
      },
      standard: {
        text: "We are deeply sorry that despite your reservation, we couldn't seat you and kept you waiting 30 minutes. You are absolutely right that this is a problem before any food is served — the responsibility is entirely ours.\n\nWe are immediately reviewing our reservation system and rebuilding safeguards against double-booking. We would appreciate the opportunity to follow up with you directly on the improvements, if you are willing to share your contact details.\n\nWe will make sure this never happens again.",
        tone: 'low_rating',
        key_points: ['reservation', '30-minute wait'],
        alert_priority: 'high',
      },
      friendly: {
        text: "We are so sorry — you had a reservation and we still made you wait 30 minutes for a table. You're completely right: this is a problem before the food even comes into play, and it's entirely on us.\n\nWe're rebuilding the reservation system from the ground up to prevent double-booking. If you're willing, please reach out — we'd love the chance to make this right and report back on the changes.",
        tone: 'low_rating',
        key_points: ['reservation', 'wait'],
        alert_priority: 'high',
      },
    },
  },

  // =============================================================
  // R-1995: Google ★4 田中健一「素敵なカフェ」(ja, high)
  // =============================================================
  'R-1995': {
    ja: {
      polite: {
        text: 'この度はご来店ならびに丁寧な口コミを賜り、誠にありがとうございました。\n\n清里の自然に囲まれた当店で、コーヒーの香りとともにごゆっくりとお過ごしいただけましたこと、何より光栄に存じます。\n\n季節の移ろいとともに変わる景色と、その時々のおすすめメニューをご用意してお待ち申し上げております。何卒またのお越しを心よりお待ち申し上げております。',
        tone: 'high_rating',
        key_points: ['清里の自然', 'コーヒー', 'ゆっくり過ごす'],
        alert_priority: 'low',
      },
      standard: {
        text: 'ご来店・温かい口コミをありがとうございました。\n\n清里の自然の中で、コーヒーの香りとともにゆっくりとした時間を過ごしていただけたとのこと、スタッフ一同嬉しく思います。\n\n季節ごとに変わる景色とおすすめメニューをご用意してお待ちしております。またのお越しをお待ちしております。',
        tone: 'high_rating',
        key_points: ['清里の自然', 'コーヒー', 'ゆっくり'],
        alert_priority: 'low',
      },
      friendly: {
        text: 'ご来店ありがとうございました！\n\n清里の自然の中、コーヒーでゆっくりしてもらえてよかったです。私たちもこの環境が一番のお気に入りなんです。\n\n季節ごとに表情が変わるので、また違う季節にもぜひ。お待ちしてます！',
        tone: 'high_rating',
        key_points: ['清里', 'コーヒー'],
        alert_priority: 'low',
      },
    },
    en: {
      polite: {
        text: 'Thank you sincerely for your visit and for these gracious words.\n\nIt is our greatest honor that you were able to enjoy a peaceful time surrounded by the nature of Kiyosato, accompanied by the aroma of our coffee. The seasonal scenery and corresponding menu await your next visit.',
        tone: 'high_rating',
        key_points: ['Kiyosato nature', 'coffee', 'peaceful time'],
        alert_priority: 'low',
      },
      standard: {
        text: 'Thank you so much for visiting and leaving such a kind review. We are happy you enjoyed a peaceful time in the Kiyosato nature with our coffee. Looking forward to welcoming you back during another season!',
        tone: 'high_rating',
        key_points: ['nature', 'coffee'],
        alert_priority: 'low',
      },
      friendly: {
        text: 'Thanks for the kind words! Glad you enjoyed slowing down with a coffee in the Kiyosato nature — that\'s exactly the vibe we love. Hope to see you in a different season!',
        tone: 'high_rating',
        key_points: ['nature', 'coffee'],
        alert_priority: 'low',
      },
    },
  },

  // =============================================================
  // R-1994: Instagram ★5「朝のテラス席が気持ちよかった」(ja, high)
  // =============================================================
  'R-1994': {
    ja: {
      polite: {
        text: 'この度はテラス席にてのご朝食、ならびに温かいお言葉を賜り、誠にありがとうございました。\n\n朝の空気とコーヒー、焼きたてマフィンを「完璧な朝食」とお褒めいただきましたこと、スタッフ一同心より光栄に存じます。テラス席ならではのひとときをお気に召していただけたのではないかと存じます。\n\n季節ごとのマフィンもご用意してお待ち申し上げております。再びのお運びを心よりお待ち申し上げております。',
        tone: 'high_rating',
        key_points: ['朝のテラス席', 'コーヒー', '焼きたてマフィン'],
        alert_priority: 'low',
      },
      standard: {
        text: '朝のテラス席でのご朝食、温かいコメントありがとうございました。\n\nコーヒーと焼きたてマフィンで「完璧な朝食」と感じていただけたこと、スタッフ一同とても嬉しく思います。\n\n季節ごとのマフィンも展開しているので、ぜひまた朝の時間にお越しください。お待ちしています！',
        tone: 'high_rating',
        key_points: ['朝', 'マフィン', 'コーヒー'],
        alert_priority: 'low',
      },
      friendly: {
        text: '朝のテラス席、最高ですよね！\n\n焼きたてマフィンとコーヒーで「完璧な朝食」と言ってもらえて、めちゃくちゃ嬉しいです。マフィンは季節で変えてるので、また違う時期にもぜひ。\n\n次の朝もお待ちしてます！',
        tone: 'high_rating',
        key_points: ['朝', 'テラス', 'マフィン'],
        alert_priority: 'low',
      },
    },
    en: {
      polite: {
        text: 'Thank you most sincerely for visiting our terrace at breakfast and for these wonderful words.\n\nWe are deeply honored that the morning air, coffee, and freshly baked muffin came together as your "perfect breakfast." The terrace seating offers a special moment we hope you enjoyed.\n\nOur seasonal muffins await your next visit. We look forward to welcoming you back.',
        tone: 'high_rating',
        key_points: ['morning terrace', 'muffin', 'coffee'],
        alert_priority: 'low',
      },
      standard: {
        text: 'Thank you for the wonderful review of our morning terrace! We are delighted that the coffee and freshly baked muffin made for a "perfect breakfast." Our muffins change with the seasons, so we hope to welcome you again on another morning!',
        tone: 'high_rating',
        key_points: ['terrace', 'muffin', 'coffee'],
        alert_priority: 'low',
      },
      friendly: {
        text: 'Mornings on the terrace really are something! So glad the muffin and coffee made it a perfect breakfast for you. Our muffins rotate by season — come back for another one!',
        tone: 'high_rating',
        key_points: ['terrace', 'muffin'],
        alert_priority: 'low',
      },
    },
  },

  // =============================================================
  // R-1993: 食べログ ★4「雰囲気は最高」(ja, high - mid review)
  // =============================================================
  'R-1993': {
    ja: {
      polite: {
        text: 'この度はご来店ならびに丁寧なご感想を賜り、誠にありがとうございました。\n\n雰囲気とハーブを活かしたお料理にご満足いただけましたこと、心より光栄に存じます。立地ゆえの価格設定について、お客様にご納得いただけましたことも何よりでございます。\n\n季節ごとのハーブメニューや限定料理もご用意してお待ち申し上げております。改めましてのお運びを心よりお待ち申し上げております。',
        tone: 'high_rating',
        key_points: ['雰囲気', 'ハーブ料理', '価格と立地'],
        alert_priority: 'low',
      },
      standard: {
        text: 'ご来店・口コミをいただきありがとうございました。\n\n雰囲気とハーブを使った料理を気に入っていただけて嬉しいです。価格設定については立地と眺めを評価いただけたこと、励みになります。\n\n季節ごとのハーブメニューも展開しているので、ぜひまたお越しください。お待ちしております。',
        tone: 'high_rating',
        key_points: ['ハーブ料理', '立地', '雰囲気'],
        alert_priority: 'low',
      },
      friendly: {
        text: '口コミありがとうございました！\n\n雰囲気とハーブ料理を気に入ってもらえて、すごく嬉しいです。値段は確かに少しお高めですが、立地と眺めで納得いただけて何よりです。\n\nハーブは季節で変わるので、また違う時期もぜひ！',
        tone: 'high_rating',
        key_points: ['ハーブ', '雰囲気'],
        alert_priority: 'low',
      },
    },
    en: {
      polite: {
        text: 'Thank you sincerely for your visit and for these thoughtful comments. We are deeply honored that you enjoyed the atmosphere and our herb-infused cuisine, and that the location and view justified the pricing for you. Seasonal herb menus and special dishes await your next visit.',
        tone: 'high_rating',
        key_points: ['atmosphere', 'herb cuisine', 'pricing'],
        alert_priority: 'low',
      },
      standard: {
        text: "Thank you for the review! We're glad you enjoyed the atmosphere and our herb-focused dishes. We appreciate that the location and view justified the pricing for you. Our herb menu changes with the seasons — please come back for another visit!",
        tone: 'high_rating',
        key_points: ['herb', 'atmosphere'],
        alert_priority: 'low',
      },
      friendly: {
        text: "Thanks for the review! Stoked you enjoyed the herb dishes and the vibe. The price is a bit on the high side, fair point, but glad the view made up for it! Herbs change by season, so swing by again sometime!",
        tone: 'high_rating',
        key_points: ['herb', 'view'],
        alert_priority: 'low',
      },
    },
  },
}

// 言語自動検出（auto 設定時に使用）
function detectLang(text: string): ReplyLang {
  // 日本語・中国語（漢字）が一定数以上あれば ja とみなす
  const jaChars = (text.match(/[぀-ヿ㐀-鿿]/g) || []).length
  return jaChars > 5 ? 'ja' : 'en'
}

/**
 * 事前用意されたモック応答を取得
 *
 * @param reviewId  - レビュー ID
 * @param reviewBody - 言語自動検出のための本文
 * @param tone      - 'polite' | 'standard' | 'friendly'
 * @param language  - 'auto' | 'ja' | 'en'
 */
export function getMockReply(
  reviewId: string,
  reviewBody: string,
  tone: ToneStyle,
  language: 'auto' | ReplyLang,
): { reply_text: string; tone: string; key_points: string[]; alert_priority: string } | null {
  const review = MOCK_REPLIES[reviewId]
  if (!review) return null
  const lang: ReplyLang = language === 'auto' ? detectLang(reviewBody) : language
  const reply = review[lang]?.[tone]
  if (!reply) return null
  return {
    reply_text: reply.text,
    tone: reply.tone,
    key_points: reply.key_points,
    alert_priority: reply.alert_priority,
  }
}
