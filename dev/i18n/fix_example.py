# v141: translations — the names of the new story sections (Cascais, Lisbon, Porto and the north, Russia, Portugal)
import json, os, re
H = os.path.dirname(os.path.abspath(__file__))
fixed = json.load(open(H + '/fixed.json', encoding='utf-8')); fde = json.load(open(H + '/de/fixed_de.json', encoding='utf-8'))
miss = json.load(open(H + '/out-en.html.missing.json', encoding='utf-8'))
W = {
  'Кашкайш': ('Cascais', 'Cascais', 'Cascais'), 'Лиссабон': ('Lisbon', 'Lisboa', 'Lissabon'),
  'Порту и север': ('Porto and the north', 'Porto e o Norte', 'Porto und der Norden'), 'Россия': ('Russia', 'Rússia', 'Russland'),
  'Португалия': ('Portugal', 'Portugal', 'Portugal'),
  'город у океана рядом с Лиссабоном': ('a town by the ocean near Lisbon', 'vila junto ao oceano perto de Lisboa', 'eine Stadt am Ozean bei Lissabon'),
  'трамваи, холмы и мосты': ('trams, hills and bridges', 'elétricos, colinas e pontes', 'Straßenbahnen, Hügel und Brücken'),
  'Порту, Дору, Брага, Гимарайнш': ('Porto, the Douro, Braga, Guimarães', 'Porto, Douro, Braga, Guimarães', 'Porto, der Douro, Braga, Guimarães'),
  'Байкал, Камчатка, Казань и вся страна': ('Baikal, Kamchatka, Kazan and the whole country', 'Baikal, Kamchatka, Kazan e o país inteiro', 'Baikal, Kamtschatka, Kasan und das ganze Land'),
}
CYR = re.compile('[А-Яа-яЁё]'); n = 0
for g, keys in miss.items():
    if g in ('GAMES', 'LEARN_IMG', 'SND_HI'): continue
    for k in (keys if isinstance(keys, list) else list(keys)):
        tr = W[k]
        assert not any(CYR.search(x) for x in tr)
        fixed.setdefault(g, {})[k] = list(tr[:2]); fde.setdefault(g, {})[k] = tr[2]; n += 1
json.dump(fixed, open(H + '/fixed.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
json.dump(fde, open(H + '/de/fixed_de.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('ok', n)
