# «Тяни звук» in en/pt/de: the screen, the voice and the game tile (the sounds themselves are LX('HOLD') content)
import json, os, re
H = os.path.dirname(os.path.abspath(__file__))
fixed = json.load(open(H + '/fixed.json', encoding='utf-8')); fde = json.load(open(H + '/de/fixed_de.json', encoding='utf-8'))
miss = json.load(open(H + '/out-en.html.missing.json', encoding='utf-8'))
SCR = '''<div class="lg">
      <div class="lg-chips" id="lgS">{0}</div>
      <p class="lg-q">{1}: %s</p>
      <div class="lg-scene {3}" id="lgSc"><span class="lg-goal">{4}</span><span class="lg-actor" id="lgA">{5}</span></div>
      <div class="lg-bar"><i id="lgBar"></i></div>
      <p class="lg-note" id="lgN">{6}</p>{7}
      <button class="big lg-hold" id="lgH">🖐 %s</button>
      <p class="muted">%s</p></div>'''
W = {
  'Тяни звук': ('Stretch the sound', 'Estica o som', 'Zieh den Laut lang'),
  'насос, комарик, змейка, мотор': ('snake, bee, train, motorbike', 'balão, abelha, comboio, mota', 'Schlange, Biene, Zug, Motorrad'),
  SCR % ('тяни звук <b class="L c">{2}</b> долго-долго', 'Держу звук', 'Микрофон слышит голос, но не отличает «с» от «ш». Взрослый слушает, чтобы звук был правильным. Микрофона нет — держи кнопку, пока тянешь звук.'): (
    SCR % ('make the sound <b class="L c">{2}</b> long, long, long', 'I’m making the sound', 'The microphone hears your voice, but it can’t tell «s» from «sh». A grown-up listens to check the sound is right. No microphone? Hold the button while you make the sound.'),
    SCR % ('estica o som <b class="L c">{2}</b> muito, muito tempo', 'Estou a fazer o som', 'O microfone ouve a voz, mas não distingue o «s» do «ch». Um adulto ouve se o som está certo. Sem microfone? Carrega no botão enquanto fazes o som.'),
    SCR % ('zieh den Laut <b class="L c">{2}</b> ganz, ganz lang', 'Ich mache den Laut', 'Das Mikrofon hört deine Stimme, aber es kann «s» und «sch» nicht unterscheiden. Ein Erwachsener hört zu, ob der Laut richtig ist. Kein Mikrofon? Halte den Knopf, solange du den Laut machst.')),
  'Тянешь {0} с…': ('Going for {0} s…', 'Já vais em {0} s…', 'Schon {0} s…'),
  'Без остановки: {0} с. Вдохни и тяни ещё.': ('Without stopping: {0} s. Breathe in and go again.', 'Sem parar: {0} s. Respira fundo e estica outra vez.', 'Ohne Pause: {0} s. Atme ein und zieh noch mal.'),
  'Шарик надут! Молодец!': ('The balloon is full! Well done!', 'O balão está cheio! Muito bem!', 'Der Ballon ist voll! Super gemacht!'),
  'Доехали! Молодец!': ('You made it! Well done!', 'Chegaste! Muito bem!', 'Geschafft! Super gemacht!'),
  'Без остановки {0} с': ('Without stopping {0} s', 'Sem parar {0} s', 'Ohne Pause {0} s'),
  '{0}. {1}Вдохни носом и тяни звук долго, без остановки, пока не получится.': (
    '{0}. {1}Breathe in through your nose and make the sound for a long time, without stopping, until you get there.',
    '{0}. {1}Respira pelo nariz e estica o som muito tempo, sem parar, até chegares lá.',
    '{0}. {1}Atme durch die Nase ein und mach den Laut ganz lang, ohne Pause, bis du es schaffst.'),
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
