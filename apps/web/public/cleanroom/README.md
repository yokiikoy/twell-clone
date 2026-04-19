# Cleanroom wordlists (open license)

These JSON files mirror `public/twelljr-*.json` shape (`surface`, `reading`, `code`, `index`). Regenerate from the repo root:

```bash
npm run cleanroom:gen-wordlists
```

(Writes `packages/cleanroom-pipeline/.cache/` — gitignored — and overwrites the `twelljr-*.json` files in this directory.)

Enable in Web: set `NEXT_PUBLIC_WORDSET=cleanroom` (see `TypingCanvas.tsx`).
