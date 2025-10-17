export const videoConfig = [
  {
    id: 'a',
    title: 'オープニング',
    videoUrl: `${import.meta.env.VITE_BASE_URL}/aloop/ayumi_0.mp4`,
    nextVideoIds: ['b', 'c'],
    detailButton: null,
    ctaButton: null,
  },
  {
    id: 'b',
    title: 'アループクリニックの特徴',
    videoUrl: `${import.meta.env.VITE_BASE_URL}/aloop/ayumi_1.mp4`,
    nextVideoIds: ['b', 'c'],
    detailButton: {
      text: '詳細はこちら',
      link: 'https://aloop.clinic/about/',
    },
    ctaButton: {
      text: '予約する',
      link: 'https://aloop.b4a.clinic/clinics/170/bookings/new/select/',
    },
  },
  {
    id: 'c',
    title: '院長・医師の紹介',
    videoUrl: `${import.meta.env.VITE_BASE_URL}/aloop/ayumi_2.mp4`,
    nextVideoIds: ['b', 'c'],
    detailButton: {
      text: '詳細はこちら',
      link: 'https://aloop.clinic/about/',
    },
    ctaButton: null,
  },
  {
    id: 'd',
    title: '予約から診察の流れ',
    videoUrl: `${import.meta.env.VITE_BASE_URL}/aloop/ayumi_3.mp4`,
    nextVideoIds: ['b', 'c'],
    detailButton: null,
    ctaButton: {
      text: '予約する',
      link: 'https://aloop.b4a.clinic/clinics/170/bookings/new/select/',
    },
  },
  {
    id: 'e',
    title: '料金プランについて',
    videoUrl: `${import.meta.env.VITE_BASE_URL}/aloop/ayumi_4.mp4`,
    nextVideoIds: ['b', 'c'],
    detailButton: {
      text: '詳細はこちら',
      link: 'https://aloop.clinic/about/',
    },
    ctaButton: {
      text: '予約する',
      link: 'https://aloop.b4a.clinic/clinics/170/bookings/new/select/',
    },
  },
  {
    id: 'f',
    title: '施術ラインナップ',
    videoUrl: `${import.meta.env.VITE_BASE_URL}/aloop/ayumi_5.mp4`,
    nextVideoIds: ['b', 'c'],
    detailButton: {
      text: '詳細はこちら',
      link: 'https://aloop.clinic/about/',
    },
    ctaButton: {
      text: '予約する',
      link: 'https://aloop.b4a.clinic/clinics/170/bookings/new/select/',
    },
  },
  {
    id: 'g',
    title: 'おすすめの施術',
    videoUrl: `${import.meta.env.VITE_BASE_URL}/aloop/ayumi_6.mp4`,
    nextVideoIds: ['b', 'c'],
    detailButton: {
      text: '詳細はこちら',
      link: 'https://aloop.clinic/about/',
    },
    ctaButton: {
      text: '予約する',
      link: 'https://aloop.b4a.clinic/clinics/170/bookings/new/select/',
    },
  },
]