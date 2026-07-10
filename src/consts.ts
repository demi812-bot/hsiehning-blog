export const SITE_TITLE = '謝寧|兒童物理治療師';
export const SITE_DESCRIPTION =
  '桃園兒童物理治療師謝寧,把孩子的發展變成爸媽看得懂的事:發展里程碑、在家練習、特殊需求兒照護,用聽得懂的話慢慢說。';
export const AUTHOR = '謝寧';
export const IG_URL = 'https://www.instagram.com/therapist.ning/';
export const THREADS_URL = 'https://www.threads.com/@therapist.ning';
// 建好 LINE 官方帳號後填入
export const LINE_URL = '';

export const CATEGORIES = [
  { name: '發展里程碑', slug: 'milestones', blurb: '幾歲該會什麼?哪些是警訊?' },
  { name: '在家練習', slug: 'home-practice', blurb: '把練習放進生活,用家裡就有的東西' },
  { name: '特殊兒照護', slug: 'special-needs', blurb: '腦性麻痺與發展重症家庭的實用指南' },
  { name: '就醫與資源', slug: 'resources', blurb: '評估流程、早療資源、補助申請' },
  { name: '治療師觀點', slug: 'perspectives', blurb: '治療室裡的觀察與思考' },
] as const;

export function categorySlug(name: string): string {
  return CATEGORIES.find((c) => c.name === name)?.slug ?? 'perspectives';
}
