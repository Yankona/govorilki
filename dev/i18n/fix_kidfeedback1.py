# kid-feedback-1: «Читаю сам» in stories, the mirror that opens by itself, the counts for the report
import json, os, re
H = os.path.dirname(os.path.abspath(__file__))
fixed = json.load(open(H + '/fixed.json', encoding='utf-8')); fde = json.load(open(H + '/de/fixed_de.json', encoding='utf-8'))
miss = json.load(open(H + '/out-en.html.missing.json', encoding='utf-8'))
W = {
  # the mirror
  'Включим волшебное зеркало?': ('Shall we turn on the magic mirror?', 'Ligamos o espelho mágico?', 'Schalten wir den Zauberspiegel ein?'),
  'Ты увидишь свой рот и язычок. Камера ничего не записывает и никуда не отправляет.': ('You will see your mouth and your tongue. The camera records nothing and sends nothing anywhere.', 'Vais ver a tua boca e a tua língua. A câmara não grava nada nem envia nada.', 'Du siehst deinen Mund und deine Zunge. Die Kamera nimmt nichts auf und schickt nichts weg.'),
  'Да, включить': ('Yes, turn it on', 'Sim, ligar', 'Ja, einschalten'),
  'Не надо': ('No, thanks', 'Não, obrigado', 'Nein, danke'),
  'Хочешь видеть себя, как в зеркале? Нажми «Да, включить».': ('Would you like to see yourself, like in a mirror? Press «Yes, turn it on».', 'Queres ver-te como num espelho? Carrega em «Sim, ligar».', 'Möchtest du dich sehen, wie im Spiegel? Drück auf «Ja, einschalten».'),
  'Камера не включилась. Можно заниматься перед обычным зеркалом.': ('The camera did not turn on. You can practise in front of an ordinary mirror.', 'A câmara não ligou. Podes praticar em frente a um espelho normal.', 'Die Kamera ging nicht an. Du kannst vor einem normalen Spiegel üben.'),
  'Хорошо! Садись перед обычным зеркалом.': ('All right! Sit in front of an ordinary mirror.', 'Está bem! Senta-te em frente a um espelho normal.', 'Gut! Setz dich vor einen normalen Spiegel.'),
  # «Читаю сам»
  'Читаю сама': ('I read by myself', 'Leio sozinha', 'Ich lese selbst'),
  'Читаю сам': ('I read by myself', 'Leio sozinho', 'Ich lese selbst'),
  '✓ Я прочитала!': ('✓ I have read it!', '✓ Já li!', '✓ Ich habe es gelesen!'),
  '✓ Я прочитал!': ('✓ I have read it!', '✓ Já li!', '✓ Ich habe es gelesen!'),
  'Прочитать вслух кусочек': ('Read a bit aloud', 'Ler um bocadinho em voz alta', 'Ein Stück laut lesen'),
  'О чём эта история?': ('What is this story about?', 'De que fala esta história?', 'Worum geht es in dieser Geschichte?'),
  'Ты сама прочитала историю': ('You read the story by yourself', 'Leste a história sozinha', 'Du hast die Geschichte selbst gelesen'),
  'Ты сам прочитал историю': ('You read the story by yourself', 'Leste a história sozinho', 'Du hast die Geschichte selbst gelesen'),
  'и всё поняла': ('and understood it all', 'e percebeste tudo', 'und alles verstanden'),
  'и всё понял': ('and understood it all', 'e percebeste tudo', 'und alles verstanden'),
  'И красиво читала вслух!': ('And you read aloud beautifully!', 'E leste muito bem em voz alta!', 'Und du hast schön laut gelesen!'),
  'И красиво читал вслух!': ('And you read aloud beautifully!', 'E leste muito bem em voz alta!', 'Und du hast schön laut gelesen!'),
  'Ура': ('Hooray', 'Viva', 'Hurra'),
  'Я дочитала': ('I have finished', 'Já acabei', 'Ich bin fertig'),
  'Я дочитал': ('I have finished', 'Já acabei', 'Ich bin fertig'),
  'Читай вслух то, что подчёркнуто. Я слушаю…': ('Read the underlined part aloud. I am listening…', 'Lê em voz alta a parte sublinhada. Estou a ouvir…', 'Lies den unterstrichenen Teil laut. Ich höre zu…'),
  'Слышу: «{0}»': ('I hear: «{0}»', 'Ouço: «{0}»', 'Ich höre: «{0}»'),
  'Прочитать ещё раз': ('Read again', 'Ler outra vez', 'Noch einmal lesen'),
  'Не слышно. Можно ещё раз — или читай про себя и нажми «Я прочитала».': ('I could not hear you. Try again — or read silently and press «I have read it».', 'Não te ouvi. Tenta outra vez — ou lê em silêncio e carrega em «Já li».', 'Ich habe nichts gehört. Versuch es noch einmal — oder lies leise und drück auf «Ich habe es gelesen».'),
  'Не слышно. Можно ещё раз — или читай про себя и нажми «Я прочитал».': ('I could not hear you. Try again — or read silently and press «I have read it».', 'Não te ouvi. Tenta outra vez — ou lê em silêncio e carrega em «Já li».', 'Ich habe nichts gehört. Versuch es noch einmal — oder lies leise und drück auf «Ich habe es gelesen».'),
  'Читаешь вдумчиво — так и надо.': ('You read carefully — that is just right.', 'Lês com atenção — é assim mesmo.', 'Du liest genau — so ist es richtig.'),
  'Хороший ровный темп!': ('A good, steady pace!', 'Um bom ritmo, certinho!', 'Ein gutes, gleichmäßiges Tempo!'),
  'Быстро и чётко!': ('Quick and clear!', 'Rápido e claro!', 'Schnell und deutlich!'),
  'Слышу {0} {1} из {2}. {3}': ('I heard {0} {1} out of {2}. {3}', 'Ouvi {0} {1} de {2}. {3}', 'Ich habe {0} {1} von {2} gehört. {3}'),
  'слово': ('word', 'palavra', 'Wort'), 'слова': ('words', 'palavras', 'Wörter'), 'слов': ('words', 'palavras', 'Wörter'),
  'Молодец! {0}': ('Well done! {0}', 'Muito bem! {0}', 'Super! {0}'),
  'Хорошее начало! Можно ещё раз, не торопись.': ('A good start! Try again, take your time.', 'Bom começo! Tenta outra vez, com calma.', 'Ein guter Anfang! Versuch es noch einmal, ganz ruhig.'),
  'Прочитай историю сама. Потом я спрошу, о чём она.': ('Read the story by yourself. Then I will ask you what it is about.', 'Lê a história sozinha. Depois pergunto-te de que fala.', 'Lies die Geschichte selbst. Dann frage ich dich, worum es geht.'),
  'Прочитай историю сам. Потом я спрошу, о чём она.': ('Read the story by yourself. Then I will ask you what it is about.', 'Lê a história sozinho. Depois pergunto-te de que fala.', 'Lies die Geschichte selbst. Dann frage ich dich, worum es geht.'),
  '<p class="story-qt">{0}</p><div class="prow-btns"><button class="big" id="srNext">▶ Дальше</button></div>': ('<p class="story-qt">{0}</p><div class="prow-btns"><button class="big" id="srNext">▶ Next</button></div>', '<p class="story-qt">{0}</p><div class="prow-btns"><button class="big" id="srNext">▶ Seguinte</button></div>', '<p class="story-qt">{0}</p><div class="prow-btns"><button class="big" id="srNext">▶ Weiter</button></div>'),
  'Всё верно! Хочешь послушать, как читает голос?': ('All correct! Would you like to hear the voice read it?', 'Tudo certo! Queres ouvir a voz a ler?', 'Alles richtig! Möchtest du hören, wie die Stimme vorliest?'),
  # the report
  'историй: {0}{1}': ('stories: {0}{1}', 'histórias: {0}{1}', 'Geschichten: {0}{1}'),
  'прочитал сам': ('read by himself', 'leu sozinho', 'selbst gelesen'),
  'прочитала сама': ('read by herself', 'leu sozinha', 'selbst gelesen'),
  'историю': ('story', 'história', 'Geschichte'), 'истории': ('stories', 'histórias', 'Geschichten'), 'историй': ('stories', 'histórias', 'Geschichten'),
  ' · историй: {0}{1}': (' · stories: {0}{1}', ' · histórias: {0}{1}', ' · Geschichten: {0}{1}'),
  '<p>Прочитали сами: <b>{0}</b> · вслух: <b>{1}</b></p>': ('<p>Read by themselves: <b>{0}</b> · aloud: <b>{1}</b></p>', '<p>Leram sozinhos: <b>{0}</b> · em voz alta: <b>{1}</b></p>', '<p>Selbst gelesen: <b>{0}</b> · laut: <b>{1}</b></p>'),
  # parents: «День и все игры»
  '''<h3 class="fam-s">Истории: читать самому / слушать</h3>
      <div class="sd-seg" id="sdSR">{0}</div>
      <p class="sd-note">Читать самому: истории, новости и путешествия без голоса, потом 1–2 вопроса; «Послушать» — после ответа. Сейчас: <b>{1}</b>.</p>
      <h3 class="fam-s">Зеркало</h3>
      <label class="sw" for="sdMir"><input id="sdMir" type="checkbox" {2}><span class="set-t"><b>Зеркало включается само</b><small>в упражнениях для язычка камера телефона открывается как зеркало; ничего не записывается и никуда не отправляется</small></span></label>''': (
  '''<h3 class="fam-s">Stories: read alone / listen</h3>
      <div class="sd-seg" id="sdSR">{0}</div>
      <p class="sd-note">Read alone: stories, news and journeys without the voice, then 1–2 questions; «Listen» comes after the answer. Now: <b>{1}</b>.</p>
      <h3 class="fam-s">Mirror</h3>
      <label class="sw" for="sdMir"><input id="sdMir" type="checkbox" {2}><span class="set-t"><b>The mirror turns on by itself</b><small>in the tongue exercises the phone camera opens like a mirror; nothing is recorded or sent anywhere</small></span></label>''',
  '''<h3 class="fam-s">Histórias: ler sozinho / ouvir</h3>
      <div class="sd-seg" id="sdSR">{0}</div>
      <p class="sd-note">Ler sozinho: histórias, notícias e viagens sem a voz, depois 1–2 perguntas; «Ouvir» aparece depois da resposta. Agora: <b>{1}</b>.</p>
      <h3 class="fam-s">Espelho</h3>
      <label class="sw" for="sdMir"><input id="sdMir" type="checkbox" {2}><span class="set-t"><b>O espelho liga-se sozinho</b><small>nos exercícios da língua a câmara do telemóvel abre como um espelho; nada é gravado nem enviado</small></span></label>''',
  '''<h3 class="fam-s">Geschichten: selbst lesen / zuhören</h3>
      <div class="sd-seg" id="sdSR">{0}</div>
      <p class="sd-note">Selbst lesen: Geschichten, Nachrichten und Reisen ohne Stimme, danach 1–2 Fragen; «Anhören» erst nach der Antwort. Jetzt: <b>{1}</b>.</p>
      <h3 class="fam-s">Spiegel</h3>
      <label class="sw" for="sdMir"><input id="sdMir" type="checkbox" {2}><span class="set-t"><b>Der Spiegel geht von selbst an</b><small>bei den Zungenübungen öffnet sich die Handykamera wie ein Spiegel; nichts wird aufgenommen oder verschickt</small></span></label>'''),
  'по уровню чтения': ('by reading level', 'pelo nível de leitura', 'nach Lesestufe'),
  '📖 читать самому': ('📖 read alone', '📖 ler sozinho', '📖 selbst lesen'),
  '🔊 слушать': ('🔊 listen', '🔊 ouvir', '🔊 zuhören'),
  'читает сам': ('reads alone', 'lê sozinho', 'liest selbst'),
  'слушает': ('listens', 'ouve', 'hört zu'),
  '<p class="muted">Камера-зеркало в упражнениях для язычка показывает ребёнку его лицо только на экране: изображение не записывается, не сохраняется и никуда не отправляется. Камера выключается, когда ребёнок уходит из упражнения или закрывает приложение. Включается само — переключатель «Зеркало включается само» в «День и все игры».</p>': (
    '<p class="muted">The mirror camera in the tongue exercises shows the child their face on the screen only: the picture is not recorded, not saved and not sent anywhere. The camera turns off when the child leaves the exercise or closes the app. It turns on by itself — the «The mirror turns on by itself» switch in «Day and all games».</p>',
    '<p class="muted">A câmara-espelho nos exercícios da língua mostra a cara da criança apenas no ecrã: a imagem não é gravada, não é guardada nem enviada. A câmara desliga-se quando a criança sai do exercício ou fecha a aplicação. Liga-se sozinha — o interruptor «O espelho liga-se sozinho» em «Dia e todos os jogos».</p>',
    '<p class="muted">Die Spiegel-Kamera bei den Zungenübungen zeigt dem Kind sein Gesicht nur auf dem Bildschirm: Das Bild wird nicht aufgenommen, nicht gespeichert und nicht verschickt. Die Kamera geht aus, wenn das Kind die Übung verlässt oder die App schließt. Sie geht von selbst an — Schalter «Der Spiegel geht von selbst an» unter «Tag und alle Spiele».</p>'),
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
