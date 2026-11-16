#!/usr/bin/env python3
# «Русский для меня»: dev/rume/{a,b,c}.json (texts) + stories.json → the RUME_DATA block of the game (Russian-only)
import json, os, re
H = os.path.dirname(os.path.abspath(__file__)) + '/..'
texts = []
for f in sorted(os.listdir(H + '/rume')):
    if re.fullmatch(r'[a-z]\.json', f): texts += json.load(open(f'{H}/rume/{f}', encoding='utf-8'))
stories = json.load(open(f'{H}/rume/stories.json', encoding='utf-8'))
data = json.dumps({'texts': texts, 'stories': stories}, ensure_ascii=False, separators=(',', ':'))
g = f'{H}/game/govorilki.html'
src = open(g, encoding='utf-8').read()
a, b = src.index('/*RUME-DATA*/') + len('/*RUME-DATA*/'), src.index('/*RUME-DATA-END*/')
open(g, 'w', encoding='utf-8').write(src[:a] + data + src[b:])
print('rume: texts', len(texts), 'grammar', sum(len(x['g']) for x in texts), 'stories', len(stories))
