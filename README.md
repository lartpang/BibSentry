# BibTeX Verifier

BibTeX Verifier is a browser-based bibliography verification tool. It parses a `.bib` file locally, checks entries against selected public academic sources, highlights field-level differences, and exports a reviewed BibTeX file.

The app is published as a static GitHub Pages site from `docs/`. There is no backend. BibTeX parsing, review, editing, and export happen in the browser; lookup requests go directly from your browser to the sources you enable.

[Live app](https://lartpang.github.io/Bibtex-Verifier/) | [MIT License](LICENSE) | [Notice](NOTICE)

## Acknowledgement And Inspiration

This project builds on the original [merfanian/Bibtex-Verifier](https://github.com/merfanian/Bibtex-Verifier). The original project provided the browser-based BibTeX verification foundation, including the static GitHub Pages app, BibTeX parsing workflow, CrossRef/Semantic Scholar checks, result cards, and export-oriented review flow.

This fork keeps that core idea and extends it substantially in both verification capability and interaction design. The current version adds a stricter parser, tiered multi-source lookup, candidate ranking, bilingual UI, parsed-first verification, activity logging, pause/resume control, four-view field editing, right-side navigation, more explicit privacy controls, and a reviewed export workflow.

The original MIT license and copyright notice are preserved in [LICENSE](LICENSE). Additional attribution and fork-maintenance notes are recorded in [NOTICE](NOTICE).

## Highlights

- Local BibTeX parsing with support for `@string` macros, month macros, concatenated values, quoted values, numeric values, and field-order preservation.
- Bilingual UI with English/Chinese switching, saved in `localStorage`.
- Tiered verification across DBLP, CrossRef, Semantic Scholar, CVF, OpenReview, and arXiv.
- Adaptive per-source rate limiting with retry and timeout handling.
- Parsed-first workflow: inspect normalized entries before starting online verification.
- Status filters ordered as `Parsed -> Verified -> Auto-Updated -> Needs Review -> Not Found -> Duplicates -> Error`.
- Candidate list with up to 8 ranked matches, published versions preferred over preprints.
- Four-view review for changed entries: Original, Found, Edit, and GitHub-style diff.
- Right-side table-of-contents sidebar for fast navigation inside the active filter.
- Always-available export with warning counts for unresolved entries.

## Data Sources

Sources can be enabled or disabled in the settings panel.

| Tier | Sources | When Used |
|---|---|---|
| Tier 1 | DBLP, CrossRef, Semantic Scholar | Queried first in parallel for published records and broad metadata coverage. |
| Tier 2 | CVF, OpenReview | Queried when Tier 1 does not produce a strong published match. |
| Tier 3 | arXiv | Queried only when earlier tiers do not produce a credible match. |

Published conference and journal versions are preferred over preprints. If multiple published candidates exist, the verifier ranks them by title similarity and year closeness to the original BibTeX entry. If only a preprint is available, arXiv-style metadata can be used as the best available record.

Current lookup is primarily title-based fuzzy matching using `MIN_TITLE_SIM`. Exact DOI lookup and exact arXiv ID lookup are planned but not yet implemented.

## Workflow

1. Upload a `.bib` file or paste BibTeX content.
2. The app parses the input locally and expands macros such as `@string`.
3. Parsed entries appear immediately in the `Parsed` status.
4. Click `Start verification` to begin online lookup.
5. Watch the progress bar and open `Log` for source-level activity.
6. Use `Pause` and `Continue` during verification. Pause takes effect after the current in-flight request finishes.
7. Review result cards, candidates, field differences, and duplicate warnings.
8. Adopt found values, keep original values, edit fields inline, or remove fields.
9. Download the reviewed `.bib` at any time.

Export is not blocked by unresolved entries. If `Error`, `Not Found`, or `Duplicates` remain, the download area shows warning counts so you can decide whether to continue.

## Statuses

| Status | Meaning |
|---|---|
| Parsed | BibTeX parsed successfully and is waiting for verification. This count decreases as entries are checked. |
| Verified | The candidate appears to be the same work and compared fields match. |
| Auto-Updated | The identity matches, but metadata can be enriched or normalized. |
| Needs Review | A candidate exists, but title, author, year, venue, or version evidence is weak or conflicting. |
| Not Found | No enabled source returned a credible candidate after all applicable tiers. |
| Duplicates | Another entry in the same file has the same normalized title. |
| Error | The BibTeX entry has a parsing diagnostic that needs attention. |

The layered verifier separates existence, identity, version, and freshness evidence before assigning the final status.

## Review UI

Every result card shows the title, citation key, entry type, status, source evidence, and quick search links for manual checking.

For `Auto-Updated` and `Needs Review` entries, the review area stays open inside the card:

| View | Purpose |
|---|---|
| Original | Read-only parsed value from your BibTeX. |
| Found | Read-only value from the selected candidate, with source badges such as `DBLP`, `CROSSREF`, or `SS`. |
| Edit | The value that will be exported. It starts from your original value and can adopt the found value or be edited manually. |
| Diff | GitHub-style before/after BibTeX diff that updates as you edit. |

For `Parsed`, `Verified`, `Not Found`, `Duplicates`, and `Error`, cards show a read-only BibTeX block instead of the four-view editor.

Changing the selected candidate updates the card in place and resets field edits for that entry. It does not reorder the entry list.

## Candidates

Each verification can keep up to 8 nearby candidates. Candidates are ranked by title similarity and year closeness, with published versions ordered before preprints.

- The first 3 candidates are shown by default.
- Lower-ranked candidates can be expanded.
- Clicking a candidate switches the comparison target.
- Similarity badges use three bands: `>=85%`, `>=70%`, and `<70%`.
- Result cards include Google Scholar, Semantic Scholar, and DBLP quick search links.

## Navigation

The right-side table-of-contents sidebar helps move through long bibliographies.

- It follows the active status filter.
- Each item shows an index, status color dot, and truncated title.
- The current viewport item is highlighted using `IntersectionObserver`.
- Clicking an item scrolls to the card and flashes its outline.
- The sidebar can collapse to a small right-side tab.

## Settings

Open the gear button in the floating control panel.

Implemented settings:

- Enable or disable individual search sources.
- Save source choices in browser state.
- Configure a Semantic Scholar API key.
- Keep the API key in page memory by default.
- Persist the API key in `localStorage` only when `Remember on this browser` is checked.
- Show a clear 401/403 authentication error, highlight the input, and reopen the settings panel when the key is rejected.

Planned settings:

- Global concurrent request limit, default 3 and adjustable from 1 to 10.
- Per-request timeout control.
- Retry count control.

## Parsing And Export

Parsing is implemented in `docs/lib.js`.

Supported parsing behavior includes:

- Standard BibTeX entries such as `@article`, `@inproceedings`, and `@misc`.
- `@string`, `@comment`, and `@preamble` handling.
- Built-in month macros such as `jan`, `feb`, and `mar`.
- Concatenated BibTeX values using `#`.
- Braced, quoted, numeric, and identifier values.
- Expansion of input macro definitions into exported self-contained BibTeX.
- Internal source metadata such as `_raw`, `_sourceStart`, `_sourceEnd`, and `_fieldsAst`.

Internal fields beginning with `_` are never exported. When `_fieldsAst` is available, `entriesToBib()` preserves original field order and appends newly added fields after the original fields.

## Privacy

Your full `.bib` file is not uploaded to a project server. Parsing and editing happen locally in your browser.

Network requests are made directly to enabled public sources. Depending on source and entry, these requests can include paper titles and, once implemented, identifiers such as DOI or arXiv ID.

Semantic Scholar API keys stay in page memory by default. If `Remember on this browser` is checked, the key is stored in `localStorage`. In both modes, the key is sent only to the Semantic Scholar API.

## Local Development

```bash
git clone https://github.com/lartpang/Bibtex-Verifier.git
cd Bibtex-Verifier
npx serve docs
```

Open the local URL shown by the server, usually `http://localhost:3000`.

You can also use another static file server, or open `docs/index.html` directly in a modern browser.

## Tests

Run the pure logic test suite:

```bash
node tests/test_lib.js
```

Check JavaScript syntax:

```bash
node --check docs/lib.js
node --check docs/app-core.js
node --check docs/app.js
```

## Project Layout

| Path | Purpose |
|---|---|
| `docs/index.html` | Static app markup and controls. |
| `docs/style.css` | UI, result cards, four-view editor, floating panel, log, and navigation sidebar. |
| `docs/app-core.js` | Browser lookup layer, source adapters, tiered search, rate limiting, and API-key error callback. |
| `docs/app.js` | Browser workflow, parsing flow, verification loop, card UI, filters, editing, and export. |
| `docs/lib.js` | Pure parsing, normalization, source adapters, comparison, ranking, and serialization. |
| `tests/test_lib.js` | Node tests for `docs/lib.js`. |
| `demo/demo.gif` | README demo asset. |

## Limitations

- Public APIs can rate-limit requests. The app uses adaptive delays and retries, so large files can take several minutes.
- Not every paper is indexed by every source.
- Workshop papers, theses, technical reports, private reports, and very recent papers may be missed.
- Metadata from public APIs can be incomplete or inconsistent.
- Pause is cooperative and does not abort an already in-flight `fetch()`.
- Exact DOI lookup, exact arXiv ID lookup, configurable concurrency, configurable timeout, and configurable retry count are still planned work.

## Contributing

Issues and pull requests are welcome. Useful areas include:

- More source adapters.
- Exact identifier lookup.
- Better BibTeX and BibLaTeX edge-case handling.
- More tests for real-world bibliographies.
- UI improvements for review workflows.

## License

[MIT](LICENSE)
