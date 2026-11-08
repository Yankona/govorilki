# articulation: «Как сказать?» — the animated teacher of sounds, «Часики»
import json, os, re
H = os.path.dirname(os.path.abspath(__file__))
fixed = json.load(open(H + '/fixed.json', encoding='utf-8')); fde = json.load(open(H + '/de/fixed_de.json', encoding='utf-8'))
miss = json.load(open(H + '/out-en.html.missing.json', encoding='utf-8'))
# words inside the templates: replaced in each template string
P = [
  ('Для взрослых: как ставится звук ', ('For grown-ups: how to teach the sound ', 'Para os adultos: como se ensina o som ', 'Für Erwachsene: so übt man den Laut ')),
  ('Сбоку: губы, зубы, язык', ('From the side: lips, teeth, tongue', 'De lado: lábios, dentes, língua', 'Von der Seite: Lippen, Zähne, Zunge')),
  ('Спереди', ('From the front', 'De frente', 'Von vorn')),
  ('↻ Ещё раз', ('↻ Again', '↻ Outra vez', '↻ Noch mal')),
  ('🐢 Медленно', ('🐢 Slowly', '🐢 Devagar', '🐢 Langsam')),
  ('Как сказать?', ('How to say it', 'Como se diz?', 'Wie sagt man das?')),
  ('Закрыть', ('Close', 'Fechar', 'Schließen')),
  ('aria-label="Звук ', ('aria-label="Sound ', 'aria-label="Som ', 'aria-label="Laut ')),
]
W = {
  'Схема: губы, зубы и язык сбоку': ('Diagram: lips, teeth and tongue from the side', 'Esquema: lábios, dentes e língua de lado', 'Bild: Lippen, Zähne und Zunge von der Seite'),
  'Часики': ('Tick-tock clock', 'Relógio', 'Die Uhr'),
  'Улыбнись, приоткрой рот. Узким кончиком языка тянись то к правому уголку рта, то к левому.': ('Smile and open your mouth a little. Reach with the narrow tip of your tongue to the right corner of your mouth, then to the left.', 'Sorri e abre um pouco a boca. Estica a ponta estreita da língua até ao canto direito da boca e depois até ao esquerdo.', 'Lächle und mach den Mund ein bisschen auf. Streck die schmale Zungenspitze zum rechten Mundwinkel, dann zum linken.'),
  'Губы и нижняя челюсть не двигаются.': ('Your lips and lower jaw stay still.', 'Os lábios e o maxilar de baixo não se mexem.', 'Lippen und Unterkiefer bleiben ganz still.'),
  'Часики идут: тик-так. Кончик языка — то влево, то вправо.': ('The clock goes tick-tock. The tip of your tongue goes left, then right.', 'O relógio faz tique-taque. A ponta da língua vai para a esquerda e depois para a direita.', 'Die Uhr macht tick-tack. Die Zungenspitze geht nach links, dann nach rechts.'),
  'Тик': ('Tick', 'Tique', 'Tick'), 'Так': ('Tock', 'Taque', 'Tack'),
}
CYR = re.compile('[А-Яа-яЁё]'); n = 0
for g, keys in miss.items():
    if g in ('GAMES', 'LEARN_IMG', 'SND_HI'): continue
    for k in keys:
        if k in W: tr = W[k]
        else:
            tr = []
            for li in range(3):
                t = k
                for ru, xs in P: t = t.replace(ru, xs[li])
                tr.append(t)
        assert not any(CYR.search(x) for x in tr), (k, tr)
        fixed.setdefault(g, {})[k] = list(tr[:2]); fde.setdefault(g, {})[k] = tr[2]; n += 1
json.dump(fixed, open(H + '/fixed.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
json.dump(fde, open(H + '/de/fixed_de.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('ok', n)
