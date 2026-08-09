// Stage 4: render docs/index.html (+ dated archive copy) from the day's kept stories.
import fs from 'node:fs';
import { esc, log } from './util.js';

const SECTION_ORDER = ['Top Signal', 'AI & Research', 'Business & Markets', 'Tools & Repos', 'Listen & Watch'];

const meter = score => {
  const on = Math.max(1, Math.round(score / 20));
  return Array.from({ length: 5 }, (_, i) => `<i${i < on ? ' class="on"' : ''}></i>`).join('');
};

const mediaCard = s => {
  if (s.media === 'podcast') return `
        <div class="mediacard">
          <a class="playbtn" href="${esc(s.enclosure || s.url)}" aria-label="Play episode">▶</a>
          <div class="mediainfo">
            <span class="mediatitle">Listen — opens episode</span>
            <span class="mediadur mono">PODCAST</span>
          </div>
        </div>`;
  if (s.media === 'video') return `
        <div class="mediacard video">
          <a class="playbtn" href="${esc(s.url)}" aria-label="Watch video">▶</a>
          <div class="mediainfo">
            <span class="mediatitle">Watch on YouTube</span>
            <span class="mediadur mono">VIDEO</span>
          </div>
        </div>`;
  return '';
};

const story = s => `
    <article class="story">
      <div class="rail">
        <div class="score">S·${s.score}</div>
        <div class="meter" aria-hidden="true">${meter(s.score)}</div>
      </div>
      <div>
        <h2><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.headline || s.title)}</a></h2>
        <p class="summary">${esc(s.summary || s.snippet || '')}</p>
        <p class="why"><b>Why it matters:</b> ${esc(s.why || '')}</p>${mediaCard(s)}
        <div class="srcrow">
          ${s.sources.map(x => `<a class="chip" href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.name)}${x.points ? ` · ${x.points} pts` : ''}</a>`).join('\n          ')}
          <span class="meta mono">${esc((s.media || 'text').toUpperCase())} · ${s.sources.length} SOURCE${s.sources.length > 1 ? 'S' : ''}</span>
        </div>
      </div>
    </article>`;

const opportunity = s => `
  <aside class="opp">
    <div class="eyebrow">Opportunity Hidden in Today's News</div>
    <h3>${esc(s.headline || s.title)}</h3>
    <p>${esc(s.opportunity)}</p>
    <span class="tag mono">DERIVED FROM TODAY'S STORIES · CONFIDENCE: SPECULATIVE</span>
  </aside>`;

export function runBuild({ date, kept, scanned }) {
  const totalMin = Math.max(5, Math.round(kept.length * 1.2));
  const pct = scanned ? Math.round((1 - kept.length / scanned) * 100) : 0;
  const dateLabel = new Date(date + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  const [wd, rest] = [dateLabel.split(',')[0], dateLabel.split(',').slice(1).join(',').trim()];

  const opps = kept.filter(s => s.opportunity);
  const sections = SECTION_ORDER
    .map(name => ({ name, stories: kept.filter(s => s.section === name) }))
    .filter(sec => sec.stories.length);

  let body = '';
  sections.forEach((sec, i) => {
    body += `\n  <section class="section">\n    <div class="eyebrow">${esc(sec.name)}</div>\n${sec.stories.map(story).join('\n')}\n  </section>`;
    if (i === 0 && opps.length) body += opportunity(opps[0]); // callout after the top section
  });

  const css = fs.readFileSync('pipeline/style.css', 'utf8');
  const tracker = fs.readFileSync('pipeline/tracker.js', 'utf8').replace('__DATE__', date);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>The Forefront — ${esc(rest)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@500;700;900&family=Instrument+Sans:wght@400;500;600&family=Spline+Sans+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<style>${css}</style>
</head>
<body>
<header>
  <div class="wrap mast">
    <div class="logo">The Forefront<span>.</span></div>
    <nav class="mastnav"><a href="index.html">Today</a><a href="archive/">Archive</a></nav>
  </div>
</header>
<main class="wrap">
  <div class="dayhead">
    <div class="datemeta mono"><span>${esc(wd)}</span><span class="dot"></span><span>${esc(rest)}</span></div>
    <h1>${kept.length} things worth your attention today.</h1>
    <div class="filterstat">
      <span>Scanned <b>${scanned}</b></span>
      <span class="kept">Kept <b>${kept.length}</b></span>
      <span>Total read <b>~${totalMin} min</b></span>
      <span>Filtered out <b>${pct}%</b></span>
    </div>
  </div>${body}
</main>
<footer>
  <div class="wrap" style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px">
    <span>The Forefront — we read ${scanned} things so you don't have to.</span>
    <span class="mono">EDITED BY A HUMAN · DRAFTED BY AI</span>
  </div>
</footer>
<script>${tracker}</script>
</body>
</html>`;

  fs.mkdirSync('docs/archive', { recursive: true });
  fs.writeFileSync('docs/index.html', html);
  fs.writeFileSync(`docs/archive/${date}.html`, html.replaceAll('href="index.html"', 'href="../index.html"').replaceAll('href="archive/"', 'href="./"'));

  // simple archive index
  const days = fs.readdirSync('docs/archive').filter(f => f.endsWith('.html')).sort().reverse();
  fs.writeFileSync('docs/archive/index.html',
    `<!DOCTYPE html><html><head><meta charset="utf-8"><title>The Forefront — Archive</title><style>body{font-family:system-ui;max-width:600px;margin:60px auto;padding:0 20px}a{display:block;padding:8px 0;color:#0E6B4F}</style></head><body><h1>Archive</h1>${days.map(d => `<a href="${d}">${d.replace('.html', '')}</a>`).join('')}</body></html>`);

  log(`build: wrote docs/index.html and docs/archive/${date}.html`);
}
