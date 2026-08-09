// Stage 3: the AI editor. One call to shortlist + annotate, using EDITORIAL.md as the rubric.
import Anthropic from '@anthropic-ai/sdk';
import fs from 'node:fs';
import { log } from './util.js';

const MODEL = 'claude-sonnet-4-6';
const MAX_KEPT = 14;

export async function runScore(stories) {
  const client = new Anthropic(); // reads ANTHROPIC_API_KEY from env
  const rubric = fs.readFileSync('EDITORIAL.md', 'utf8');

  const list = stories.map((s, i) =>
    `[${i}] (${s.media}) ${s.title}\n    sources: ${s.sources.map(x => x.name).join(', ')}\n    ${s.snippet || ''}`
  ).join('\n\n');

  const prompt = `You are the editor of "The Forefront", a daily brief. Your rubric:

<rubric>
${rubric}
</rubric>

Below are today's candidate stories. Select at most ${MAX_KEPT} (fewer is fine — quality over quantity), score each 0–100 against the rubric, and annotate.

<candidates>
${list}
</candidates>

Respond with ONLY a JSON array, no markdown fences, no preamble. Each element:
{
  "index": <candidate index>,
  "score": <0-100>,
  "section": "Top Signal" | "AI & Research" | "Business & Markets" | "Tools & Repos" | "Listen & Watch",
  "headline": "<rewritten, specific, non-clickbait headline>",
  "summary": "<2 sentences, concrete, in your own words>",
  "why": "<1 sentence: why a technical founder should care>",
  "opportunity": <null, or 1-2 sentences if this genuinely implies a business opportunity a small technical team could pursue>
}

Order by score descending. Media items (podcast/video) go in "Listen & Watch" unless they are top-3 material.`;

  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }]
  });

  const text = res.content.filter(b => b.type === 'text').map(b => b.text).join('\n');
  let picks;
  try {
    picks = JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch (e) {
    throw new Error(`score: could not parse model output as JSON: ${text.slice(0, 300)}`);
  }

  const kept = picks
    .filter(p => Number.isInteger(p.index) && stories[p.index] && p.score >= 55)
    .slice(0, MAX_KEPT)
    .map(p => ({ ...stories[p.index], ...p }));

  log(`score: ${stories.length} stories → kept ${kept.length}`);
  return { kept, scanned: stories.length, usage: res.usage };
}
