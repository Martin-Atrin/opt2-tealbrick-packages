# Brand assets: provenance

Every file here is a byte-for-byte copy from production (Eyal's redesign), repo `Tealbrick/Website-martin`, commit `c544ef9` (main, the merge of `feat/re-design`). Each was copied with `git show c544ef9:<path>`.

| File | Source path | Use |
|---|---|---|
| `logo-mark@3x.png` (108×88) | `public/landing/logo-mark@3x.png` | The drawn two-brick mark, shown at 36×29 (`app/_site/parts.tsx:15`, `.lp-mark`). |
| `logo-32.png`, `logo-48.png` | `public/landing/` | Favicons (`app/layout.tsx`, since commit 230c30b). |
| `logo-apple-180.png` | `public/landing/` | Apple touch icon. |
| `favicon.svg` | `public/favicon.svg` | **Do not use.** It is an older generic blue icon, not the brand mark. It is kept here only as a record. |

No vector source of the drawn mark exists in the repo or its history. A vector, if wanted, must come from Eyal (see Q1).

The app stills are in `../apps/`; their provenance is in `../apps.ts`.
