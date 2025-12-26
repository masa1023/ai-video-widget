export const videoConfig = [
  {
    id: '1',
    title: 'オープニング',
    videoUrl: `${import.meta.env.VITE_BASE_URL}degipro/videos/degipro_1_haruka.mp4`,
    detailButton: null,
    ctaButton: null,
    subtitles: [
      { start: 0, end: 1, text: 'こんにちは。' },
      { start: 2, end: 4, text: '超実践的Webマーケティングスクール' },
      { start: 4, end: 5, text: '「デジプロ」へようこそ。' },
      {
        start: 6,
        end: 9,
        text: 'デジプロは、現役のプロから実務直結のスキルを学び、',
      },
      {
        start: 10,
        end: 13,
        text: '4ヶ月でWebマーケターを目指せるスクールです。',
      },
    ],
  },
  {
    id: '2',
    title: 'コースについて聞きたい',
    videoUrl: `${import.meta.env.VITE_BASE_URL}degipro/videos/degipro_2_haruka.mp4`,
    detailButton: {
      text: '詳細はこちら',
      link: 'https://degipro.com/course',
    },
    ctaButton: null,
    subtitles: [
      {
        start: 1,
        end: 3,
        text: '個人向けのコースと法人向けのコースがございます。',
      },
      { start: 4, end: 5, text: 'どちらのコースをご検討でしょうか？' },
    ],
  },
  {
    id: '3',
    title: '料金について聞きたい',
    videoUrl: `${import.meta.env.VITE_BASE_URL}degipro/videos/degipro_2_haruka.mp4`,
    detailButton: {
      text: '詳細はこちら',
      link: 'https://degipro.com/course',
    },
    ctaButton: null,
    subtitles: [
      {
        start: 1,
        end: 3,
        text: '個人向けのコースと法人向けのコースがございます。',
      },
      { start: 4, end: 5, text: 'どちらのコースをご検討でしょうか？' },
    ],
  },
  {
    id: '4',
    title: '転職・キャリア支援について聞きたい',
    videoUrl: `${import.meta.env.VITE_BASE_URL}degipro/videos/degipro_4_haruka.mp4`,
    detailButton: null,
    ctaButton: null,
    subtitles: [
      {
        start: 1,
        end: 3,
        text: '内定実績50社以上の充実した転職サポートが強みです。',
      },
      { start: 4, end: 5, text: 'あなたの未経験からのキャリアチェンジを、' },
      { start: 6, end: 9, text: 'プロのカウンセラーが徹底的に支援します。' },
      { start: 10, end: 12, text: '詳しく知りたい内容をお選びください' },
    ],
  },
  {
    id: '2-1',
    title: '個人コースについて聞きたい',
    videoUrl: `${import.meta.env.VITE_BASE_URL}degipro/videos/degipro_2-1_haruka.mp4`,
    detailButton: null,
    ctaButton: {
      text: '予約する',
      link: 'https://degipro.com/briefing?inflow_route=header_lp_v3_landing_top',
    },
    subtitles: [
      { start: 1, end: 1, text: '個人コースは、' },
      {
        start: 1,
        end: 4,
        text: '「転職」「副業」「基礎学習」の3つの目的に特化しています。',
      },
      {
        start: 5,
        end: 10,
        text: '実務研修を通じて、未経験から4ヶ月で即戦力のWebマーケターを目指します。',
      },
    ],
  },
  {
    id: '2-2',
    title: '法人コースについて聞きたい',
    videoUrl: `${import.meta.env.VITE_BASE_URL}degipro/videos/degipro_2-2_haruka.mp4`,
    detailButton: {
      text: '詳細はこちら',
      link: 'https://degipro.com/lp_biz_general',
    },
    ctaButton: {
      text: '予約する',
      link: 'https://degipro.com/lp_biz_general/form/contact?inflow_route=lp_v2_landing_biz_price',
    },
    subtitles: [
      { start: 0, end: 1, text: '法人コースは、' },
      {
        start: 1,
        end: 5,
        text: '企業のWebマーケティング課題を解決するためのオーダーメイド研修です。',
      },
      { start: 6, end: 6, text: 'インハウス化支援や、' },
      {
        start: 7,
        end: 10,
        text: '実務に即した社員様のスキルアップを目的とした研修を提供します。',
      },
    ],
  },
  {
    id: '3-1',
    title: '個人コースについて聞きたい',
    videoUrl: `${import.meta.env.VITE_BASE_URL}degipro/videos/degipro_3-1_haruka.mp4`,
    detailButton: null,
    ctaButton: {
      text: '予約する',
      link: 'https://degipro.com/briefing?inflow_route=header_lp_v3_landing_top',
    },
    subtitles: [
      { start: 0, end: 1, text: 'マンツーマンとグループがあり' },
      { start: 2, end: 3, text: '16.5万円からとなっております。' },
      { start: 4, end: 5, text: '分割払いも可能です。' },
      { start: 6, end: 9, text: '詳細は無料説明会でご案内します。' },
    ],
  },
  {
    id: '3-2',
    title: '法人コースについて聞きたい',
    videoUrl: `${import.meta.env.VITE_BASE_URL}degipro/videos/degipro_3-2_haruka.mp4`,
    detailButton: null,
    ctaButton: {
      text: '予約する',
      link: 'https://degipro.com/lp_biz_general/form/contact?inflow_route=lp_v2_landing_biz_price',
    },
    subtitles: [
      { start: 0, end: 1, text: '法人コースの料金は、' },
      {
        start: 2,
        end: 6,
        text: '研修期間や内容に応じて個別にお見積りします。',
      },
      { start: 5, end: 7, text: 'まずはお気軽にご相談ください。' },
    ],
  },
  {
    id: '4-1',
    title: '転職サポートの具体的な内容を聞きたい',
    videoUrl: `${import.meta.env.VITE_BASE_URL}degipro/videos/degipro_4-1_haruka.mp4`,
    detailButton: null,
    ctaButton: {
      text: '予約する',
      link: 'https://degipro.com/briefing?inflow_route=header_lp_v3_landing_top',
    },
    subtitles: [
      { start: 1, end: 3, text: '書類添削からWeb業界専門の模擬面接まで、' },
      { start: 4, end: 5, text: 'プロのカウンセラーが徹底指導。' },
      { start: 6, end: 8, text: '未経験でも安心して臨めるよう、' },
      { start: 9, end: 10, text: '個別にキャリアプランを策定します。' },
    ],
  },
  {
    id: '4-2',
    title: '内定実績が知りたい',
    videoUrl: `${import.meta.env.VITE_BASE_URL}degipro/videos/degipro_4-2_haruka.mp4`,
    detailButton: null,
    ctaButton: {
      text: '予約する',
      link: 'https://degipro.com/briefing?inflow_route=header_lp_v3_landing_top',
    },
    subtitles: [
      { start: 0, end: 1, text: '直近1年半で' },
      {
        start: 2,
        end: 5,
        text: '内定実績50社以上で大手企業への実績も豊富です。',
      },
      { start: 6, end: 8, text: '様々な求人をご紹介することもでき、' },
      {
        start: 9,
        end: 13,
        text: '未経験から転職を成功させた卒業生の声も多数公開中です。',
      },
    ],
  },
]
