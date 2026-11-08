# water-one: translations of the one water tile «Океан и вода» and its menu
import json, os, re
H = os.path.dirname(os.path.abspath(__file__))
fixed = json.load(open(H + '/fixed.json', encoding='utf-8')); fde = json.load(open(H + '/de/fixed_de.json', encoding='utf-8'))
miss = json.load(open(H + '/out-en.html.missing.json', encoding='utf-8'))
OC_HUD = '<div class="oc">\n      <div class="oc-hud"><div class="oc-meter"><span>🤿</span><b id="ocD">0 {0}</b><small id="ocZ">{1}</small></div><button class="oc-dn" id="ocDn" aria-label="%s">⬇</button></div>\n      {2}\n      <div class="oc-card" id="ocCard"><p>%s</p></div>\n    </div>'
WC = '<div class="wc">\n      <div class="lab-tabs"><button class="chip {0}" data-m="learn">🔍 %s</button><button class="chip {1}" data-m="order">🔢 %s</button></div>\n      <div class="wc-main"><div class="wc-fig {2}">{3}</div>\n        <div class="wc-side"><div class="bd-card" id="wcCard"></div>{4}</div></div>\n    </div>'
W = {
 'Океан и вода! Можно нырнуть в океан до самого дна или узнать, как вода путешествует по кругу.': ('Ocean and water! You can dive to the very bottom of the ocean or find out how water travels in a circle.', 'Oceano e água! Podes mergulhar até ao fundo do oceano ou descobrir como a água viaja em círculo.', 'Ozean und Wasser! Du kannst bis ganz nach unten in den Ozean tauchen oder herausfinden, wie Wasser im Kreis reist.'),
 'ныряем до самого дна: кто где живёт': ('dive to the very bottom: who lives where', 'mergulha até ao fundo: quem vive onde', 'tauch bis ganz nach unten: Wer lebt wo?'),
 'круговорот воды: море, облака, дождь, река': ('the water cycle: sea, clouds, rain, river', 'o ciclo da água: mar, nuvens, chuva, rio', 'der Wasserkreislauf: Meer, Wolken, Regen, Fluss'),
 'Истории про моря и реки': ('Stories about seas and rivers', 'Histórias sobre mares e rios', 'Geschichten über Meere und Flüsse'),
 'волны, приливы, Волга, Байкал, Амазонка': ('waves, tides, the Volga, Baikal, the Amazon', 'ondas, marés, o Volga, o Baikal, o Amazonas', 'Wellen, Gezeiten, die Wolga, der Baikal, der Amazonas'),
 'Океан и вода': ('Ocean and water', 'Oceano e água', 'Ozean und Wasser'),
 'Океан и вода! Можно нырнуть в океан до самого дна, узнать, как вода путешествует по кругу, или послушать истории про моря и реки.': ('Ocean and water! You can dive to the very bottom of the ocean, find out how water travels in a circle, or listen to stories about seas and rivers.', 'Oceano e água! Podes mergulhar até ao fundo do oceano, descobrir como a água viaja em círculo ou ouvir histórias sobre mares e rios.', 'Ozean und Wasser! Du kannst bis ganz nach unten in den Ozean tauchen, herausfinden, wie Wasser im Kreis reist, oder Geschichten über Meere und Flüsse hören.'),
 'океан в глубину, круговорот воды, моря и реки': ('deep into the ocean, the water cycle, seas and rivers', 'mergulho no oceano, o ciclo da água, mares e rios', 'tief ins Meer, der Wasserkreislauf, Meere und Flüsse'),
 'океан море рыбы кит акула осьминог глубина дно впадина круговорот дождь снег облака пар река озеро волны': ('ocean sea fish whale shark octopus depth bottom trench water cycle rain snow clouds vapour river lake waves', 'oceano mar peixes baleia tubarão polvo profundidade fundo fossa ciclo da água chuva neve nuvens vapor rio lago ondas', 'Ozean Meer Fische Wal Hai Krake Tiefe Boden Graben Wasserkreislauf Regen Schnee Wolken Dampf Fluss See Wellen'),
}
CYR = re.compile('[А-Яа-яЁё]'); n = 0
for g, keys in miss.items():
    if g in ('GAMES', 'LEARN_IMG', 'SND_HI'): continue
    for k in keys:
        tr = W[k]
        assert not any(CYR.search(x) for x in tr), k
        fixed.setdefault(g, {})[k] = list(tr[:2]); fde.setdefault(g, {})[k] = tr[2]; n += 1
json.dump(fixed, open(H + '/fixed.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
json.dump(fde, open(H + '/de/fixed_de.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('ok', n)
