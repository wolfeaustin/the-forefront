// Orchestrator: fetch → cluster → score → build.
// `node pipeline/run.js`          full run (needs ANTHROPIC_API_KEY)
// `node pipeline/run.js --mock`   skip the API; heuristic scores (for testing/dev)
import { runFetch } from './fetch.js';
import { runCluster } from './cluster.js';
import { runScore } from './score.js';
import { runBuild } from './build.js';
import { log } from './util.js';

const mock = process.argv.includes('--mock');

function mockScore(stories) {
  const kept = stories.slice(0, 12).map((s, i) => ({
    ...s,
    score: 92 - i * 3,
    section: s.media === 'podcast' || s.media === 'video' ? 'Listen & Watch'
      : s.media === 'repo' ? 'Tools & Repos'
      : i < 2 ? 'Top Signal' : 'AI & Research',
    headline: s.title,
    summary: s.snippet || '',
    why: '(mock run — no AI annotation)',
    opportunity: null
  }));
  return { kept, scanned: stories.length };
}

const raw = await runFetch();
if (!raw.items.length) {
  log('no items fetched — check source errors above; keeping previous edition');
  process.exit(0);
}
const stories = runCluster(raw.items);
const scored = mock ? mockScore(stories) : await runScore(stories);
runBuild({ date: raw.date, ...scored });
log('done');
