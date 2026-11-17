# Worlds (interests) — file format: comics/me/worlds-<n>.ru.json = a JSON array of worlds

A world:
{
 "id": "<id from the list you were given>", "n": "<name, e.g. «Футбол»>", "e": "<emoji>",
 "bg": { "home": "<scene>", "away": "<scene>", "out": "<scene>" },
 "cast": { "npc": "<castId>", "rival": "<castId>" },       // from the list you were given
 "s": { "place_in": "…", "place_to": "…", "thing": "…", "thing_acc": "…", "thing_gen": "…", "event": "…", "event_to": "…",
        "event_in": "…", "npc": "…", "rival": "…", "crowd": "…", "tool": "…", "tool_acc": "…" },   // slot words, see BRIEF_ME.md; thing ≤ 14 letters
 "st": { "<Name>": "<Name with + before the stressed vowel>" },   // stress of every invented name
 "open": [ 3 variants, each [L0,L1,L2] ],   // the opening panel of a story in this world (where we are, what is special
        // today); may use {name}, {fr}, {a|b} and the world's own slots
 "fact": [ 4 variants, each [L0,L1,L2] ],   // a TRUE fun fact about this world, told by someone in the story
 "fun":  [ 4 variants, each [L0,L1,L2] ],   // a joke / a funny moment in this world
 "final": [ 2 variants, each [L0,L1,L2] ],  // the happy celebration at the end of a story in this world
 "pw": { "r": [3], "l": [3], "sz": [3], "sh": [3] }   // magic words, 3–6 words, packed with the sound (r = Р, l = hard Л,
        // sz = С and З, sh = Ш Ж Ч Щ), themed to the world, original and fun
}
Who speaks each open/fact/fun/final line is decided by the game (npc, the friend or the narrator), so write them as
lines that fit any of them; facts as «А знаешь…?» lines are good.
Validate: python3 -c "import json;json.load(open('FILE'))" and python3 /home/user/govorilki/dev/build/check_me.py FILE
