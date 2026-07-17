// 建置時自動為文章產生語音(Google Cloud Text-to-Speech)
// - 金鑰從環境變數 GOOGLE_TTS_API_KEY 讀取(在 Vercel 後台設定,不進版本庫)
// - 沒有金鑰時直接跳過,不影響建置
// - 以內容雜湊做快取(node_modules/.cache/tts),文章沒改就不重新產生、不重複扣額度
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const API_KEY = process.env.GOOGLE_TTS_API_KEY;
const POSTS_DIR = 'src/content/posts';
const OUT_DIR = 'public/audio';
const CACHE_DIR = 'node_modules/.cache/tts';
const VOICE = { languageCode: 'cmn-TW', name: 'cmn-TW-Wavenet-A' };
const MAX_CHUNK = 1500; // 每次請求的字數上限(API 限 5000 bytes)

function stripMarkdown(raw) {
  let body = raw.replace(/^---[\s\S]*?---/, '');
  const hasTable = /\n\|.*\|/.test(body);
  body = body
    .replace(/\n\|[^\n]*\|/g, '') // 表格整行移除
    .replace(/```[\s\S]*?```/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/[*_`>#]/g, '')
    .replace(/^-\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/\n{2,}/g, '\n')
    .trim();
  if (hasTable) body += '\n文章中有一張對照表,建議搭配畫面閱讀。';
  return body;
}

function chunkText(text) {
  const sentences = text.split(/(?<=[。!?!?\n])/);
  const chunks = [];
  let cur = '';
  for (const s of sentences) {
    if ((cur + s).length > MAX_CHUNK && cur) { chunks.push(cur); cur = ''; }
    cur += s;
  }
  if (cur.trim()) chunks.push(cur);
  return chunks;
}

async function synthesize(text) {
  const res = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { text },
        voice: VOICE,
        audioConfig: { audioEncoding: 'MP3', speakingRate: 1.0 },
      }),
    }
  );
  if (!res.ok) throw new Error(`TTS API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return Buffer.from(data.audioContent, 'base64');
}

async function main() {
  if (!API_KEY) {
    console.log('[tts] GOOGLE_TTS_API_KEY 未設定,跳過語音產生');
    return;
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(CACHE_DIR, { recursive: true });

  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.md'));
  for (const file of files) {
    const slug = file.replace(/\.md$/, '');
    const raw = fs.readFileSync(path.join(POSTS_DIR, file), 'utf8');
    if (/^draft:\s*true/m.test(raw)) continue;

    const text = stripMarkdown(raw);
    if (!text) continue;
    const hash = createHash('sha1').update(text + VOICE.name).digest('hex').slice(0, 12);
    const cacheFile = path.join(CACHE_DIR, `${slug}-${hash}.mp3`);
    const outFile = path.join(OUT_DIR, `${slug}.mp3`);

    if (fs.existsSync(cacheFile)) {
      fs.copyFileSync(cacheFile, outFile);
      console.log(`[tts] ${slug}: 使用快取`);
      continue;
    }
    try {
      console.log(`[tts] ${slug}: 產生語音中(${text.length} 字)…`);
      const chunks = chunkText(text);
      const buffers = [];
      for (const c of chunks) buffers.push(await synthesize(c));
      const mp3 = Buffer.concat(buffers);
      fs.writeFileSync(cacheFile, mp3);
      fs.copyFileSync(cacheFile, outFile);
      console.log(`[tts] ${slug}: 完成(${Math.round(mp3.length / 1024)} KB)`);
    } catch (e) {
      console.warn(`[tts] ${slug}: 失敗,略過 — ${e.message}`);
    }
  }
}

main().catch((e) => {
  console.warn('[tts] 語音產生失敗,不影響建置:', e.message);
});
