# Plots (skeletons) — file format: comics/me/plots-<n>.ru.json = a JSON array of plots

A plot: { "id": "<id>", "n": "<name ≤ 24 chars, may use slots>", "eps": [ 3 episodes ] }

An episode:
{
 "t": "<title ≤ 30 chars, slots allowed>",
 "rec": [ [L0,L1,L2 if the child chose option 1 last time], [L0,L1,L2 if option 2] ],   // episodes 2 and 3 only: the
        // first panel REMEMBERS the previous episode's choice («Вчера мы пошли по следам — и вот они ведут…»)
 "p": [ 3 panels: { "bg": "home|away|out|<scene>", "who": ["kid","me",…], "sp": "kid|me|npc|rival|nar", "x": [L0,L1,L2] } ],
 "pw": { "bg": "…", "who": [...], "x": [L0,L1,L2] },   // the moment the hero must say magic words (a door, a machine,
        // a spell…): x is the line just before («Дверь закрыта. Нужны волшебные слова!»). After the magic words the
        // game shows the child's superpower working (written elsewhere), so let the problem be one a power can solve.
 "q": [ [question, right, wrong, wrong] for L0, L1, L2 ],   // about THIS episode's panels; right answer first;
        // answers ≤ 30 chars; the answer must be readable in that level's panels
 "ch": { "x": [L0,L1,L2], "o": [ { "b": "<button ≤ 24 chars>", "bg": "…", "who": [...], "sp": "…", "x": [L0,L1,L2] }, {…} ] },
        // episodes 1 and 2: a choice of two; each option has a result panel. Both options are fun; the next episode
        // continues either way (its "rec" lines). Episode 3: "ch" is the final choice too (how to celebrate / what to
        // do with the thing), both endings happy.
 "end": [L0,L1,L2]   // episodes 1–2: a cliffhanger; episode 3: a happy end of the story
}
Episode 1 has no "rec". Keep panels in "p" exactly 3.
Validate: python3 -c "import json;json.load(open('FILE'))" and python3 /home/user/govorilki/dev/build/check_me.py FILE
