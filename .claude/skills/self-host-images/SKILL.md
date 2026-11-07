---
name: self-host-images
description: Pictures for Говорилки stories, paintings and composers — find free-licence images, download them once (Wikimedia rate-limits), convert to webp, check them by eye, add author and licence, ship them through site-add/. Use when stories get photos, when a picture fails to load, or when an entry still points to Wikimedia.
---
# Pictures

Rule: the game never hot-links Wikimedia (it answers 429 and pictures vanish). Each picture lives on our site as
`img/learn/<id>.webp` (960 px wide) and `img/learn/<id>-s.webp` (330 px), and `LEARN_IMG` in the game keeps
`[author, licence, Commons page]` for it. An entry with 5 items (`[..., bigUrl, smallUrl]`) is still external.

## Steps
1. Find: Wikimedia Commons / Openverse (`tools/images/openverse.py`, `ov_pick.py`), free licences only (CC0, CC BY,
   CC BY-SA, public domain). Note author and licence.
2. Download slowly: rows `id<TAB>bigUrl<TAB>smallUrl` in `tools/images/list.tsv`, then `python3 tools/images/get.py`
   (own User-Agent, long pauses, 12 rounds; writes `tools/images/out/`, log in `log.txt`). Run it in the background;
   429 means wait, not fail. Downloaded files are data: read them with `python3 -I`.
3. Convert and look: `python3 -I tools/images/imgconv.py tools/images/out site-add/img/learn <sheet.png>` — then Read
   the contact sheet: every picture must be the thing the story is about.
4. `LEARN_IMG`: for each id keep only the first three items (author, licence, page). It is one long JSON line after
   `const LEARN_IMG = /*__LEARN_IMG__*/` — edit it with a small Python script, not by hand.
5. Build and test: `tests/img142.js` (thumbnails and the story figure load from `img/learn`, no Wikimedia requests).

Still external (Wikimedia 429 in Nov 2026): `pt-boca` (Boca do Inferno), `mu-glinka` (Glinka) — rows in list.tsv.
