// Stage 1: fetch raw items from all sources into data/raw-<date>.json
import Parser from 'rss-parser';
import fs from 'node:fs';
import { todayISO, hoursAgo, log } from './util.js';

const parser = new Parser({ timeout: 15000, headers: { 'User-Agent': 'TheForefront/1.0 (+personal daily brief)' } });
const WINDOW_HOURS = 30; // look back slightly more than a day so nothing falls in the cracks

async function fetchRSS(source) {
  const feed = await parser.parseURL(source.url);
  return (feed.items || [])
    .filter(i => {
      const d = new Date(i.isoDate || i.pubDate || 0);
      return d > hoursAgo(WINDOW_HOURS);
    })
    .map(i => ({
      source: source.name,
      media: source.media || 'text',
      title: (i.title || '').trim(),
      url: i.link,
      publishedAt: i.isoDate || i.pubDate || null,
      snippet: (i.contentSnippet || i.summary || '').replace(/\s+/g, ' ').slice(0, 500),
      enclosure: i.enclosure?.url || null
    }));
}

async function fetchHN() {
  const res = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
  const ids = (await res.json()).slice(0, 30);
  const items = await Promise.all(ids.map(async id => {
    const r = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
    return r.json();
  }));
  return items
    .filter(i => i && i.type === 'story' && i.score >= 80)
    .map(i => ({
      source: 'Hacker News',
      media: 'text',
      title: i.title,
      url: i.url || `https://news.ycombinator.com/item?id=${i.id}`,
      publishedAt: new Date(i.time * 1000).toISOString(),
      snippet: `${i.score} points · ${i.descendants || 0} comments`,
      hnUrl: `https://news.ycombinator.com/item?id=${i.id}`,
      hnPoints: i.score
    }));
}

async function fetchGithubTrending() {
  // No official trending API — use the search API for repos created recently with most stars.
  const since = hoursAgo(7 * 24).toISOString().slice(0, 10);
  const res = await fetch(
    `https://api.github.com/search/repositories?q=created:>${since}&sort=stars&order=desc&per_page=10`,
    { headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'TheForefront/1.0' } }
  );
  const json = await res.json();
  return (json.items || []).map(r => ({
    source: 'GitHub Trending',
    media: 'repo',
    title: `${r.full_name} — ${r.description || 'no description'}`.slice(0, 200),
    url: r.html_url,
    publishedAt: r.created_at,
    snippet: `${r.stargazers_count} stars · ${r.language || 'n/a'}`
  }));
}

export async function runFetch() {
  const { sources } = JSON.parse(fs.readFileSync('sources.json', 'utf8'));
  const all = [];
  const errors = [];

  for (const s of sources) {
    try {
      let items = [];
      if (s.type === 'rss') items = await fetchRSS(s);
      else if (s.type === 'hn') items = await fetchHN();
      else if (s.type === 'github-trending') items = await fetchGithubTrending();
      log(`fetch: ${s.name} → ${items.length} items`);
      all.push(...items);
    } catch (e) {
      errors.push({ source: s.name, error: e.message });
      log(`fetch: ${s.name} FAILED — ${e.message}`);
    }
  }

  const out = { date: todayISO(), fetchedAt: new Date().toISOString(), errors, items: all };
  fs.mkdirSync('data', { recursive: true });
  fs.writeFileSync(`data/raw-${todayISO()}.json`, JSON.stringify(out, null, 2));
  log(`fetch: total ${all.length} items, ${errors.length} source errors`);
  return out;
}
