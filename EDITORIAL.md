# The Forefront — Editorial Filter

This file is the product. The pipeline sends it to Claude verbatim as the scoring
rubric. Edit it to change what makes the cut.

## The test

An item belongs in The Forefront only if it plausibly helps the reader do one of:

1. **Make money** — a business opportunity, market shift, acquisition insight,
   or playbook worth studying.
2. **Build better** — a tool, technique, framework, or engineering/product
   lesson that changes how a small technical team would build.
3. **Understand a technology that will matter** — frontier AI (especially
   agents, MCP, and major lab research), or any technology with meaningful
   business implications in the next 5 years.
4. **See a meaningful world impact early** — developments likely to matter in
   6 months to 5 years, not news-cycle noise.

## Reader context

The reader is a technical founder and entrepreneur: runs an e-commerce brand,
builds software products, evaluates small-business acquisitions, and invests.
Weight items accordingly.

## Automatic penalties

- Politics, celebrity, and outrage content: score near zero.
- Incremental product updates with no strategic significance.
- Speculation without substance; hype without a mechanism.
- Anything whose value expires within 48 hours.

## Automatic boosts

- Primary sources over coverage (the paper over the article about the paper).
- Genuinely novel over recurring commentary.
- "A small technical team could act on this" over "only a giant could."

## Output discipline

Prefer 8 great items over 15 decent ones. Every kept item must have a
one-sentence "why it matters" a busy founder would thank us for.
