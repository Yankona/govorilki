# Translating «Мой комикс» (en, pt, de)

Inputs: comics/me/plots-{a,b,c,d}.ru.json, worlds-{1,2}.ru.json, extra.ru.json. Write the same files with .<lang>.json,
same JSON structure, ids, cast ids, scenes (bg), who/sp — translate only the texts. Drop "st". Read BRIEF_ME.md first.

Placeholders stay exactly: {name} {fr} {place_in} {place_to} {thing} {thing_acc} {thing_gen} {event} {event_to}
{event_in} {npc} {rival} {crowd} {tool} {tool_acc}, and the child's gender pairs {boy|girl} (in English both forms are
often the same: write {ready|ready} or just the word without braces). A plot is told in ANY of 14 worlds, so a plot
sentence must read well with every world's slot words. Your language's slot words (in the worlds files):
- place_in / place_to: the place with its preposition («at the stadium» / «to the stadium»; pt «no estádio» / «ao
  estádio»; de «im Stadion» / «ins Stadion»);
- thing / thing_acc / thing_gen: three noun phrases WITH the definite article: subject / direct object / after a
  preposition (en: all «the Golden Ball»; pt: «a Bola Dourada» each — never put «de/em/a» right before a slot, rephrase
  so no contraction is needed; de: Nominativ «der Goldene Ball» / Akkusativ «den Goldenen Ball» / Dativ «dem Goldenen
  Ball» — use only dative prepositions before {thing_gen}: mit, von, bei, aus, nach, zu, seit);
- event / event_to / event_in: «the match» / «to the match» / «at the match» (pt «o jogo» / «para o jogo» / «no jogo»;
  de «das Spiel» / «zum Spiel» / «beim Spiel»);
- npc, rival: names; crowd: plural with article («the fans»; pt «os adeptos»; de «die Fans»); tool / tool_acc with
  article (de Nominativ / Akkusativ).
- Never an adjective or a past participle that must agree with a slot noun or with the friend {fr} (pt/de gender!).
  A sentence may START with a slot: the game capitalises the first letter.
- The child: {name} only as subject or when addressed; adjectives/participles about the child via {boy|girl}.
Levels: L0 1–4 very easy words (max 26 letters, slot = 12), L1 one sentence ≤ 70, L2 ≤ 150 (slot = 14). Keep the
puzzles working in your language (a reversed word, a picture rebus by first letters, a number code: remake them with
your own words so they still work). "pw" magic words: NEW lines in your language packed with the sound (r: R, l: L,
sz: S and Z, sh: en sh/ch/j, pt ch/x/j, de sch), themed to each world. Powers' names: short and fun.
Names: new characters get natural names in your language, consistent everywhere; earlier series used
(en / pt / de): Шустрик Zippy/Ligeirinho/Flitzi, Болт Bolt/Parafuso/Bolzen, Жужа Buzzy/Zuzu/Summsi, Искра Spark/Faísca/Funke,
Бип Bip, Комета Comet/Cometa/Komet, Ухти Hootie/Uhti/Uhti, Ежевика Bramble/Amora/Brombeere, Бублик Bagel/Bolacha/Brezel,
Пушок Fluffy/Fofinho/Flocke, Щёчкин Cheeks/Bochechas/Backe, Улитыч Professor Shell/Professor Caracol/Professor Schneck,
Хрумчик Crunchy/Crocas/Knusper, Громыч Rumble/Trovão/Donner, Пера Feather/Pena/Feder.
Check: python3 build/check_me.py comics/me/*.<lang>.json (no extra file) → problems: 0; then read
python3 build/render_me.py <lang> 1 and python3 build/render_me.py <lang> 2 <a few world ids> and fix anything that reads
badly with the slots filled.
