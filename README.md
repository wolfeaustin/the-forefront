# The Forefront

An opinionated daily brief: scan hundreds of items from hand-picked sources,
keep the ~12 that pass the editorial filter, publish one calm page every
morning. We read 400 things so you don't have to.

**How it works:** GitHub Actions runs the pipeline daily at 6am ET →
fetch (RSS + Hacker News + GitHub) → cluster duplicates → Claude scores
everything against [`EDITORIAL.md`](EDITORIAL.md) → render `docs/index.html` →
GitHub Pages serves it. No servers, no database, no cost beyond the API call.

## Deploy (one time, ~5 minutes)

```bash
# from this directory
gh repo create the-forefront --private --source=. --push
gh secret set ANTHROPIC_API_KEY        # paste your key when prompted
```

Then in the repo on github.com: **Settings → Pages → Source: Deploy from a
branch → Branch: `main`, folder: `/docs`**. Your brief will be at
`https://<you>.github.io/the-forefront/`.

Trigger the first edition immediately: **Actions → Daily edition → Run
workflow** (or wait until 6am).

## Local development

```bash
npm install
npm run mock       # full pipeline, no API key needed (heuristic scoring)
npm run today      # full pipeline with real AI scoring (needs ANTHROPIC_API_KEY)
open docs/index.html
```

## Iterating

- **Change what makes the cut** → edit `EDITORIAL.md` (it's the rubric sent to
  the model verbatim).
- **Add/remove sources** → edit `sources.json`. Any RSS/Atom feed works,
  including YouTube channels (`youtube.com/feeds/videos.xml?channel_id=...`)
  and podcasts.
- **Change the look** → `pipeline/style.css` and `pipeline/build.js`.
- **Change scheduling** → cron line in `.github/workflows/daily.yml`.

Feed URLs in `sources.json` are starting guesses — run `npm run mock` once and
fix any that error in the logs.

## Roadmap candidates

- Editor review step (draft as PR at 5:30, you approve → publish)
- Podcast transcription + timestamped "worth your time" highlights
- Email edition (Resend + a subscribe endpoint)
- Server-side activity sync (reads/saves currently live in localStorage)
- Embedding-based clustering when lexical matching starts missing
