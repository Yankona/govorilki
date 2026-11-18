# own-tales: «🎧 Свои сказки» — audio files a grown-up adds from this phone (en, pt-PT, de)
import json, os, re
H = os.path.dirname(os.path.abspath(__file__))
fixed = json.load(open(H + '/fixed.json', encoding='utf-8')); fde = json.load(open(H + '/de/fixed_de.json', encoding='utf-8'))
miss = json.load(open(H + '/out-en.html.missing.json', encoding='utf-8'))
NOTE = ('Файлы хранятся только на этом телефоне. Добавляйте записи, которые вы купили или имеете право слушать дома.',
  'The files stay only on this phone. Add recordings you have bought or have the right to listen to at home.',
  'Os ficheiros ficam só neste telemóvel. Adicione gravações que comprou ou que tem o direito de ouvir em casa.',
  'Die Dateien bleiben nur auf diesem Handy. Fügen Sie Aufnahmen hinzu, die Sie gekauft haben oder zu Hause anhören dürfen.')
W = {
  NOTE[0]: NOTE[1:],
  ' КБ': (' KB', ' KB', ' KB'), ' МБ': (' MB', ' MB', ' MB'), ' ГБ': (' GB', ' GB', ' GB'),
  'Сказка': ('Story', 'História', 'Geschichte'),
  'Свои сказки': ('Our own stories', 'As nossas histórias', 'Eigene Geschichten'),
  'аудио только на этом телефоне': ('audio on this phone only', 'áudio só neste telemóvel', 'Audio nur auf diesem Handy'),
  '🎧 Свои сказки: {0} мин за неделю': ('🎧 Our own stories: {0} min this week', '🎧 As nossas histórias: {0} min esta semana', '🎧 Eigene Geschichten: {0} Min. diese Woche'),
  '<p class="ot-lead">🌙 Сказка перед сном. Выбери и слушай.</p>': ('<p class="ot-lead">🌙 A bedtime story. Pick one and listen.</p>', '<p class="ot-lead">🌙 Uma história para dormir. Escolhe e ouve.</p>', '<p class="ot-lead">🌙 Eine Gutenachtgeschichte. Such dir eine aus und hör zu.</p>'),
  'Добавлять и удалять сказки — это для взрослых.': ('Adding and deleting stories is for grown-ups.', 'Adicionar e apagar histórias é para os adultos.', 'Geschichten hinzufügen und löschen ist etwas für Erwachsene.'),
  '<p class="ot-lead">Здесь будут сказки, которые взрослые добавят с этого телефона.</p>': ('<p class="ot-lead">Stories that grown-ups add from this phone will be here.</p>', '<p class="ot-lead">Aqui vão estar as histórias que os adultos adicionarem neste telemóvel.</p>', '<p class="ot-lead">Hier sind bald Geschichten, die Erwachsene von diesem Handy hinzufügen.</p>'),
  '✓ слушала': ('✓ listened', '✓ ouviste', '✓ gehört'), '✓ слушал': ('✓ listened', '✓ ouviste', '✓ gehört'),
  '<p class="lead">Этой сказки больше нет на телефоне.</p>': ('<p class="lead">This story is no longer on the phone.</p>', '<p class="lead">Esta história já não está no telemóvel.</p>', '<p class="lead">Diese Geschichte ist nicht mehr auf dem Handy.</p>'),
  '✓ Ты уже слушала эту сказку': ('✓ You have listened to this story', '✓ Já ouviste esta história', '✓ Du hast diese Geschichte schon gehört'),
  '✓ Ты уже слушал эту сказку': ('✓ You have listened to this story', '✓ Já ouviste esta história', '✓ Du hast diese Geschichte schon gehört'),
  '☀️ Дневной вид': ('☀️ Daytime look', '☀️ Modo de dia', '☀️ Tagesansicht'),
  '🌙 Перед сном': ('🌙 Bedtime', '🌙 Hora de dormir', '🌙 Schlafenszeit'),
  'Пауза': ('Pause', 'Pausa', 'Pause'), 'Слушать': ('Listen', 'Ouvir', 'Anhören'),
  'Сказка выключится через {0} мин': ('The story will stop in {0} min', 'A história desliga-se daqui a {0} min', 'Die Geschichte hört in {0} Min. auf'),
  'Файл не открылся. Возможно, его удалили или на телефоне не хватило места. Добавьте сказку ещё раз.': ('The file did not open. Maybe it was deleted or the phone ran out of space. Please add the story again.', 'O ficheiro não abriu. Talvez tenha sido apagado ou o telemóvel ficou sem espaço. Adicione a história outra vez.', 'Die Datei ließ sich nicht öffnen. Vielleicht wurde sie gelöscht oder das Handy hatte keinen Platz. Fügen Sie die Geschichte noch einmal hinzu.'),
  'Конец. Спокойной ночи! 🌙': ('The end. Good night! 🌙', 'Fim. Boa noite! 🌙', 'Ende. Gute Nacht! 🌙'),
  '✓ Ты дослушала сказку!': ('✓ You listened to the whole story!', '✓ Ouviste a história até ao fim!', '✓ Du hast die ganze Geschichte gehört!'),
  '✓ Ты дослушал сказку!': ('✓ You listened to the whole story!', '✓ Ouviste a história até ao fim!', '✓ Du hast die ganze Geschichte gehört!'),
  'Этот файл телефон не может проиграть. Попробуйте mp3 или m4a.': ('This phone cannot play this file. Try mp3 or m4a.', 'Este telemóvel não consegue tocar este ficheiro. Experimente mp3 ou m4a.', 'Dieses Handy kann die Datei nicht abspielen. Versuchen Sie mp3 oder m4a.'),
  'Не получилось включить звук. Нажмите ещё раз.': ('The sound did not start. Tap again.', 'O som não começou. Toca outra vez.', 'Der Ton ging nicht an. Tippe noch einmal.'),
  'Точно?': ('Sure?', 'De certeza?', 'Sicher?'),
  '<p class="muted">Сказок пока нет.</p>': ('<p class="muted">No stories yet.</p>', '<p class="muted">Ainda não há histórias.</p>', '<p class="muted">Noch keine Geschichten.</p>'),
  'Занято сказками: {0}{1}.{2}': ('Stories take up: {0}{1}.{2}', 'Espaço ocupado pelas histórias: {0}{1}.{2}', 'Platz für Geschichten: {0}{1}.{2}'),
  'сказка': ('story', 'história', 'Geschichte'), 'сказки': ('stories', 'histórias', 'Geschichten'), 'сказок': ('stories', 'histórias', 'Geschichten'),
  ' Свободно для игры: около {0}.': (' Free for the game: about {0}.', ' Livre para o jogo: cerca de {0}.', ' Frei für das Spiel: etwa {0}.'),
  'Сохраняю «{0}» — {1}%': ('Saving “{0}” — {1}%', 'A guardar «{0}» — {1}%', 'Speichere „{0}“ — {1} %'),
  'Добавлено: {0} {1}. Дайте им название и картинку.': ('Added: {0} {1}. Give them a name and a picture.', 'Adicionadas: {0} {1}. Dê-lhes um nome e uma imagem.', 'Hinzugefügt: {0} {1}. Geben Sie ihnen einen Namen und ein Bild.'),
  ' Не аудио — пропущено: {0}.': (' Not audio — skipped: {0}.', ' Não são áudio — ignorados: {0}.', ' Kein Audio — übersprungen: {0}.'),
  ' Не хватило места на телефоне: удалите старые сказки или освободите место.': (' The phone ran out of space: delete old stories or free up some space.', ' O telemóvel ficou sem espaço: apague histórias antigas ou liberte espaço.', ' Auf dem Handy war nicht genug Platz: Löschen Sie alte Geschichten oder schaffen Sie Platz.'),
  ' Один файл не сохранился. Попробуйте ещё раз.': (' One file was not saved. Please try again.', ' Um ficheiro não foi guardado. Tente outra vez.', ' Eine Datei wurde nicht gespeichert. Versuchen Sie es noch einmal.'),
  'Название сохранено.': ('Name saved.', 'Nome guardado.', 'Name gespeichert.'),
  '«{0}» удалена, место освобождено.': ('“{0}” deleted, the space is free again.', '«{0}» apagada, o espaço ficou livre.', '„{0}“ gelöscht, der Platz ist wieder frei.'),
  'Картинка сохранена.': ('Picture saved.', 'Imagem guardada.', 'Bild gespeichert.'),
  'Эта картинка не открылась. Попробуйте другую.': ('This picture did not open. Try another one.', 'Esta imagem não abriu. Experimente outra.', 'Dieses Bild ließ sich nicht öffnen. Versuchen Sie ein anderes.'),
  'Свои сказки — это для взрослых.': ('Our own stories: this part is for grown-ups.', 'As nossas histórias: esta parte é para os adultos.', 'Eigene Geschichten: Dieser Teil ist für Erwachsene.'),
  ' · 🌙 перед сном': (' · 🌙 bedtime', ' · 🌙 hora de dormir', ' · 🌙 Schlafenszeit'),
  'сказки, которые добавили взрослые': ('stories the grown-ups added', 'histórias que os adultos adicionaram', 'Geschichten, die Erwachsene hinzugefügt haben'),
  'сказки слушать аудио перед сном': ('stories listen audio bedtime', 'histórias ouvir áudio dormir', 'Geschichten hören Audio Schlafenszeit'),
  'дослушано: {0}': ('listened to: {0}', 'ouvidas: {0}', 'gehört: {0}'),
}
# HTML templates: the Russian template with its Russian pieces swapped
F = [
  ('Открываю…', 'Opening…', 'A abrir…', 'Öffne…'),
  ('👪 Для взрослых: добавить сказки', '👪 For grown-ups: add stories', '👪 Para os adultos: adicionar histórias', '👪 Für Erwachsene: Geschichten hinzufügen'),
  ('Где мы в сказке', 'Where we are in the story', 'Onde estamos na história', 'Wo wir in der Geschichte sind'),
  ('Назад на 15 секунд', 'Back 15 seconds', 'Recuar 15 segundos', '15 Sekunden zurück'),
  ('Вперёд на 15 секунд', 'Forward 15 seconds', 'Avançar 15 segundos', '15 Sekunden vor'),
  ('aria-label="Слушать"', 'aria-label="Listen"', 'aria-label="Ouvir"', 'aria-label="Anhören"'),
  ('⏲ Выключить через', '⏲ Turn off in', '⏲ Desligar daqui a', '⏲ Ausschalten in'),
  ('10 мин', '10 min', '10 min', '10 Min.'), ('20 мин', '20 min', '20 min', '20 Min.'), ('30 мин', '30 min', '30 min', '30 Min.'),
  ('Не выключать', 'Keep playing', 'Não desligar', 'Nicht ausschalten'),
  ('🌑 Затемнить экран', '🌑 Darken the screen', '🌑 Escurecer o ecrã', '🌑 Bildschirm abdunkeln'),
  ('Включить экран', 'Turn the screen on', 'Ligar o ecrã', 'Bildschirm einschalten'),
  ('Нажми, чтобы включить экран', 'Tap to turn the screen on', 'Toca para ligar o ecrã', 'Tippe, um den Bildschirm einzuschalten'),
  ('➕ Добавить аудиофайлы', '➕ Add audio files', '➕ Adicionar ficheiros de áudio', '➕ Audiodateien hinzufügen'),
  ('Можно выбрать несколько файлов сразу: mp3, m4a, ogg. Потом дайте каждой сказке название и картинку.', 'You can choose several files at once: mp3, m4a, ogg. Then give each story a name and a picture.', 'Pode escolher vários ficheiros de uma vez: mp3, m4a, ogg. Depois dê a cada história um nome e uma imagem.', 'Sie können mehrere Dateien auf einmal wählen: mp3, m4a, ogg. Geben Sie dann jeder Geschichte einen Namen und ein Bild.'),
  ('🎧 Открыть полку, как её видит ребёнок', '🎧 Open the shelf as your child sees it', '🎧 Abrir a prateleira como a criança a vê', '🎧 Das Regal so öffnen, wie das Kind es sieht'),
  ('Картинка сказки', 'Story picture', 'Imagem da história', 'Bild der Geschichte'),
  ('Название сказки', 'Story name', 'Nome da história', 'Name der Geschichte'),
  ('aria-label="Выше"', 'aria-label="Up"', 'aria-label="Para cima"', 'aria-label="Nach oben"'),
  ('aria-label="Ниже"', 'aria-label="Down"', 'aria-label="Para baixo"', 'aria-label="Nach unten"'),
  ('Удалить сказку', 'Delete the story', 'Apagar a história', 'Geschichte löschen'),
  ('aria-label="Закрыть"', 'aria-label="Close"', 'aria-label="Fechar"', 'aria-label="Schließen"'),
  ('📷 Фото с телефона', '📷 Photo from the phone', '📷 Foto do telemóvel', '📷 Foto vom Handy'),
  ('Фото остаётся только на этом телефоне.', 'The photo stays only on this phone.', 'A foto fica só neste telemóvel.', 'Das Foto bleibt nur auf diesem Handy.'),
  ('<h2>🎧 Свои сказки</h2>', '<h2>🎧 Our own stories</h2>', '<h2>🎧 As nossas histórias</h2>', '<h2>🎧 Eigene Geschichten</h2>'),
  ('Аудиосказки с этого телефона: mp3, m4a, ogg. Дети слушают их в «Узнаём» и перед сном.', 'Audio stories from this phone: mp3, m4a, ogg. Children listen to them in “Discover” and at bedtime.', 'Histórias em áudio deste telemóvel: mp3, m4a, ogg. As crianças ouvem-nas em «Descobrir» e antes de dormir.', 'Hörgeschichten von diesem Handy: mp3, m4a, ogg. Kinder hören sie unter „Entdecken“ und vor dem Schlafen.'),
  ('🎧 Добавить и изменить сказки', '🎧 Add and change stories', '🎧 Adicionar e mudar histórias', '🎧 Geschichten hinzufügen und ändern'),
  ('🎧 Свои сказки{1}', '🎧 Our own stories{1}', '🎧 As nossas histórias{1}', '🎧 Eigene Geschichten{1}'),
  ('Послушать сказку', 'Listen to a story', 'Ouvir uma história', 'Eine Geschichte hören'),
  ('💡 Если хотите помочь — одна идея', '💡 If you would like to help — one idea', '💡 Se quiserem ajudar — uma ideia', '💡 Wenn Sie helfen möchten — eine Idee'),
]
CYR = re.compile('[А-Яа-яЁё]'); n = 0
def tpl(k):
    out = [k, k, k]
    for ru, *tr in F:
        if ru in k:
            for i in range(3): out[i] = out[i].replace(ru, tr[i])
    return tuple(out) if not any(CYR.search(x) for x in out) else None
for g, keys in miss.items():
    if g in ('GAMES', 'LEARN_IMG', 'SND_HI'): continue
    for k in keys:
        tr = W.get(k) or tpl(k)
        assert tr, 'no translation: ' + k[:200]
        assert not any(CYR.search(x) for x in tr), k
        fixed.setdefault(g, {})[k] = list(tr[:2]); fde.setdefault(g, {})[k] = tr[2]; n += 1
json.dump(fixed, open(H + '/fixed.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
json.dump(fde, open(H + '/de/fixed_de.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('ok', n)
