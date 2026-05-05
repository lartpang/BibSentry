# BibTeX Verifier

BibTeX Verifier is a browser-based tool for checking and correcting `.bib` files. It parses entries locally, searches selected academic sources, shows what changed, and exports a reviewed BibTeX file.

[Live app](https://lartpang.github.io/Bibtex-Verifier/) | [MIT License](LICENSE) | [Notice](NOTICE)

## Acknowledgement And Inspiration

This project builds on the original [merfanian/Bibtex-Verifier](https://github.com/merfanian/Bibtex-Verifier). The original project provided the browser-based verification foundation: static GitHub Pages deployment, BibTeX parsing, CrossRef/Semantic Scholar checks, result cards, and export flow.

This fork keeps that foundation and focuses on a broader verification workflow: stricter parsing, tiered multi-source lookup, candidate ranking, bilingual UI, parsed-first verification, activity logging, pause/resume control, collapsed review cards, stable review ordering, four-view field editing, right-side navigation, privacy controls, and reviewed export.

The original MIT license and copyright notice are preserved in [LICENSE](LICENSE). Additional attribution is recorded in [NOTICE](NOTICE).

## Main Workflow

### 1. Upload Or Paste

Upload a `.bib` file or paste BibTeX content from Overleaf or another reference manager.

What happens:

- BibTeX is parsed in the browser.
- `@string` and month macros are expanded.
- Parsed entries appear before online verification starts.
- Entries with parse problems are marked as `Error`.

### 2. Configure Sources

Use the gear button in the floating toolbar to choose search sources and optionally add a Semantic Scholar API key.

Search order:

| Tier | Sources | Purpose |
|---|---|---|
| Tier 1 | DBLP, CrossRef, Semantic Scholar | Published records and broad metadata coverage. |
| Tier 2 | CVF, OpenReview | Conference proceedings when Tier 1 is weak. |
| Tier 3 | arXiv | Preprint fallback when no stronger match exists. |

Published conference and journal records are preferred over preprints when the title evidence is comparable.

### 3. Start Verification

Click `Start verification` in the floating toolbar.

During verification:

- `Parsed` decreases as entries are processed.
- `Pause` waits for the current request to finish before stopping.
- `Continue` resumes the queue.
- `Log` shows requests, retries, skipped sources, candidates, and result decisions.

### 4. Review Statuses

Use the status badges to filter the result list.

| Status | Meaning |
|---|---|
| Parsed | Parsed successfully, waiting for verification. |
| Verified | The selected candidate matches closely. |
| Needs Update | The entry should be checked before export. This includes metadata enrichments, normalized values, and uncertain candidates that need manual judgment. |
| Not Found | No enabled source produced a credible match. |
| Duplicates | Another entry has the same normalized title. |
| Error | Parsing produced a blocking diagnostic. |

`Needs Update` entries are appended to the bottom of the result list in verification order, so you can inspect them from top to bottom in the same order they were found. After verification, editing, candidate changes, filtering, and language switching preserve that order.

### 5. Choose Candidates

For `Needs Update` entries, expand the card to see up to 8 candidates.

Supported actions:

- Click the title header to expand or collapse a card.
- Open the extra candidates list when the first three are not enough.
- Click a candidate to recalculate comparison against that record.
- Use quick links to check Google Scholar, Semantic Scholar, or DBLP manually.

### 6. Edit Fields

`Needs Update` cards use a four-view editor.

| View | Action |
|---|---|
| Original | Click a field value to restore your original value. |
| Found | Click a field value to adopt the selected candidate value. |
| Edit | Type directly to customize the exported value. |
| Diff | Inspect the before/after BibTeX diff. |

The header refresh icon adopts all found values for that entry. The clear button empties a field; empty fields are omitted from export.

Cards are collapsed by default to keep long files scannable. `Needs Update` cards use a dark red left border until opened once; after you expand a card, the left border turns green and stays green even if you collapse it again.

### 7. Navigate Long Files

The right-side table of contents follows the active filter. Click an item to jump to that entry. The current viewport entry is highlighted automatically.

### 8. Export

Click `Download Corrected .bib` at any time.

Export behavior:

- Current edits are applied.
- Internal fields are removed.
- Original field order is preserved when possible.
- `Error`, `Not Found`, and `Duplicates` are shown as warnings but do not block export.

## Privacy

Your full `.bib` file is not uploaded to a project server. Parsing and editing happen locally in the browser.

Online verification sends lookup queries only to the sources you enable. These requests can include paper titles and, when implemented, identifiers such as DOI or arXiv ID.

Semantic Scholar API keys stay in page memory by default. If `Remember on this browser` is checked, the key is stored in `localStorage`. In both modes, the key is sent only to Semantic Scholar.

## Current Limits

- Lookup is primarily title-based fuzzy matching.
- Exact DOI lookup and exact arXiv ID lookup are planned.
- Public APIs can rate-limit requests, so large files can take several minutes.
- Metadata from public sources can be incomplete or inconsistent.

## Local Development

```bash
git clone https://github.com/lartpang/Bibtex-Verifier.git
cd Bibtex-Verifier
npx serve docs
```

Run checks:

```bash
node tests/test_lib.js
node --check docs/lib.js
node --check docs/app-core.js
node --check docs/app.js
```

## Project Layout

| Path | Purpose |
|---|---|
| `docs/index.html` | Static page markup and floating controls. |
| `docs/style.css` | App layout, cards, editor, floating toolbar, and navigation styles. |
| `docs/app-core.js` | Source lookup, tiered search, rate limiting, and API-key callback. |
| `docs/app.js` | Parsing workflow, verification queue, cards, editing, filters, and export. |
| `docs/lib.js` | Parsing, normalization, comparison, ranking, and serialization. |
| `tests/test_lib.js` | Node tests for pure logic. |

## License

[MIT](LICENSE)
