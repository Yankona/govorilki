# speech-honest: the mirror that looks, «Делаю!», «Попробуй ещё», «Послушай внимательно», the exercises left in «Отчёт»
import json, os, re
H = os.path.dirname(os.path.abspath(__file__))
fixed = json.load(open(H + '/fixed.json', encoding='utf-8')); fde = json.load(open(H + '/de/fixed_de.json', encoding='utf-8'))
miss = json.load(open(H + '/out-en.html.missing.json', encoding='utf-8'))
W = {
  'Для взрослых: зеркало помогает увидеть, правда ли ребёнок делает упражнение, и подсказывает «Получается!» или «Попробуй ещё». Видео смотрит только этот телефон: оно не записывается и никуда не отправляется. Без камеры упражнение засчитывается, когда ребёнок держит кнопку «Делаю!».': (
    'For grown-ups: the mirror helps to see whether the child really does the exercise, and says «You are doing it!» or «Try again». Only this phone looks at the video: it is not recorded and not sent anywhere. Without the camera an exercise counts when the child holds the «I am doing it!» button.',
    'Para os adultos: o espelho ajuda a ver se a criança faz mesmo o exercício e diz «Está a dar!» ou «Tenta outra vez». Só este telemóvel vê o vídeo: não é gravado nem enviado. Sem câmara, o exercício conta quando a criança carrega no botão «Estou a fazer!».',
    'Für Erwachsene: Der Spiegel hilft zu sehen, ob das Kind die Übung wirklich macht, und sagt «Klappt!» oder «Versuch es noch einmal». Nur dieses Handy sieht das Video: Es wird nicht aufgenommen und nicht verschickt. Ohne Kamera zählt eine Übung, wenn das Kind die Taste «Ich mache!» hält.'),
  'Ещё чуть шире!': ('A little wider!', 'Um bocadinho mais largo!', 'Noch ein bisschen breiter!'),
  'Губки чуть вперёд!': ('Lips a little more forward!', 'Os lábios um pouco mais para a frente!', 'Die Lippen ein bisschen weiter nach vorn!'),
  'Открой ротик чуть шире!': ('Open your mouth a little wider!', 'Abre a boca um bocadinho mais!', 'Mach den Mund ein bisschen weiter auf!'),
  'Надуй щёчки сильнее!': ('Puff your cheeks a bit more!', 'Enche mais as bochechas!', 'Blas die Backen noch mehr auf!'),
  'Смотри в зеркало!': ('Look in the mirror!', 'Olha para o espelho!', 'Schau in den Spiegel!'),
  '<div class="hon" id="hon" hidden><span class="hon-r" id="honR" style="--p:0"><span class="emo" id="honE">🙂</span></span>\n      <b class="hon-l" id="honL"></b><button class="big hon-hold" id="honHold" hidden>✋ Делаю!</button></div>': (
    '<div class="hon" id="hon" hidden><span class="hon-r" id="honR" style="--p:0"><span class="emo" id="honE">🙂</span></span>\n      <b class="hon-l" id="honL"></b><button class="big hon-hold" id="honHold" hidden>✋ I am doing it!</button></div>',
    '<div class="hon" id="hon" hidden><span class="hon-r" id="honR" style="--p:0"><span class="emo" id="honE">🙂</span></span>\n      <b class="hon-l" id="honL"></b><button class="big hon-hold" id="honHold" hidden>✋ Estou a fazer!</button></div>',
    '<div class="hon" id="hon" hidden><span class="hon-r" id="honR" style="--p:0"><span class="emo" id="honE">🙂</span></span>\n      <b class="hon-l" id="honL"></b><button class="big hon-hold" id="honHold" hidden>✋ Ich mache!</button></div>'),
  'Делаешь — держи!': ('You are doing it — keep holding!', 'Estás a fazer — segura!', 'Du machst es — halt fest!'),
  'Нажми и держи «Делаю!», пока делаешь': ('Press and hold «I am doing it!» while you do it', 'Carrega e segura «Estou a fazer!» enquanto fazes', 'Drück und halte «Ich mache!», solange du übst'),
  'Я тебя не вижу — сядь напротив камеры': ('I cannot see you — sit in front of the camera', 'Não te vejo — senta-te em frente à câmara', 'Ich sehe dich nicht — setz dich vor die Kamera'),
  'Ротик открыт — держи!': ('Your mouth is open — hold it!', 'A boca está aberta — segura!', 'Der Mund ist offen — halt ihn so!'),
  'Получается!': ('You are doing it!', 'Está a dar!', 'Klappt!'),
  'Открой ротик, как девочка': ('Open your mouth like the girl', 'Abre a boca como a menina', 'Mach den Mund auf wie das Mädchen'),
  'Попробуй ещё': ('Try again', 'Tenta outra vez', 'Versuch es noch einmal'),
  'Подбородок не двигается — работает язычок': ('The chin stays still — only the tongue works', 'O queixo fica quieto — só a língua trabalha', 'Das Kinn bleibt still — nur die Zunge arbeitet'),
  'Смотри в зеркало и делай, как девочка': ('Look in the mirror and do it like the girl', 'Olha para o espelho e faz como a menina', 'Schau in den Spiegel und mach es wie das Mädchen'),
  'Молодец, что старал{0}! Посмотри в зеркало, как язычок. ': ('Well done for trying{0}! Look in the mirror at what your tongue does. ', 'Muito bem, esforçaste-te{0}! Vê no espelho o que faz a língua. ', 'Toll, dass du dich angestrengt hast{0}! Schau im Spiegel, was die Zunge macht. '),
  'ась': ('', '', ''), 'ся': ('', '', ''),
  'Получается! ': ('You are doing it! ', 'Está a dar! ', 'Klappt! '),
  'Молодец, что старал{0}! ': ('Well done for trying{0}! ', 'Muito bem, esforçaste-te{0}! ', 'Toll, dass du dich angestrengt hast{0}! '),
  '<div class="prow-btns hon-b"><button class="big" id="honAgain">↻ Ещё раз</button>{0}</div>': ('<div class="prow-btns hon-b"><button class="big" id="honAgain">↻ Again</button>{0}</div>', '<div class="prow-btns hon-b"><button class="big" id="honAgain">↻ Outra vez</button>{0}</div>', '<div class="prow-btns hon-b"><button class="big" id="honAgain">↻ Noch einmal</button>{0}</div>'),
  '<button class="big ghost" id="honSkip">Пропустить</button>': ('<button class="big ghost" id="honSkip">Skip</button>', '<button class="big ghost" id="honSkip">Saltar</button>', '<button class="big ghost" id="honSkip">Überspringen</button>'),
  'Попробуй ещё! Я смотрю в зеркало вместе с тобой. Делай, как девочка.': ('Try again! I am looking in the mirror with you. Do it like the girl.', 'Tenta outra vez! Estou a olhar para o espelho contigo. Faz como a menina.', 'Versuch es noch einmal! Ich schaue mit dir in den Spiegel. Mach es wie das Mädchen.'),
  'Попробуй ещё! Нажми и держи кнопку «Делаю!», пока делаешь упражнение.': ('Try again! Press and hold the «I am doing it!» button while you do the exercise.', 'Tenta outra vez! Carrega e segura o botão «Estou a fazer!» enquanto fazes o exercício.', 'Versuch es noch einmal! Drück und halte die Taste «Ich mache!», solange du die Übung machst.'),
  'Зарядка для язычка за 7 дней: сделано {0}, пропущено {1} {2}. Это нормально — лучше одно упражнение по-настоящему, чем пять для галочки.': (
    'Tongue exercises in 7 days: {0} done, {1} {2} skipped. That is fine — one exercise done for real is better than five just to tick a box.',
    'Exercícios da língua em 7 dias: {0} feitos, {1} {2} saltados. Não faz mal — mais vale um exercício a sério do que cinco só para cumprir.',
    'Zungenübungen in 7 Tagen: {0} gemacht, {1} {2} übersprungen. Das ist in Ordnung — eine echte Übung ist besser als fünf zum Abhaken.'),
  'упражнение': ('exercise', 'exercício', 'Übung'), 'упражнения': ('exercises', 'exercícios', 'Übungen'), 'упражнений': ('exercises', 'exercícios', 'Übungen'),
  'Сегодня пропущено {0} {1} зарядки для язычка, сделано {2}.': ('Today {0} tongue {1} skipped, {2} done.', 'Hoje: {0} {1} da língua saltados, {2} feitos.', 'Heute {0} {1} für die Zunge übersprungen, {2} gemacht.'),
  '<div class="ls-ear{0}" aria-hidden="true">{1}<span class="emo">👂</span><b>слушаю…</b></div>': ('<div class="ls-ear{0}" aria-hidden="true">{1}<span class="emo">👂</span><b>listening…</b></div>', '<div class="ls-ear{0}" aria-hidden="true">{1}<span class="emo">👂</span><b>a ouvir…</b></div>', '<div class="ls-ear{0}" aria-hidden="true">{1}<span class="emo">👂</span><b>zuhören…</b></div>'),
  '<span class="emo">👆</span><b>нажимай!</b>': ('<span class="emo">👆</span><b>now tap!</b>', '<span class="emo">👆</span><b>agora carrega!</b>', '<span class="emo">👆</span><b>jetzt tippen!</b>'),
  'Ты не услышал{0}. Послушай, пожалуйста, внимательно.': ('You did not hear it{0}. Please listen carefully.', 'Não ouviste{0}. Ouve com atenção, por favor.', 'Du hast es nicht gehört{0}. Hör bitte genau zu.'),
  'а': ('', '', ''),
  '<p class="muted">Камера-зеркало в упражнениях для язычка показывает ребёнку его лицо только на экране: изображение не записывается, не сохраняется и никуда не отправляется. Чтобы сказать «Получается!» или «Попробуй ещё», видео анализирует программа прямо на телефоне (без интернета): из кадра получаются только несколько чисел — насколько открыт рот, широкая ли улыбка. Камера выключается, когда ребёнок уходит из упражнения или закрывает приложение. Включается само — переключатель «Зеркало включается само» в «День и все игры».</p>': (
    '<p class="muted">The mirror camera in the tongue exercises shows the child their face on the screen only: the picture is not recorded, not saved and not sent anywhere. To say «You are doing it!» or «Try again», a program analyses the video right on the phone (no internet): each frame gives only a few numbers — how open the mouth is, how wide the smile. The camera turns off when the child leaves the exercise or closes the app. It turns on by itself — the «The mirror turns on by itself» switch in «Day and all games».</p>',
    '<p class="muted">A câmara-espelho nos exercícios da língua mostra a cara da criança apenas no ecrã: a imagem não é gravada, não é guardada nem enviada. Para dizer «Está a dar!» ou «Tenta outra vez», um programa analisa o vídeo no próprio telemóvel (sem internet): de cada imagem saem só alguns números — quanto a boca está aberta, quão largo é o sorriso. A câmara desliga-se quando a criança sai do exercício ou fecha a aplicação. Liga-se sozinha — o interruptor «O espelho liga-se sozinho» em «Dia e todos os jogos».</p>',
    '<p class="muted">Die Spiegel-Kamera bei den Zungenübungen zeigt dem Kind sein Gesicht nur auf dem Bildschirm: Das Bild wird nicht aufgenommen, nicht gespeichert und nicht verschickt. Um «Klappt!» oder «Versuch es noch einmal» zu sagen, wertet ein Programm das Video direkt auf dem Handy aus (ohne Internet): Aus jedem Bild entstehen nur ein paar Zahlen — wie weit der Mund offen ist, wie breit das Lächeln. Die Kamera geht aus, wenn das Kind die Übung verlässt oder die App schließt. Sie geht von selbst an — Schalter «Der Spiegel geht von selbst an» unter «Tag und alle Spiele».</p>'),
}
CYR = re.compile('[А-Яа-яЁё]'); n = 0
for g, keys in miss.items():
    if g in ('GAMES', 'LEARN_IMG', 'SND_HI'): continue
    for k in (keys if isinstance(keys, list) else list(keys)):
        tr = W[k]
        assert not any(CYR.search(x) for x in tr), k
        fixed.setdefault(g, {})[k] = list(tr[:2]); fde.setdefault(g, {})[k] = tr[2]; n += 1
json.dump(fixed, open(H + '/fixed.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
json.dump(fde, open(H + '/de/fixed_de.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('ok', n)
