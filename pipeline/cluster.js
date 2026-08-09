// Stage 2: group items that cover the same story.
// v1 uses cheap lexical similarity (Jaccard over title tokens + shared URLs).
// Good enough at this volume; swap in embeddings later if needed.
import { log } from './util.js';

const STOP = new Set(['the','a','an','of','to','in','on','for','and','with','is','are','how','why','what','new','its','at','by','from','vs']);

function tokens(title) {
  return new Set(
    title.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/)
      .filter(w => w.length > 2 && !STOP.has(w))
  );
}

function jaccard(a, b) {
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  return inter / (a.size + b.size - inter || 1);
}

function canonical(url = '') {
  try {
    const u = new URL(url);
    return (u.hostname.replace(/^www\./, '') + u.pathname).replace(/\/$/, '');
  } catch { return url; }
}

export function runCluster(items) {
  const clusters = [];
  for (const item of items) {
    const t = tokens(item.title);
    const c = canonical(item.url);
    let home = clusters.find(cl =>
      cl.urls.has(c) || cl.members.some(m => jaccard(t, m._tokens) >= 0.55)
    );
    if (!home) {
      home = { members: [], urls: new Set() };
      clusters.push(home);
    }
    home.members.push({ ...item, _tokens: t });
    home.urls.add(c);
  }

  const result = clusters.map(cl => {
    // Lead item: prefer primary/text sources, then earliest publish
    const lead = [...cl.members].sort((a, b) =>
      (a.media === 'text' ? 0 : 1) - (b.media === 'text' ? 0 : 1) ||
      new Date(a.publishedAt || 0) - new Date(b.publishedAt || 0)
    )[0];
    return {
      title: lead.title,
      url: lead.url,
      media: lead.media,
      publishedAt: lead.publishedAt,
      snippet: lead.snippet,
      enclosure: lead.enclosure || null,
      sources: cl.members.map(m => ({ name: m.source, url: m.hnUrl || m.url, points: m.hnPoints })),
    };
  });

  log(`cluster: ${items.length} items → ${result.length} stories`);
  return result;
}
