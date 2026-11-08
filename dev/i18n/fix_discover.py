# fun-discover: «А знаешь ли ты?», the next story, the new passport stamp, a line of time, the water hub as tiles
import json, os, re
H = os.path.dirname(os.path.abspath(__file__))
fixed = json.load(open(H + '/fixed.json', encoding='utf-8')); fde = json.load(open(H + '/de/fixed_de.json', encoding='utf-8'))
miss = json.load(open(H + '/out-en.html.missing.json', encoding='utf-8'))
LEAD = '<p class="lead">{0}</p>\n    <div class="lr-prog"><span class="lr-pb"><i style="width:{1}%%"></i></span><b>{2}{3} %s {4}</b></div>\n    {5}\n    {6}\n    {7}'
FIG = '<figure class="story-img"><span class="si-w"><img src="{0}" onerror="this.closest(\'figure\').outerHTML = this.dataset.fb" data-fb="{1}" alt="{2}"></span><figcaption>{3} · {4} · <a href="{5}" target="_blank" rel="noopener">%s</a></figcaption></figure>'
DISC = '<div class="disc-cards"><button class="disc" id="dWorld"><span class="emo">🌍</span><b>%s</b></button><button class="disc" id="dCal"><span class="emo">📅</span><b>%s</b></button></div>{0}'
HOOK = '<button class="lr-hook" data-hk="{0}" data-hi="{1}" style="--bg:{2}"><span class="lr-he">{3}</span><span class="lr-ht"><small>🤔 %s</small><b>{4}</b><i>{5} · %s ▶</i></span></button>'
NEXT = '<button class="st-next" data-a="next"><span class="st-nt">{0}</span><span class="st-nx"><small>%s</small><b>{1}</b>{2}</span></button>'
TL = '<div class="tl-line"><i></i>{0}<small class="tl-a">⏳ %s</small><small class="tl-b">%s</small></div>\n        <p><b>{1}</b> {2}</p><div class="prow-btns tv-row"><button class="big" id="tvNext">{3}</button></div>'
HUB = '<p class="lead">%s</p><div class="cards pl-hub">{0}</div>{1}'
STAMP = '<div class="tv-stbox" role="dialog"><p class="tv-stt">🛂 %s</p>\n      <div class="tv-stamp" style="--bg:{0}"><span class="tv-stf">{1}</span><b>{2}</b><small>{3}</small></div>\n      <p class="tv-stn">%s {4} %s {5}</p>\n      <button class="big" id="tvStOk">%s</button></div>'
MEM = '<button class="tv-globe tv-mem" id="tvMem"><span>🚩</span><span><b>%s</b><small>%s</small></span>{0}</button>'
T = {  # en, pt, de
  MEM % ('Мемори: флаги', 'найди пары — и узнай страну'): tuple(MEM % x for x in [('Memory: flags', 'find the pairs and learn the country'), ('Memória: bandeiras', 'encontra os pares e descobre o país'), ('Memory: Flaggen', 'finde die Paare und lerne das Land kennen')]),
  'флаги страны мемори путешествие': ('flags countries memory journey', 'bandeiras países memória viagem', 'Flaggen Länder Memory Reise'),
  'Дальше': ('Next', 'Seguinte', 'Weiter'),
  DISC % ('Где живёт наша семья?', 'Календарь и праздники'): tuple(DISC % x for x in [('Where our family lives', 'Calendar and holidays'), ('Onde vive a nossa família', 'Calendário e festas'), ('Wo unsere Familie wohnt', 'Kalender und Feste')]),
  HOOK % ('А знаешь ли ты?', 'послушай историю'): tuple(HOOK % x for x in [('Did you know?', 'listen to the story'), ('Sabias que…?', 'ouve a história'), ('Wusstest du schon?', 'hör dir die Geschichte an')]),
  LEAD % 'из': tuple(LEAD % x for x in ['of', 'de', 'von']),
  'А знаешь ли ты?': ('Did you know?', 'Sabias que…?', 'Wusstest du schon?'),
  FIG % 'источник': tuple(FIG % x for x in ['source', 'fonte', 'Quelle']),
  NEXT % 'Следующая история': tuple(NEXT % x for x in ['Next story', 'Próxima história', 'Nächste Geschichte']),
  '▶ Читать дальше': ('▶ Read on', '▶ Continuar a ler', '▶ Weiterlesen'),
  '▶ Слушать дальше': ('▶ Listen on', '▶ Continuar a ouvir', '▶ Weiterhören'),
  TL % ('давно', 'сейчас'): tuple(TL % x for x in [('long ago', 'now'), ('há muito', 'agora'), ('vor langer Zeit', 'heute')]),
  'до самого дна': ('to the very bottom', 'até ao fundo', 'bis ganz nach unten'),
  'море, облака, дождь': ('sea, clouds, rain', 'mar, nuvens, chuva', 'Meer, Wolken, Regen'),
  HUB % 'Выбери, во что поиграть.': tuple(HUB % x for x in ['Pick what to play.', 'Escolhe o que queres jogar.', 'Such dir ein Spiel aus.']),
  STAMP % ('Новый штамп в паспорте!', 'штампов:', 'из', 'Ура!'): tuple(STAMP % x for x in [('A new stamp in your passport!', 'stamps:', 'of', 'Hooray!'), ('Um carimbo novo no passaporte!', 'carimbos:', 'de', 'Viva!'), ('Ein neuer Stempel im Reisepass!', 'Stempel:', 'von', 'Hurra!')]),
  'Новый штамп в паспорте: {0}!': ('A new stamp in your passport: {0}!', 'Um carimbo novo no passaporte: {0}!', 'Ein neuer Stempel im Reisepass: {0}!'),
}
CYR = re.compile('[А-Яа-яЁё]'); n = 0
for g, keys in miss.items():
    if g in ('GAMES', 'LEARN_IMG', 'SND_HI'): continue
    for k in keys:
        tr = T[k]
        assert not any(CYR.search(x) for x in tr), k
        fixed.setdefault(g, {})[k] = list(tr[:2]); fde.setdefault(g, {})[k] = tr[2]; n += 1
json.dump(fixed, open(H + '/fixed.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
json.dump(fde, open(H + '/de/fixed_de.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('ok', n)
