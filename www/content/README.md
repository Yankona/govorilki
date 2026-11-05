# Texts of the website

One file per language: `ru.json`, `en.json`, `pt.json`. Shape:

```
{ "lang": "ru", "brand": "Говорилки",
  "ui": { "play", "play_sub", "login", "nav_more", "articles", "disclaimer", "footer", "lang_name", "toc", "faq" },
  "pages": { "home" | "r" | "l" | "s" | "gym" | "read" | "grand" | "faq": {
      "slug", "nav", "title" (≤ 60), "description" (140–160), "h1", "lead",
      "sections": [ { "h2", "html" } ], "faq": [ { "q", "a" } ] } } }
```

`html` may use only `<p> <ul> <ol> <li> <strong> <em> <h3>` and two placeholders: `{{page:KEY|text}}` (a link to
another page of the site) and `{{play|text}}` (a link to the game in this language). Everything else is escaped by
`www/build.py`. Only true facts about the game (free, no ads, ages 4–12, what each language version has); no invented
numbers, reviews or quotes; it is home practice, not a diagnosis.
