# parent guide («Гайд»): translations of the parents' guide, the guest/parents screens and the new awards
# W = {russian: [en, pt, de]}; applied to every missing group of out-en.html.missing.json
import json, os, re
H = os.path.dirname(os.path.abspath(__file__))
fixed = json.load(open(H + '/fixed.json', encoding='utf-8')); fde = json.load(open(H + '/de/fixed_de.json', encoding='utf-8'))
miss = json.load(open(H + '/out-en.html.missing.json', encoding='utf-8'))
W = json.loads(r'''
{
"<div class=\"screen guest\"><main class=\"stage scroll\" id=\"stage\"><div class=\"fam\">\n    <header class=\"g-hero\"><span id=\"gHeroFace\">{0}</span><div><h1>{1}</h1></div></header>\n    <div class=\"gh-tiles\" id=\"ghTiles\">\n      <button class=\"gh-t\" data-gt=\"gKidsH\"><span class=\"emo\">⭐</span><b id=\"ghKidsT\">Как дела у {2}</b></button>\n      <button class=\"gh-t\" data-gt=\"gHelloH\"><span class=\"emo\">💌</span><b>Послать привет</b></button>\n      <button class=\"gh-t\" data-gt=\"gChessH\"><span class=\"emo\">♟</span><b>Шахматы</b></button>\n      <button class=\"gh-t\" data-gt=\"tale\"><span class=\"emo\">📖</span><b>Сказка вместе</b></button>\n      <button class=\"gh-t\" data-gt=\"gGamesH\"><span class=\"emo\">🎮</span><b>Игры внуков</b></button>\n      <button class=\"gh-t\" data-gt=\"gGuideH\"><span class=\"emo\">🧭</span><b>Гайд</b></button>\n    </div>\n    {3}\n    <div class=\"fam-card\"><h2 class=\"fam-h\" id=\"gKidsH\">Как дела у {4}</h2><div id=\"gKidsBox\" class=\"gk-box\"></div><p class=\"fam-out\" id=\"gPrOut\"></p><div id=\"gHearts\" class=\"g-hearts\"></div></div>\n    <div class=\"fam-card gd-sec\"><h2 class=\"fam-h\" id=\"gGuideH\">🧭 Гайд</h2><p class=\"lead\">Что получилось за неделю, совет из жизни и о чём поговорить.</p><div id=\"gGuide\"></div></div>\n    <div class=\"fam-card gh-hello\"><h2 class=\"fam-h\" id=\"gHelloH\">💌 Послать привет</h2><p class=\"lead\">Выберите картинку и слова. Игра покажет привет с вашим портретом и прочитает его вслух, когда внук откроет игру.</p>\n      <div class=\"gh-to\" id=\"ghTo\"></div>\n      <div class=\"gh-st\" id=\"ghSt\">{5}</div>\n      <div class=\"gh-ph\" id=\"ghPh\">{6}</div>\n      <p class=\"fam-out\" id=\"ghOut\"></p></div>\n    <div class=\"fam-card\"><h2 class=\"fam-h\" id=\"gGamesH\">🎮 Игры внуков</h2><p class=\"lead\">Те же игры, что у внуков: играйте сами, а потом обсудите или сыграйте вместе. Внуки увидят, во что вы играли.</p><div class=\"g-games\" id=\"gGames\">{7}</div></div>\n    <div class=\"fam-card\"><h2 class=\"fam-h\">♟ Приглашения</h2><div id=\"gInv\" class=\"g-inv\"><p class=\"lead\">Проверяю…</p></div></div>\n    <div class=\"fam-card\"><h2 class=\"fam-h\" id=\"gChessH\">♟ Позвать сыграть</h2>\n      <h3 class=\"fam-s\">Я играю</h3><div class=\"fam-row\" id=\"famSide\">{8}</div>\n      <div class=\"fam-who\" id=\"gWho\"></div><p class=\"fam-out\" id=\"gOut\"></p></div>\n    {9}\n    <div class=\"fam-card\"><h2 class=\"fam-h\">Как играть</h2><ol class=\"g-steps\">\n      <li>Нажмите «Играть» или «Начать партию» — доска откроется прямо здесь.</li>\n      <li>Ход: нажмите на свою фигуру, потом на клетку с точкой.</li>\n      <li>Ход {10} появится сам, телефон звякнет. Часов нет — думайте спокойно.</li>\n      <li>Можно закрыть страницу и вернуться позже: партия сохранится.</li>\n      <li>{11} учится говорить чётко — созвонитесь и попросите называть ходы вслух: «слон», «ладья», «король».</li></ol></div>\n    {12}\n    <div class=\"fam-card lang-pick\" id=\"gLang\"><h2 class=\"fam-h\">🌐 {13}</h2>{14}</div>\n    <button class=\"link-btn\" id=\"gKids\">Открыть игру {15}</button>\n    <button class=\"link-btn\" id=\"gExit\">Это телефон детей — выйти из входа</button>\n  </div></main></div>": [
"<div class=\"screen guest\"><main class=\"stage scroll\" id=\"stage\"><div class=\"fam\">\n    <header class=\"g-hero\"><span id=\"gHeroFace\">{0}</span><div><h1>{1}</h1></div></header>\n    <div class=\"gh-tiles\" id=\"ghTiles\">\n      <button class=\"gh-t\" data-gt=\"gKidsH\"><span class=\"emo\">⭐</span><b id=\"ghKidsT\">How is {2} doing</b></button>\n      <button class=\"gh-t\" data-gt=\"gHelloH\"><span class=\"emo\">💌</span><b>Send a hello</b></button>\n      <button class=\"gh-t\" data-gt=\"gChessH\"><span class=\"emo\">♟</span><b>Chess</b></button>\n      <button class=\"gh-t\" data-gt=\"tale\"><span class=\"emo\">📖</span><b>Story together</b></button>\n      <button class=\"gh-t\" data-gt=\"gGamesH\"><span class=\"emo\">🎮</span><b>Grandchildren’s games</b></button>\n      <button class=\"gh-t\" data-gt=\"gGuideH\"><span class=\"emo\">🧭</span><b>Guide</b></button>\n    </div>\n    {3}\n    <div class=\"fam-card\"><h2 class=\"fam-h\" id=\"gKidsH\">How is {4} doing</h2><div id=\"gKidsBox\" class=\"gk-box\"></div><p class=\"fam-out\" id=\"gPrOut\"></p><div id=\"gHearts\" class=\"g-hearts\"></div></div>\n    <div class=\"fam-card gd-sec\"><h2 class=\"fam-h\" id=\"gGuideH\">🧭 Guide</h2><p class=\"lead\">What went well this week, a tip from everyday life and something to talk about.</p><div id=\"gGuide\"></div></div>\n    <div class=\"fam-card gh-hello\"><h2 class=\"fam-h\" id=\"gHelloH\">💌 Send a hello</h2><p class=\"lead\">Choose a picture and some words. The game will show your hello with your portrait and read it out loud when your grandchild opens the game.</p>\n      <div class=\"gh-to\" id=\"ghTo\"></div>\n      <div class=\"gh-st\" id=\"ghSt\">{5}</div>\n      <div class=\"gh-ph\" id=\"ghPh\">{6}</div>\n      <p class=\"fam-out\" id=\"ghOut\"></p></div>\n    <div class=\"fam-card\"><h2 class=\"fam-h\" id=\"gGamesH\">🎮 Grandchildren’s games</h2><p class=\"lead\">The same games as your grandchildren have: play them yourself, then talk about them or play together. The grandchildren will see what you played.</p><div class=\"g-games\" id=\"gGames\">{7}</div></div>\n    <div class=\"fam-card\"><h2 class=\"fam-h\">♟ Invitations</h2><div id=\"gInv\" class=\"g-inv\"><p class=\"lead\">Checking…</p></div></div>\n    <div class=\"fam-card\"><h2 class=\"fam-h\" id=\"gChessH\">♟ Ask for a game</h2>\n      <h3 class=\"fam-s\">I play</h3><div class=\"fam-row\" id=\"famSide\">{8}</div>\n      <div class=\"fam-who\" id=\"gWho\"></div><p class=\"fam-out\" id=\"gOut\"></p></div>\n    {9}\n    <div class=\"fam-card\"><h2 class=\"fam-h\">How to play</h2><ol class=\"g-steps\">\n      <li>Tap “Play” or “Start a game” and the board opens right here.</li>\n      <li>To move, tap your piece, then a square with a dot.</li>\n      <li>{10}’s move will appear by itself and your phone will ping. There is no clock, so take your time.</li>\n      <li>You can close the page and come back later: the game is saved.</li>\n      <li>{11} is learning to speak clearly. Call each other and ask them to say the moves out loud: “bishop”, “rook”, “king”.</li></ol></div>\n    {12}\n    <div class=\"fam-card lang-pick\" id=\"gLang\"><h2 class=\"fam-h\">🌐 {13}</h2>{14}</div>\n    <button class=\"link-btn\" id=\"gKids\">Open the game for {15}</button>\n    <button class=\"link-btn\" id=\"gExit\">This is the children’s phone: sign out</button>\n  </div></main></div>",
"<div class=\"screen guest\"><main class=\"stage scroll\" id=\"stage\"><div class=\"fam\">\n    <header class=\"g-hero\"><span id=\"gHeroFace\">{0}</span><div><h1>{1}</h1></div></header>\n    <div class=\"gh-tiles\" id=\"ghTiles\">\n      <button class=\"gh-t\" data-gt=\"gKidsH\"><span class=\"emo\">⭐</span><b id=\"ghKidsT\">Como está {2}</b></button>\n      <button class=\"gh-t\" data-gt=\"gHelloH\"><span class=\"emo\">💌</span><b>Enviar um olá</b></button>\n      <button class=\"gh-t\" data-gt=\"gChessH\"><span class=\"emo\">♟</span><b>Xadrez</b></button>\n      <button class=\"gh-t\" data-gt=\"tale\"><span class=\"emo\">📖</span><b>Conto em conjunto</b></button>\n      <button class=\"gh-t\" data-gt=\"gGamesH\"><span class=\"emo\">🎮</span><b>Jogos dos netos</b></button>\n      <button class=\"gh-t\" data-gt=\"gGuideH\"><span class=\"emo\">🧭</span><b>Guia</b></button>\n    </div>\n    {3}\n    <div class=\"fam-card\"><h2 class=\"fam-h\" id=\"gKidsH\">Como está {4}</h2><div id=\"gKidsBox\" class=\"gk-box\"></div><p class=\"fam-out\" id=\"gPrOut\"></p><div id=\"gHearts\" class=\"g-hearts\"></div></div>\n    <div class=\"fam-card gd-sec\"><h2 class=\"fam-h\" id=\"gGuideH\">🧭 Guia</h2><p class=\"lead\">O que correu bem esta semana, uma dica do dia a dia e um assunto para conversar.</p><div id=\"gGuide\"></div></div>\n    <div class=\"fam-card gh-hello\"><h2 class=\"fam-h\" id=\"gHelloH\">💌 Enviar um olá</h2><p class=\"lead\">Escolham uma imagem e algumas palavras. O jogo mostra o olá com o vosso retrato e lê-o em voz alta quando o neto abrir o jogo.</p>\n      <div class=\"gh-to\" id=\"ghTo\"></div>\n      <div class=\"gh-st\" id=\"ghSt\">{5}</div>\n      <div class=\"gh-ph\" id=\"ghPh\">{6}</div>\n      <p class=\"fam-out\" id=\"ghOut\"></p></div>\n    <div class=\"fam-card\"><h2 class=\"fam-h\" id=\"gGamesH\">🎮 Jogos dos netos</h2><p class=\"lead\">Os mesmos jogos dos netos: joguem sozinhos e depois conversem ou joguem em conjunto. Os netos vão ver o que jogaram.</p><div class=\"g-games\" id=\"gGames\">{7}</div></div>\n    <div class=\"fam-card\"><h2 class=\"fam-h\">♟ Convites</h2><div id=\"gInv\" class=\"g-inv\"><p class=\"lead\">A verificar…</p></div></div>\n    <div class=\"fam-card\"><h2 class=\"fam-h\" id=\"gChessH\">♟ Convidar para jogar</h2>\n      <h3 class=\"fam-s\">Eu jogo com</h3><div class=\"fam-row\" id=\"famSide\">{8}</div>\n      <div class=\"fam-who\" id=\"gWho\"></div><p class=\"fam-out\" id=\"gOut\"></p></div>\n    {9}\n    <div class=\"fam-card\"><h2 class=\"fam-h\">Como jogar</h2><ol class=\"g-steps\">\n      <li>Toquem em «Jogar» ou «Começar uma partida» e o tabuleiro abre aqui mesmo.</li>\n      <li>Para jogar, toquem na vossa peça e depois numa casa com um ponto.</li>\n      <li>A jogada de {10} aparece sozinha e o telemóvel avisa. Não há relógio: pensem com calma.</li>\n      <li>Podem fechar a página e voltar mais tarde: a partida fica guardada.</li>\n      <li>{11} está a aprender a falar com clareza. Liguem um ao outro e peçam para dizer as jogadas em voz alta: «bispo», «torre», «rei».</li></ol></div>\n    {12}\n    <div class=\"fam-card lang-pick\" id=\"gLang\"><h2 class=\"fam-h\">🌐 {13}</h2>{14}</div>\n    <button class=\"link-btn\" id=\"gKids\">Abrir o jogo de {15}</button>\n    <button class=\"link-btn\" id=\"gExit\">Este é o telemóvel das crianças: terminar sessão</button>\n  </div></main></div>",
"<div class=\"screen guest\"><main class=\"stage scroll\" id=\"stage\"><div class=\"fam\">\n    <header class=\"g-hero\"><span id=\"gHeroFace\">{0}</span><div><h1>{1}</h1></div></header>\n    <div class=\"gh-tiles\" id=\"ghTiles\">\n      <button class=\"gh-t\" data-gt=\"gKidsH\"><span class=\"emo\">⭐</span><b id=\"ghKidsT\">Wie geht es {2}</b></button>\n      <button class=\"gh-t\" data-gt=\"gHelloH\"><span class=\"emo\">💌</span><b>Einen Gruß schicken</b></button>\n      <button class=\"gh-t\" data-gt=\"gChessH\"><span class=\"emo\">♟</span><b>Schach</b></button>\n      <button class=\"gh-t\" data-gt=\"tale\"><span class=\"emo\">📖</span><b>Gemeinsam ein Märchen</b></button>\n      <button class=\"gh-t\" data-gt=\"gGamesH\"><span class=\"emo\">🎮</span><b>Spiele der Enkel</b></button>\n      <button class=\"gh-t\" data-gt=\"gGuideH\"><span class=\"emo\">🧭</span><b>Ratgeber</b></button>\n    </div>\n    {3}\n    <div class=\"fam-card\"><h2 class=\"fam-h\" id=\"gKidsH\">Wie geht es {4}</h2><div id=\"gKidsBox\" class=\"gk-box\"></div><p class=\"fam-out\" id=\"gPrOut\"></p><div id=\"gHearts\" class=\"g-hearts\"></div></div>\n    <div class=\"fam-card gd-sec\"><h2 class=\"fam-h\" id=\"gGuideH\">🧭 Ratgeber</h2><p class=\"lead\">Was diese Woche gut geklappt hat, ein Tipp aus dem Alltag und ein Gesprächsthema.</p><div id=\"gGuide\"></div></div>\n    <div class=\"fam-card gh-hello\"><h2 class=\"fam-h\" id=\"gHelloH\">💌 Einen Gruß schicken</h2><p class=\"lead\">Wählen Sie ein Bild und Worte aus. Das Spiel zeigt den Gruß mit Ihrem Porträt und liest ihn laut vor, wenn Ihr Enkelkind das Spiel öffnet.</p>\n      <div class=\"gh-to\" id=\"ghTo\"></div>\n      <div class=\"gh-st\" id=\"ghSt\">{5}</div>\n      <div class=\"gh-ph\" id=\"ghPh\">{6}</div>\n      <p class=\"fam-out\" id=\"ghOut\"></p></div>\n    <div class=\"fam-card\"><h2 class=\"fam-h\" id=\"gGamesH\">🎮 Spiele der Enkel</h2><p class=\"lead\">Dieselben Spiele wie bei den Enkeln: Spielen Sie selbst, dann sprechen Sie darüber oder spielen zusammen. Die Enkel sehen, was Sie gespielt haben.</p><div class=\"g-games\" id=\"gGames\">{7}</div></div>\n    <div class=\"fam-card\"><h2 class=\"fam-h\">♟ Einladungen</h2><div id=\"gInv\" class=\"g-inv\"><p class=\"lead\">Ich prüfe …</p></div></div>\n    <div class=\"fam-card\"><h2 class=\"fam-h\" id=\"gChessH\">♟ Zum Spielen einladen</h2>\n      <h3 class=\"fam-s\">Ich spiele</h3><div class=\"fam-row\" id=\"famSide\">{8}</div>\n      <div class=\"fam-who\" id=\"gWho\"></div><p class=\"fam-out\" id=\"gOut\"></p></div>\n    {9}\n    <div class=\"fam-card\"><h2 class=\"fam-h\">So wird gespielt</h2><ol class=\"g-steps\">\n      <li>Tippen Sie auf „Spielen“ oder „Partie starten“, dann öffnet sich das Brett gleich hier.</li>\n      <li>Zum Ziehen tippen Sie auf Ihre Figur und dann auf ein Feld mit Punkt.</li>\n      <li>Der Zug von {10} erscheint von selbst, und Ihr Telefon klingelt. Es gibt keine Uhr, lassen Sie sich Zeit.</li>\n      <li>Sie können die Seite schließen und später zurückkommen: Die Partie bleibt gespeichert.</li>\n      <li>{11} lernt, deutlich zu sprechen. Telefonieren Sie und bitten Sie, die Züge laut zu sagen: „Läufer“, „Turm“, „König“.</li></ol></div>\n    {12}\n    <div class=\"fam-card lang-pick\" id=\"gLang\"><h2 class=\"fam-h\">🌐 {13}</h2>{14}</div>\n    <button class=\"link-btn\" id=\"gKids\">Spiel von {15} öffnen</button>\n    <button class=\"link-btn\" id=\"gExit\">Das ist das Handy der Kinder: abmelden</button>\n  </div></main></div>"
],
"<div class=\"parents\">\n    <section class=\"psec gd-sec\" id=\"guideSec\"><h2>🧭 Гайд</h2><p class=\"muted\">Игра учит, а вы направляете: что получилось за неделю, один совет из жизни и проект недели.</p><div id=\"guideBox\"></div></section>\n    <section class=\"psec\"><h2>Семьи</h2>\n      <p>Сейчас: <b>{0}</b> — {1}{2}.</p>\n      {3}\n      {4}\n      <div class=\"prow-btns\"><button class=\"big\" id=\"pultBtn\">👑 Пульт семьи: все аккаунты</button><button class=\"big ghost\" id=\"kidSetup\">💛 Интересы и игры: {5}</button><button class=\"big ghost\" id=\"famInvP\">📨 Пригласить родных</button><button class=\"big ghost\" id=\"famInvF\">👪 Пригласить другую семью</button><button class=\"big ghost\" id=\"famEdit\">Изменить семью</button><button class=\"big ghost\" id=\"famAll\">Все семьи</button><button class=\"big ghost\" id=\"famLg\">🏆 Лига семей</button></div>\n    </section>\n    <section class=\"psec lang-pick\" id=\"langSec\"><h2>🌐 {6}</h2>{7}</section>\n    <section class=\"psec\"><h2>Настройки: {8}</h2>\n      <label class=\"prow\" for=\"nameIn\">Имя ребёнка (друг будет обращаться по имени)\n        <input id=\"nameIn\" type=\"text\" maxlength=\"20\" autocomplete=\"off\" placeholder=\"например, Маша\" value=\"{9}\"></label>\n      <label class=\"sw\" for=\"voiceIn\"><input id=\"voiceIn\" type=\"checkbox\" {10}>Друг говорит вслух</label>\n      <label class=\"sw\" for=\"slowIn\"><input id=\"slowIn\" type=\"checkbox\" {11}>Говорить ещё медленнее</label>\n      <label class=\"prow\" for=\"piperSel\">Голос приложения (бесплатный, работает без интернета) <select id=\"piperSel\">{12}<option value=\"device\" {13}>голос телефона</option></select></label>\n      <p class=\"muted\" id=\"piperState\"></p>\n      <label class=\"prow\" for=\"devVoice\">Голос телефона (бесплатный) <select id=\"devVoice\"><option value=\"\">— автоматически —</option></select></label>\n      <label class=\"sw\" for=\"sfxIn\"><input id=\"sfxIn\" type=\"checkbox\" {14}>Звуки игры</label>\n      <label class=\"sw\" for=\"rfIn\"><input id=\"rfIn\" type=\"checkbox\" {15}>День без чтения стоит 10 звёзд (чтение, книга или игра на чтение — и день засчитан)</label>\n      {16}\n      <label class=\"sw\" for=\"micIn\"><input id=\"micIn\" type=\"checkbox\" {17}>Микрофон проверяет, что ребёнок сказал вслух и подул</label>\n      <label class=\"sw\" for=\"srIn\"><input id=\"srIn\" type=\"checkbox\" {18}>Проверять, какое слово сказано (распознавание речи браузера: звук обрабатывает Google в Chrome или Apple в Safari)</label>{19}{20}\n      <p class=\"muted\" id=\"voiceState\"></p>\n      <div class=\"prow-btns\"><button class=\"big ghost\" id=\"testVoice\">Проверить голос</button></div>\n    </section>\n    {21}\n    {22}\n    <section class=\"psec\" id=\"elSec\"><h2>Голос друга: ElevenLabs</h2>\n      {23}\n    </section>\n    <section class=\"psec\"><h2>Прогресс</h2>\n      <p>Звёздочек: <b>{24}</b>. Наклеек: <b>{25}</b> из {26}. Прогресс хранится только на этом устройстве.</p>\n      <div class=\"prow-btns\"><button class=\"big ghost\" id=\"expBtn\">Скопировать прогресс</button><button class=\"big ghost\" id=\"impBtn\">Вставить прогресс</button></div>\n      <div id=\"impBox\" hidden><textarea id=\"impTxt\" rows=\"3\" placeholder=\"Вставьте сюда скопированный прогресс\"></textarea><div class=\"prow-btns\"><button class=\"big\" id=\"impGo\">Загрузить</button></div></div>\n      <p class=\"muted\" id=\"expState\">Копируется вся семья: дети, бабушки и дедушки. Пригодится при переезде на другое устройство: здесь копируете, там вставляете.</p>\n      <div class=\"prow-btns\" id=\"resetRow\"><button class=\"big ghost danger\" id=\"resetBtn\">Начать заново</button></div>\n      <div id=\"resetAsk\" hidden><p>Стереть все звёздочки и наклейки?</p><div class=\"prow-btns\"><button class=\"big danger\" id=\"resetYes\">Да, стереть</button><button class=\"big ghost\" id=\"resetNo\">Отмена</button></div></div>\n    </section>\n    <section class=\"psec\"><h2>Как заниматься: {27}</h2><p class=\"muted\">Профиль переключается вверху главного экрана. У каждого ребёнка свои звёздочки, календарь и настройки.</p><ul>{28}    </ul></section>\n    </div>": [
"<div class=\"parents\">\n    <section class=\"psec gd-sec\" id=\"guideSec\"><h2>🧭 Guide</h2><p class=\"muted\">The game teaches and you guide: what went well this week, one tip from everyday life and the project of the week.</p><div id=\"guideBox\"></div></section>\n    <section class=\"psec\"><h2>Families</h2>\n      <p>Now: <b>{0}</b> — {1}{2}.</p>\n      {3}\n      {4}\n      <div class=\"prow-btns\"><button class=\"big\" id=\"pultBtn\">👑 Family control panel: all accounts</button><button class=\"big ghost\" id=\"kidSetup\">💛 Interests and games: {5}</button><button class=\"big ghost\" id=\"famInvP\">📨 Invite relatives</button><button class=\"big ghost\" id=\"famInvF\">👪 Invite another family</button><button class=\"big ghost\" id=\"famEdit\">Edit the family</button><button class=\"big ghost\" id=\"famAll\">All families</button><button class=\"big ghost\" id=\"famLg\">🏆 Family league</button></div>\n    </section>\n    <section class=\"psec lang-pick\" id=\"langSec\"><h2>🌐 {6}</h2>{7}</section>\n    <section class=\"psec\"><h2>Settings: {8}</h2>\n      <label class=\"prow\" for=\"nameIn\">Child’s name (the friend will use it)\n        <input id=\"nameIn\" type=\"text\" maxlength=\"20\" autocomplete=\"off\" placeholder=\"for example, Maisie\" value=\"{9}\"></label>\n      <label class=\"sw\" for=\"voiceIn\"><input id=\"voiceIn\" type=\"checkbox\" {10}>The friend speaks out loud</label>\n      <label class=\"sw\" for=\"slowIn\"><input id=\"slowIn\" type=\"checkbox\" {11}>Speak even more slowly</label>\n      <label class=\"prow\" for=\"piperSel\">App voice (free, works without internet) <select id=\"piperSel\">{12}<option value=\"device\" {13}>phone voice</option></select></label>\n      <p class=\"muted\" id=\"piperState\"></p>\n      <label class=\"prow\" for=\"devVoice\">Phone voice (free) <select id=\"devVoice\"><option value=\"\">— automatic —</option></select></label>\n      <label class=\"sw\" for=\"sfxIn\"><input id=\"sfxIn\" type=\"checkbox\" {14}>Game sounds</label>\n      <label class=\"sw\" for=\"rfIn\"><input id=\"rfIn\" type=\"checkbox\" {15}>A day without reading costs 10 stars (reading, a book or a reading game, and the day counts)</label>\n      {16}\n      <label class=\"sw\" for=\"micIn\"><input id=\"micIn\" type=\"checkbox\" {17}>The microphone checks that the child spoke out loud and blew</label>\n      <label class=\"sw\" for=\"srIn\"><input id=\"srIn\" type=\"checkbox\" {18}>Check which word was said (the browser’s speech recognition: the sound is processed by Google in Chrome or Apple in Safari)</label>{19}{20}\n      <p class=\"muted\" id=\"voiceState\"></p>\n      <div class=\"prow-btns\"><button class=\"big ghost\" id=\"testVoice\">Test the voice</button></div>\n    </section>\n    {21}\n    {22}\n    <section class=\"psec\" id=\"elSec\"><h2>Friend’s voice: ElevenLabs</h2>\n      {23}\n    </section>\n    <section class=\"psec\"><h2>Progress</h2>\n      <p>Stars: <b>{24}</b>. Stickers: <b>{25}</b> of {26}. Progress is kept only on this device.</p>\n      <div class=\"prow-btns\"><button class=\"big ghost\" id=\"expBtn\">Copy progress</button><button class=\"big ghost\" id=\"impBtn\">Paste progress</button></div>\n      <div id=\"impBox\" hidden><textarea id=\"impTxt\" rows=\"3\" placeholder=\"Paste the copied progress here\"></textarea><div class=\"prow-btns\"><button class=\"big\" id=\"impGo\">Load</button></div></div>\n      <p class=\"muted\" id=\"expState\">The whole family is copied: children, grandmas and grandpas. Useful when you move to another device: copy here, paste there.</p>\n      <div class=\"prow-btns\" id=\"resetRow\"><button class=\"big ghost danger\" id=\"resetBtn\">Start again</button></div>\n      <div id=\"resetAsk\" hidden><p>Wipe all the stars and stickers?</p><div class=\"prow-btns\"><button class=\"big danger\" id=\"resetYes\">Yes, wipe them</button><button class=\"big ghost\" id=\"resetNo\">Cancel</button></div></div>\n    </section>\n    <section class=\"psec\"><h2>How to practise: {27}</h2><p class=\"muted\">The profile is switched at the top of the main screen. Each child has their own stars, calendar and settings.</p><ul>{28}    </ul></section>\n    </div>",
"<div class=\"parents\">\n    <section class=\"psec gd-sec\" id=\"guideSec\"><h2>🧭 Guia</h2><p class=\"muted\">O jogo ensina e vocês orientam: o que correu bem esta semana, uma dica do dia a dia e o projeto da semana.</p><div id=\"guideBox\"></div></section>\n    <section class=\"psec\"><h2>Famílias</h2>\n      <p>Agora: <b>{0}</b> — {1}{2}.</p>\n      {3}\n      {4}\n      <div class=\"prow-btns\"><button class=\"big\" id=\"pultBtn\">👑 Painel da família: todas as contas</button><button class=\"big ghost\" id=\"kidSetup\">💛 Interesses e jogos: {5}</button><button class=\"big ghost\" id=\"famInvP\">📨 Convidar familiares</button><button class=\"big ghost\" id=\"famInvF\">👪 Convidar outra família</button><button class=\"big ghost\" id=\"famEdit\">Alterar a família</button><button class=\"big ghost\" id=\"famAll\">Todas as famílias</button><button class=\"big ghost\" id=\"famLg\">🏆 Liga das famílias</button></div>\n    </section>\n    <section class=\"psec lang-pick\" id=\"langSec\"><h2>🌐 {6}</h2>{7}</section>\n    <section class=\"psec\"><h2>Definições: {8}</h2>\n      <label class=\"prow\" for=\"nameIn\">Nome da criança (o amigo vai tratá-la pelo nome)\n        <input id=\"nameIn\" type=\"text\" maxlength=\"20\" autocomplete=\"off\" placeholder=\"por exemplo, Maria\" value=\"{9}\"></label>\n      <label class=\"sw\" for=\"voiceIn\"><input id=\"voiceIn\" type=\"checkbox\" {10}>O amigo fala em voz alta</label>\n      <label class=\"sw\" for=\"slowIn\"><input id=\"slowIn\" type=\"checkbox\" {11}>Falar ainda mais devagar</label>\n      <label class=\"prow\" for=\"piperSel\">Voz da aplicação (gratuita, funciona sem internet) <select id=\"piperSel\">{12}<option value=\"device\" {13}>voz do telemóvel</option></select></label>\n      <p class=\"muted\" id=\"piperState\"></p>\n      <label class=\"prow\" for=\"devVoice\">Voz do telemóvel (gratuita) <select id=\"devVoice\"><option value=\"\">— automática —</option></select></label>\n      <label class=\"sw\" for=\"sfxIn\"><input id=\"sfxIn\" type=\"checkbox\" {14}>Sons do jogo</label>\n      <label class=\"sw\" for=\"rfIn\"><input id=\"rfIn\" type=\"checkbox\" {15}>Um dia sem leitura custa 10 estrelas (leitura, um livro ou um jogo de leitura, e o dia conta)</label>\n      {16}\n      <label class=\"sw\" for=\"micIn\"><input id=\"micIn\" type=\"checkbox\" {17}>O microfone verifica se a criança falou em voz alta e soprou</label>\n      <label class=\"sw\" for=\"srIn\"><input id=\"srIn\" type=\"checkbox\" {18}>Verificar que palavra foi dita (reconhecimento de voz do navegador: o som é processado pela Google no Chrome ou pela Apple no Safari)</label>{19}{20}\n      <p class=\"muted\" id=\"voiceState\"></p>\n      <div class=\"prow-btns\"><button class=\"big ghost\" id=\"testVoice\">Testar a voz</button></div>\n    </section>\n    {21}\n    {22}\n    <section class=\"psec\" id=\"elSec\"><h2>Voz do amigo: ElevenLabs</h2>\n      {23}\n    </section>\n    <section class=\"psec\"><h2>Progresso</h2>\n      <p>Estrelas: <b>{24}</b>. Autocolantes: <b>{25}</b> de {26}. O progresso fica guardado apenas neste dispositivo.</p>\n      <div class=\"prow-btns\"><button class=\"big ghost\" id=\"expBtn\">Copiar o progresso</button><button class=\"big ghost\" id=\"impBtn\">Colar o progresso</button></div>\n      <div id=\"impBox\" hidden><textarea id=\"impTxt\" rows=\"3\" placeholder=\"Cole aqui o progresso copiado\"></textarea><div class=\"prow-btns\"><button class=\"big\" id=\"impGo\">Carregar</button></div></div>\n      <p class=\"muted\" id=\"expState\">Copia-se a família toda: crianças, avós e avôs. É útil ao mudar de dispositivo: copiam aqui e colam lá.</p>\n      <div class=\"prow-btns\" id=\"resetRow\"><button class=\"big ghost danger\" id=\"resetBtn\">Recomeçar</button></div>\n      <div id=\"resetAsk\" hidden><p>Apagar todas as estrelas e autocolantes?</p><div class=\"prow-btns\"><button class=\"big danger\" id=\"resetYes\">Sim, apagar</button><button class=\"big ghost\" id=\"resetNo\">Cancelar</button></div></div>\n    </section>\n    <section class=\"psec\"><h2>Como praticar: {27}</h2><p class=\"muted\">O perfil muda-se no topo do ecrã principal. Cada criança tem as suas estrelas, calendário e definições.</p><ul>{28}    </ul></section>\n    </div>",
"<div class=\"parents\">\n    <section class=\"psec gd-sec\" id=\"guideSec\"><h2>🧭 Ratgeber</h2><p class=\"muted\">Das Spiel lehrt, und Sie begleiten: was diese Woche gut geklappt hat, ein Tipp aus dem Alltag und das Projekt der Woche.</p><div id=\"guideBox\"></div></section>\n    <section class=\"psec\"><h2>Familien</h2>\n      <p>Jetzt: <b>{0}</b> — {1}{2}.</p>\n      {3}\n      {4}\n      <div class=\"prow-btns\"><button class=\"big\" id=\"pultBtn\">👑 Familienpult: alle Konten</button><button class=\"big ghost\" id=\"kidSetup\">💛 Interessen und Spiele: {5}</button><button class=\"big ghost\" id=\"famInvP\">📨 Verwandte einladen</button><button class=\"big ghost\" id=\"famInvF\">👪 Andere Familie einladen</button><button class=\"big ghost\" id=\"famEdit\">Familie ändern</button><button class=\"big ghost\" id=\"famAll\">Alle Familien</button><button class=\"big ghost\" id=\"famLg\">🏆 Familienliga</button></div>\n    </section>\n    <section class=\"psec lang-pick\" id=\"langSec\"><h2>🌐 {6}</h2>{7}</section>\n    <section class=\"psec\"><h2>Einstellungen: {8}</h2>\n      <label class=\"prow\" for=\"nameIn\">Name des Kindes (der Freund spricht es damit an)\n        <input id=\"nameIn\" type=\"text\" maxlength=\"20\" autocomplete=\"off\" placeholder=\"zum Beispiel Mia\" value=\"{9}\"></label>\n      <label class=\"sw\" for=\"voiceIn\"><input id=\"voiceIn\" type=\"checkbox\" {10}>Der Freund spricht laut</label>\n      <label class=\"sw\" for=\"slowIn\"><input id=\"slowIn\" type=\"checkbox\" {11}>Noch langsamer sprechen</label>\n      <label class=\"prow\" for=\"piperSel\">Stimme der App (kostenlos, funktioniert ohne Internet) <select id=\"piperSel\">{12}<option value=\"device\" {13}>Stimme des Handys</option></select></label>\n      <p class=\"muted\" id=\"piperState\"></p>\n      <label class=\"prow\" for=\"devVoice\">Stimme des Handys (kostenlos) <select id=\"devVoice\"><option value=\"\">— automatisch —</option></select></label>\n      <label class=\"sw\" for=\"sfxIn\"><input id=\"sfxIn\" type=\"checkbox\" {14}>Spielgeräusche</label>\n      <label class=\"sw\" for=\"rfIn\"><input id=\"rfIn\" type=\"checkbox\" {15}>Ein Tag ohne Lesen kostet 10 Sterne (Lesen, ein Buch oder ein Leserätsel, und der Tag zählt)</label>\n      {16}\n      <label class=\"sw\" for=\"micIn\"><input id=\"micIn\" type=\"checkbox\" {17}>Das Mikrofon prüft, ob das Kind laut gesprochen und gepustet hat</label>\n      <label class=\"sw\" for=\"srIn\"><input id=\"srIn\" type=\"checkbox\" {18}>Prüfen, welches Wort gesagt wurde (Spracherkennung des Browsers: Der Ton wird von Google in Chrome oder Apple in Safari verarbeitet)</label>{19}{20}\n      <p class=\"muted\" id=\"voiceState\"></p>\n      <div class=\"prow-btns\"><button class=\"big ghost\" id=\"testVoice\">Stimme testen</button></div>\n    </section>\n    {21}\n    {22}\n    <section class=\"psec\" id=\"elSec\"><h2>Stimme des Freundes: ElevenLabs</h2>\n      {23}\n    </section>\n    <section class=\"psec\"><h2>Fortschritt</h2>\n      <p>Sterne: <b>{24}</b>. Sticker: <b>{25}</b> von {26}. Der Fortschritt wird nur auf diesem Gerät gespeichert.</p>\n      <div class=\"prow-btns\"><button class=\"big ghost\" id=\"expBtn\">Fortschritt kopieren</button><button class=\"big ghost\" id=\"impBtn\">Fortschritt einfügen</button></div>\n      <div id=\"impBox\" hidden><textarea id=\"impTxt\" rows=\"3\" placeholder=\"Fügen Sie hier den kopierten Fortschritt ein\"></textarea><div class=\"prow-btns\"><button class=\"big\" id=\"impGo\">Laden</button></div></div>\n      <p class=\"muted\" id=\"expState\">Es wird die ganze Familie kopiert: Kinder, Omas und Opas. Praktisch beim Wechsel auf ein anderes Gerät: Hier kopieren, dort einfügen.</p>\n      <div class=\"prow-btns\" id=\"resetRow\"><button class=\"big ghost danger\" id=\"resetBtn\">Neu anfangen</button></div>\n      <div id=\"resetAsk\" hidden><p>Alle Sterne und Sticker löschen?</p><div class=\"prow-btns\"><button class=\"big danger\" id=\"resetYes\">Ja, löschen</button><button class=\"big ghost\" id=\"resetNo\">Abbrechen</button></div></div>\n    </section>\n    <section class=\"psec\"><h2>So üben Sie: {27}</h2><p class=\"muted\">Das Profil wechseln Sie oben auf dem Startbildschirm. Jedes Kind hat eigene Sterne, einen eigenen Kalender und eigene Einstellungen.</p><ul>{28}    </ul></section>\n    </div>"
],
"<div class=\"pv-ad kid\"><button class=\"pv-row\" data-kid=\"{0}\" data-fam=\"{1}\"><span class=\"pv-face\">{2}</span>\n    <span class=\"pv-t\"><b>{3}{4}</b>\n      <small>⭐ {5} · 🔥 {6} {7} подряд · 📚 {8} {9} за неделю</small>\n      <small>{10}</small></span><span class=\"g-go\">▶</span></button>\n    <div class=\"pv-acts\"><button class=\"chip\" data-kguide=\"{11}\" data-fam=\"{12}\">🧭 Гайд</button><button class=\"chip\" data-kset=\"{13}\" data-fam=\"{14}\">⚙️ Настройки, интересы, голос</button></div></div>": [
"<div class=\"pv-ad kid\"><button class=\"pv-row\" data-kid=\"{0}\" data-fam=\"{1}\"><span class=\"pv-face\">{2}</span>\n    <span class=\"pv-t\"><b>{3}{4}</b>\n      <small>⭐ {5} · 🔥 {6} {7} in a row · 📚 {8} {9} this week</small>\n      <small>{10}</small></span><span class=\"g-go\">▶</span></button>\n    <div class=\"pv-acts\"><button class=\"chip\" data-kguide=\"{11}\" data-fam=\"{12}\">🧭 Guide</button><button class=\"chip\" data-kset=\"{13}\" data-fam=\"{14}\">⚙️ Settings, interests, voice</button></div></div>",
"<div class=\"pv-ad kid\"><button class=\"pv-row\" data-kid=\"{0}\" data-fam=\"{1}\"><span class=\"pv-face\">{2}</span>\n    <span class=\"pv-t\"><b>{3}{4}</b>\n      <small>⭐ {5} · 🔥 {6} {7} seguidos · 📚 {8} {9} esta semana</small>\n      <small>{10}</small></span><span class=\"g-go\">▶</span></button>\n    <div class=\"pv-acts\"><button class=\"chip\" data-kguide=\"{11}\" data-fam=\"{12}\">🧭 Guia</button><button class=\"chip\" data-kset=\"{13}\" data-fam=\"{14}\">⚙️ Definições, interesses, voz</button></div></div>",
"<div class=\"pv-ad kid\"><button class=\"pv-row\" data-kid=\"{0}\" data-fam=\"{1}\"><span class=\"pv-face\">{2}</span>\n    <span class=\"pv-t\"><b>{3}{4}</b>\n      <small>⭐ {5} · 🔥 {6} {7} am Stück · 📚 {8} {9} diese Woche</small>\n      <small>{10}</small></span><span class=\"g-go\">▶</span></button>\n    <div class=\"pv-acts\"><button class=\"chip\" data-kguide=\"{11}\" data-fam=\"{12}\">🧭 Ratgeber</button><button class=\"chip\" data-kset=\"{13}\" data-fam=\"{14}\">⚙️ Einstellungen, Interessen, Stimme</button></div></div>"
],
"<div class=\"gd-card\" data-gk=\"{0}\">\n      <div class=\"gd-h\"><span class=\"chip-face\">{1}</span><b>{2}</b><small>{3} {4}</small></div>\n      <h3 class=\"gd-s\">📅 Неделя</h3><div class=\"gd-wk\">{5}</div>\n      <h3 class=\"gd-s\">💡 Совет на сегодня</h3><div class=\"gd-tip\"><small class=\"gd-ar\">{6}</small><p>{7}</p></div>\n      <button class=\"chip gd-next\" data-gnext=\"{8}\">🔄 Другой совет</button>\n      <h3 class=\"gd-s\">💬 О чём поговорить</h3>{9}\n      <h3 class=\"gd-s\">🛠️ Проект недели</h3><div class=\"gd-pj\"><p><span class=\"emo\">{10}</span> {11}</p>\n        {12}</div>\n    </div>": [
"<div class=\"gd-card\" data-gk=\"{0}\">\n      <div class=\"gd-h\"><span class=\"chip-face\">{1}</span><b>{2}</b><small>{3} {4}</small></div>\n      <h3 class=\"gd-s\">📅 The week</h3><div class=\"gd-wk\">{5}</div>\n      <h3 class=\"gd-s\">💡 Tip for today</h3><div class=\"gd-tip\"><small class=\"gd-ar\">{6}</small><p>{7}</p></div>\n      <button class=\"chip gd-next\" data-gnext=\"{8}\">🔄 Another tip</button>\n      <h3 class=\"gd-s\">💬 Something to talk about</h3>{9}\n      <h3 class=\"gd-s\">🛠️ Project of the week</h3><div class=\"gd-pj\"><p><span class=\"emo\">{10}</span> {11}</p>\n        {12}</div>\n    </div>",
"<div class=\"gd-card\" data-gk=\"{0}\">\n      <div class=\"gd-h\"><span class=\"chip-face\">{1}</span><b>{2}</b><small>{3} {4}</small></div>\n      <h3 class=\"gd-s\">📅 A semana</h3><div class=\"gd-wk\">{5}</div>\n      <h3 class=\"gd-s\">💡 Dica para hoje</h3><div class=\"gd-tip\"><small class=\"gd-ar\">{6}</small><p>{7}</p></div>\n      <button class=\"chip gd-next\" data-gnext=\"{8}\">🔄 Outra dica</button>\n      <h3 class=\"gd-s\">💬 Um assunto para conversar</h3>{9}\n      <h3 class=\"gd-s\">🛠️ Projeto da semana</h3><div class=\"gd-pj\"><p><span class=\"emo\">{10}</span> {11}</p>\n        {12}</div>\n    </div>",
"<div class=\"gd-card\" data-gk=\"{0}\">\n      <div class=\"gd-h\"><span class=\"chip-face\">{1}</span><b>{2}</b><small>{3} {4}</small></div>\n      <h3 class=\"gd-s\">📅 Die Woche</h3><div class=\"gd-wk\">{5}</div>\n      <h3 class=\"gd-s\">💡 Tipp für heute</h3><div class=\"gd-tip\"><small class=\"gd-ar\">{6}</small><p>{7}</p></div>\n      <button class=\"chip gd-next\" data-gnext=\"{8}\">🔄 Anderer Tipp</button>\n      <h3 class=\"gd-s\">💬 Gesprächsthema</h3>{9}\n      <h3 class=\"gd-s\">🛠️ Projekt der Woche</h3><div class=\"gd-pj\"><p><span class=\"emo\">{10}</span> {11}</p>\n        {12}</div>\n    </div>"
],
"<div class=\"gd-talk\"><p>{0}</p><small>{1} История «{2}»</small>{3}</div>": [
"<div class=\"gd-talk\"><p>{0}</p><small>{1} Story “{2}”</small>{3}</div>",
"<div class=\"gd-talk\"><p>{0}</p><small>{1} História «{2}»</small>{3}</div>",
"<div class=\"gd-talk\"><p>{0}</p><small>{1} Geschichte „{2}“</small>{3}</div>"
],
"Спросите: «{0}»": [
"Ask: “{0}”",
"Perguntem: «{0}»",
"Fragen Sie: „{0}“"
],
"Спросите, что запомнилось из истории «{0}»": [
"Ask what they remember from the story “{0}”",
"Perguntem do que se lembram da história «{0}»",
"Fragen Sie, woran sie sich aus der Geschichte „{0}“ erinnern"
],
"<div class=\"gd-talk\"><p>На этой неделе историй ещё не было. Послушайте одну вместе в разделе «Узнаём», а потом спросите, что удивило больше всего.</p></div>": [
"<div class=\"gd-talk\"><p>There have been no stories this week yet. Listen to one together in the “Find out” section, then ask what surprised them most.</p></div>",
"<div class=\"gd-talk\"><p>Esta semana ainda não houve histórias. Ouçam uma juntos na secção «Descobrir» e depois perguntem o que mais os surpreendeu.</p></div>",
"<div class=\"gd-talk\"><p>In dieser Woche gab es noch keine Geschichten. Hören Sie gemeinsam eine im Bereich „Entdecken“ an und fragen Sie dann, was am meisten überrascht hat.</p></div>"
],
"<p class=\"gd-done\">✅ Сделали! Награда «Мастер дела» — в наградах ребёнка.</p>": [
"<p class=\"gd-done\">✅ Done! The “Master of Doing” award is in your child’s awards.</p>",
"<p class=\"gd-done\">✅ Feito! O prémio «Mestre de Projetos» está nos prémios da criança.</p>",
"<p class=\"gd-done\">✅ Geschafft! Die Auszeichnung „Meister der Tat“ finden Sie bei den Auszeichnungen Ihres Kindes.</p>"
],
"<button class=\"big gd-did\" data-gdid=\"{0}\" data-gpj=\"{1}\">🎉 Сделали!</button><small class=\"muted\">Фото, если снимете, остаются на вашем телефоне — в игру ничего не загружается.</small>": [
"<button class=\"big gd-did\" data-gdid=\"{0}\" data-gpj=\"{1}\">🎉 We did it!</button><small class=\"muted\">Any photos you take stay on your phone; nothing is uploaded to the game.</small>",
"<button class=\"big gd-did\" data-gdid=\"{0}\" data-gpj=\"{1}\">🎉 Fizemos!</button><small class=\"muted\">Se tirarem fotografias, ficam no vosso telemóvel: nada é enviado para o jogo.</small>",
"<button class=\"big gd-did\" data-gdid=\"{0}\" data-gpj=\"{1}\">🎉 Geschafft!</button><small class=\"muted\">Fotos, falls Sie welche machen, bleiben auf Ihrem Handy: Es wird nichts in das Spiel hochgeladen.</small>"
],
"<small class=\"muted\">Отметить «Сделали!» можно на телефоне ребёнка, в «Для взрослых».</small>": [
"<small class=\"muted\">You can tick “We did it!” on your child’s phone, under “For grown-ups”.</small>",
"<small class=\"muted\">Podem marcar «Fizemos!» no telemóvel da criança, em «Para adultos».</small>",
"<small class=\"muted\">„Geschafft!“ können Sie auf dem Handy Ihres Kindes unter „Für Erwachsene“ abhaken.</small>"
],
"<p class=\"lead\">Добавьте ребёнка в семью — и здесь появится гайд.</p>": [
"<p class=\"lead\">Add your child to the family and the guide will appear here.</p>",
"<p class=\"lead\">Adicionem a criança à família e o guia aparece aqui.</p>",
"<p class=\"lead\">Fügen Sie Ihr Kind zur Familie hinzu, dann erscheint hier der Ratgeber.</p>"
],
"<p class=\"lead\">Гайд появится, когда телефон детей пришлёт новости о неделе.</p>": [
"<p class=\"lead\">The guide will appear when the children’s phone sends news of the week.</p>",
"<p class=\"lead\">O guia aparece quando o telemóvel das crianças enviar as novidades da semana.</p>",
"<p class=\"lead\">Der Ratgeber erscheint, sobald das Handy der Kinder die Neuigkeiten der Woche schickt.</p>"
],
"<details class=\"gd-ans\" data-gst=\"{0}\"><summary>Ответ из истории</summary><p></p></details>": [
"<details class=\"gd-ans\" data-gst=\"{0}\"><summary>Answer from the story</summary><p></p></details>",
"<details class=\"gd-ans\" data-gst=\"{0}\"><summary>Resposta da história</summary><p></p></details>",
"<details class=\"gd-ans\" data-gst=\"{0}\"><summary>Antwort aus der Geschichte</summary><p></p></details>"
],
"🔢 Математика": [
"🔢 Maths",
"🔢 Matemática",
"🔢 Mathe"
],
"🗣️ Речь": [
"🗣️ Speech",
"🗣️ Fala",
"🗣️ Sprechen"
],
"📖 Чтение": [
"📖 Reading",
"📖 Leitura",
"📖 Lesen"
],
"🧩 Логика": [
"🧩 Logic",
"🧩 Lógica",
"🧩 Logik"
],
"🌍 Мир вокруг": [
"🌍 The world around us",
"🌍 O mundo à nossa volta",
"🌍 Die Welt um uns herum"
],
"🏡 Жизнь": [
"🏡 Life",
"🏡 Vida",
"🏡 Leben"
],
"🌱 Неделя только началась. Как только {0} поиграет, здесь появятся успехи.": [
"🌱 The week has only just begun. As soon as {0} plays, the successes will appear here.",
"🌱 A semana mal começou. Assim que {0} jogar, os sucessos aparecem aqui.",
"🌱 Die Woche hat gerade erst begonnen. Sobald {0} gespielt hat, erscheinen hier die Erfolge."
],
"🎯 Дней с занятиями: {0} из 7{1}": [
"🎯 Days with practice: {0} of 7{1}",
"🎯 Dias com atividade: {0} de 7{1}",
"🎯 Tage mit Übung: {0} von 7{1}"
],
" · ⭐ {0} за неделю": [
" · ⭐ {0} this week",
" · ⭐ {0} esta semana",
" · ⭐ {0} diese Woche"
],
"математика — новый уровень «{0}»": [
"maths — new level “{0}”",
"matemática — novo nível «{0}»",
"Mathe — neue Stufe „{0}“"
],
"счёты — уровень {0}": [
"abacus — level {0}",
"ábaco — nível {0}",
"Rechenrahmen — Stufe {0}"
],
"олимпиада — решено задач: {0}": [
"olympiad — problems solved: {0}",
"olimpíada — problemas resolvidos: {0}",
"Olympiade — gelöste Aufgaben: {0}"
],
"чтение — {0} слов в минуту": [
"reading — {0} words a minute",
"leitura — {0} palavras por minuto",
"Lesen — {0} Wörter pro Minute"
],
"чтение — новый уровень": [
"reading — a new level",
"leitura — um novo nível",
"Lesen — eine neue Stufe"
],
"✅ Освоено: ": [
"✅ Mastered: ",
"✅ Dominado: ",
"✅ Geschafft: "
],
"🔢 Математика: «{0}»": [
"🔢 Maths: “{0}”",
"🔢 Matemática: «{0}»",
"🔢 Mathe: „{0}“"
],
"историй: {0}": [
"stories: {0}",
"histórias: {0}",
"Geschichten: {0}"
],
"игр: {0}": [
"games: {0}",
"jogos: {0}",
"Spiele: {0}"
],
"занятий речью: {0}": [
"speech practices: {0}",
"atividades de fala: {0}",
"Sprechübungen: {0}"
],
"чтений: {0}": [
"readings: {0}",
"leituras: {0}",
"Leseeinheiten: {0}"
],
"🎧 За неделю — ": [
"🎧 This week: ",
"🎧 Esta semana: ",
"🎧 Diese Woche: "
],
"🌱 Пока трудно: «{0}» — уже {1} {2} на этом уровне. Это нормально: помогут короткие примеры в жизни, без спешки.": [
"🌱 Hard for now: “{0}” — already {1} {2} at this level. That is normal: short everyday examples will help, with no rush.",
"🌱 Ainda difícil: «{0}» — já há {1} {2} neste nível. É normal: ajudam exemplos curtos do dia a dia, sem pressa.",
"🌱 Noch schwierig: „{0}“ — schon seit {1} {2} auf dieser Stufe. Das ist normal: Kurze Beispiele aus dem Alltag helfen, ohne Eile."
],
"день": [
"day",
"dia",
"Tag"
],
"дня": [
"days",
"dias",
"Tage"
],
"дней": [
"days",
"dias",
"Tage"
],
"🗣️ Звуки сейчас: {0}": [
"🗣️ Sounds right now: {0}",
"🗣️ Sons neste momento: {0}",
"🗣️ Laute im Moment: {0}"
],
"год": [
"year",
"ano",
"Jahr"
],
"года": [
"years",
"anos",
"Jahre"
],
"лет": [
"years",
"anos",
"Jahre"
],
"Гайд": [
"Guide",
"Guia",
"Ratgeber"
],
"неделя, совет на сегодня, проект": [
"week, tip for today, project",
"semana, dica para hoje, projeto",
"Woche, Tipp für heute, Projekt"
],
"За обедом попросите разложить ложки: «Нас четверо — сколько ложек нужно?»": [
"At lunch, ask your child to lay out the spoons: “There are four of us. How many spoons do we need?”",
"Ao almoço, peçam à criança que ponha as colheres na mesa: «Somos quatro. Quantas colheres são precisas?»",
"Bitten Sie Ihr Kind beim Mittagessen, die Löffel zu verteilen: „Wir sind vier. Wie viele Löffel brauchen wir?“"
],
"На прогулке считайте вместе: сколько собак, сколько красных машин до угла.": [
"On a walk, count together: how many dogs, how many red cars before the corner?",
"Num passeio, contem juntos: quantos cães, quantos carros vermelhos até à esquina?",
"Zählen Sie beim Spaziergang zusammen: Wie viele Hunde, wie viele rote Autos bis zur Ecke?"
],
"Поднимаясь по лестнице, считайте ступеньки вслух, а вниз — обратно.": [
"Count the steps out loud on the way up the stairs, and back down again.",
"Contem os degraus em voz alta ao subir as escadas, e ao descer também.",
"Zählen Sie die Stufen beim Treppensteigen laut mit, hinauf und wieder hinunter."
],
"Покажите на пальцах число — пусть ребёнок покажет столько же на своих.": [
"Show a number on your fingers and let your child show the same on theirs.",
"Mostrem um número pelos dedos e peçam à criança que mostre o mesmo nos dela.",
"Zeigen Sie eine Zahl mit den Fingern, und Ihr Kind zeigt dieselbe Zahl mit seinen."
],
"В вазе 5 яблок, одно съели. Спросите: «Сколько осталось?» — и проверьте, пересчитав.": [
"There are 5 apples in the bowl and one was eaten. Ask, “How many are left?” and check by counting.",
"Há 5 maçãs na taça e uma foi comida. Perguntem: «Quantas ficaram?» e confirmem contando.",
"In der Schale liegen 5 Äpfel, einer wurde gegessen. Fragen Sie: „Wie viele sind noch da?“ und zählen Sie nach."
],
"Игра «сколько спряталось»: 7 пуговиц, часть под ладонью — сколько под ней?": [
"Play “how many are hiding”: 7 buttons, some under your hand. How many are under it?",
"Brinquem aos «quantos estão escondidos»: 7 botões, alguns debaixo da mão. Quantos estão lá?",
"Spielen Sie „Wie viele sind versteckt?“: 7 Knöpfe, ein Teil unter Ihrer Hand. Wie viele sind es darunter?"
],
"В магазине спросите: «Было 10 евро, хлеб стоит 3 — сколько осталось?»": [
"In the shop, ask: “We had $10 and the bread costs $3. How much is left?”",
"Na loja, perguntem: «Tínhamos 10 euros e o pão custa 3. Quanto sobra?»",
"Fragen Sie im Laden: „Wir hatten 10 Euro, das Brot kostet 3. Wie viel bleibt übrig?“"
],
"Бросайте два кубика и складывайте точки: кто первым наберёт 30?": [
"Roll two dice and add up the dots: who gets to 30 first?",
"Lancem dois dados e somem os pontos: quem chega primeiro a 30?",
"Würfeln Sie mit zwei Würfeln und zählen Sie die Augen zusammen: Wer erreicht zuerst 30?"
],
"Пока моете руки, посчитайте вместе от 20 назад до нуля.": [
"While you wash your hands, count backwards together from 20 to zero.",
"Enquanto lavam as mãos, contem juntos de 20 até zero.",
"Zählen Sie beim Händewaschen gemeinsam von 20 rückwärts bis null."
],
"Игра «пара до десяти»: вы говорите 7 — ребёнок отвечает 3; вы 4 — он 6.": [
"Play “pairs to ten”: you say 7 and your child answers 3; you say 4 and they say 6.",
"Brinquem aos «pares até dez»: vocês dizem 7 e a criança responde 3; vocês dizem 4 e ela diz 6.",
"Spielen Sie „Paare bis zehn“: Sie sagen 7, Ihr Kind antwortet 3; Sie sagen 4, es sagt 6."
],
"В автобусе: «На остановке вошли четверо, вышли двое — сколько стало?» Придумывайте по очереди.": [
"On the bus: “Four people got on at the stop and two got off. How many now?” Take turns making them up.",
"No autocarro: «Entraram quatro pessoas na paragem e saíram duas. Quantas ficaram?» Inventem à vez.",
"Im Bus: „An der Haltestelle sind vier eingestiegen und zwei ausgestiegen. Wie viele sind es jetzt?“ Denken Sie sich abwechselnd Aufgaben aus."
],
"Сложите на столе 8 и 5 монеток: сначала доберите до десяти, потом прибавьте остаток.": [
"Put 8 and 5 coins on the table: first top up to ten, then add what is left.",
"Ponham 8 e 5 moedas na mesa: primeiro completem dez, depois somem o que sobra.",
"Legen Sie 8 und 5 Münzen auf den Tisch: Erst auf zehn auffüllen, dann den Rest dazuzählen."
],
"Загадайте: «Я задумал число, прибавил 3, получилось 9». Пусть угадает — потом поменяйтесь.": [
"Say, “I thought of a number, added 3 and got 9.” Let your child guess it, then swap.",
"Digam: «Pensei num número, somei 3 e deu 9.» A criança que adivinhe, e depois trocam.",
"Sagen Sie: „Ich habe mir eine Zahl gedacht, 3 dazugezählt, und es kam 9 heraus.“ Ihr Kind rät, dann tauschen Sie."
],
"Посмотрите на ценники в магазине: что дороже и на сколько?": [
"Look at the price tags in the shop: which costs more, and by how much?",
"Vejam as etiquetas de preços na loja: o que custa mais e quanto mais?",
"Schauen Sie im Laden auf die Preisschilder: Was ist teurer, und um wie viel?"
],
"Идите по улице и читайте номера домов: какой будет следующим? Почему с одной стороны только чётные?": [
"Walk down the street reading the house numbers: which one comes next? Why are there only even numbers on one side?",
"Passeiem na rua a ler os números das portas: qual é o seguinte? Porque é que de um lado só há números pares?",
"Lesen Sie beim Gehen die Hausnummern: Welche kommt als Nächste? Warum gibt es auf einer Seite nur gerade Zahlen?"
],
"Посчитайте мелочь в копилке: сначала десятками, потом единицами.": [
"Count the coins in the piggy bank: first the tens, then the ones.",
"Contem as moedas do mealheiro: primeiro as dezenas, depois as unidades.",
"Zählen Sie das Kleingeld in der Spardose: erst die Zehner, dann die Einer."
],
"Измерьте рост всей семьи рулеткой: кто выше и на сколько сантиметров?": [
"Measure everyone’s height with a tape measure: who is taller, and by how many centimetres?",
"Meçam a altura de toda a família com uma fita métrica: quem é mais alto e por quantos centímetros?",
"Messen Sie die Größe der ganzen Familie mit dem Maßband: Wer ist größer, und um wie viele Zentimeter?"
],
"Ищите умножение вокруг: сколько ножек у трёх стульев? Сколько колёс у пяти велосипедов?": [
"Look for multiplying all around: how many legs do three chairs have? How many wheels do five bicycles have?",
"Procurem a multiplicação à vossa volta: quantas pernas têm três cadeiras? Quantas rodas têm cinco bicicletas?",
"Suchen Sie das Malnehmen im Alltag: Wie viele Beine haben drei Stühle? Wie viele Räder haben fünf Fahrräder?"
],
"Яйца в коробке лежат рядами: 2 ряда по 5 — сколько всего? Найдите такие же «прямоугольники» в плитке и окнах.": [
"Eggs in a box lie in rows: 2 rows of 5, how many in all? Find the same “rectangles” in tiles and windows.",
"Os ovos na caixa estão em filas: 2 filas de 5, quantos ao todo? Procurem os mesmos «retângulos» em azulejos e janelas.",
"Eier im Karton liegen in Reihen: 2 Reihen mit je 5, wie viele sind es zusammen? Suchen Sie solche „Rechtecke“ in Fliesen und Fenstern."
],
"В дороге проверяйте таблицу умножения: один говорит пример, другой — ответ, потом наоборот.": [
"On the road, practise the times tables: one says a sum, the other the answer, then swap.",
"Na estrada, treinem a tabuada: um diz a conta, o outro a resposta, e depois trocam.",
"Üben Sie unterwegs das Einmaleins: Einer nennt die Aufgabe, der andere das Ergebnis, dann tauschen Sie."
],
"Разделите печенье поровну на всех за столом: сколько каждому и сколько лишних?": [
"Share the biscuits equally among everyone at the table: how many does each person get, and how many are left over?",
"Dividam as bolachas por todos à mesa: quantas cabem a cada um e quantas sobram?",
"Teilen Sie die Kekse gerecht unter allen am Tisch auf: Wie viele bekommt jeder, und wie viele bleiben übrig?"
],
"Попросите придумать задачу про вашу семью — и решите её вместе за ужином.": [
"Ask your child to make up a problem about your family, and solve it together at supper.",
"Peçam à criança que invente um problema sobre a vossa família e resolvam-no juntos ao jantar.",
"Bitten Sie Ihr Kind, eine Aufgabe über Ihre Familie zu erfinden, und lösen Sie sie beim Abendessen gemeinsam."
],
"Дайте ребёнку самому заплатить за покупку и проверить сдачу.": [
"Let your child pay for something and check the change.",
"Deixem a criança pagar uma compra e conferir o troco.",
"Lassen Sie Ihr Kind selbst bezahlen und das Wechselgeld nachprüfen."
],
"По часам: «Сейчас 17:40, выходим в 18:15 — сколько минут на сборы?»": [
"By the clock: “It is 5:40 now and we leave at 6:15. How many minutes do we have to get ready?”",
"Pelo relógio: «Agora são 17:40 e saímos às 18:15. Quantos minutos temos para nos preparar?»",
"Nach der Uhr: „Es ist jetzt 17:40, wir gehen um 18:15. Wie viele Minuten haben wir zum Fertigmachen?“"
],
"Распланируйте вечер вместе: ужин в 19:00 на полчаса, книжка 20 минут — во сколько спать?": [
"Plan the evening together: supper at 7:00 for half an hour, a book for 20 minutes. What time is bedtime?",
"Planeiem a noite juntos: jantar às 19:00 durante meia hora, um livro durante 20 minutos. A que horas é deitar?",
"Planen Sie den Abend gemeinsam: Abendessen um 19:00 Uhr für eine halbe Stunde, Buch 20 Minuten. Wann ist Schlafenszeit?"
],
"Когда готовите, попросите отмерить половину стакана муки и четверть ложки соли.": [
"When you cook, ask your child to measure out half a cup of flour and a quarter of a spoon of salt.",
"Ao cozinhar, peçam à criança que meça meia chávena de farinha e um quarto de colher de sal.",
"Bitten Sie Ihr Kind beim Kochen, eine halbe Tasse Mehl und einen Viertel Löffel Salz abzumessen."
],
"Разрежьте яблоко на 4 части, съешьте одну: какая часть осталась?": [
"Cut an apple into 4 parts and eat one: what part is left?",
"Cortem uma maçã em 4 partes e comam uma: que parte sobrou?",
"Schneiden Sie einen Apfel in 4 Teile und essen Sie eins: Welcher Teil ist übrig?"
],
"Шоколадка из 12 долек: сколько долек в трети? А в четверти?": [
"A chocolate bar has 12 squares: how many squares are in a third? And in a quarter?",
"Uma tablete de chocolate tem 12 quadrados: quantos há num terço? E num quarto?",
"Eine Tafel Schokolade hat 12 Stücke: Wie viele sind ein Drittel? Und ein Viertel?"
],
"Сложите чек в уме, округляя каждую цену до целого, — потом сверьтесь с кассой.": [
"Add up the shopping bill in your head, rounding each price to a whole number, then check it at the till.",
"Somem a conta das compras de cabeça, arredondando cada preço para o inteiro mais próximo, e depois confiram na caixa.",
"Rechnen Sie den Kassenzettel im Kopf zusammen und runden Sie jeden Preis auf eine ganze Zahl. Dann vergleichen Sie an der Kasse."
],
"Посмотрите на карте, сколько километров до бабушки, и прикиньте, сколько часов ехать.": [
"Look at a map to see how many kilometres it is to Grandma’s, and guess how many hours the drive will take.",
"Vejam num mapa quantos quilómetros são até casa da avó e estimem quantas horas dura a viagem.",
"Schauen Sie auf der Karte, wie viele Kilometer es bis zu Oma sind, und schätzen Sie, wie viele Stunden die Fahrt dauert."
],
"Сравните две упаковки: какая выгоднее, если посчитать цену за килограмм?": [
"Compare two packs: which is better value when you work out the price per kilo?",
"Comparem duas embalagens: qual compensa mais se calcularem o preço por quilo?",
"Vergleichen Sie zwei Packungen: Welche ist günstiger, wenn Sie den Preis pro Kilo ausrechnen?"
],
"Посчитайте покупку: 3 пакета молока по 2 евро и хлеб за 1 евро — сколько всего?": [
"Add up a shop: 3 cartons of milk at $2 each and a loaf for $1. How much is that altogether?",
"Somem uma compra: 3 pacotes de leite a 2 euros cada e um pão a 1 euro. Quanto dá ao todo?",
"Rechnen Sie einen Einkauf zusammen: 3 Packungen Milch zu je 2 Euro und ein Brot für 1 Euro. Wie viel ist das zusammen?"
],
"Задачка за ужином: «Сколько концов у трёх палок? А у трёх с половиной?»": [
"A puzzle for supper: “How many ends do three sticks have? And three and a half?”",
"Um desafio ao jantar: «Quantas pontas têm três paus? E três paus e meio?»",
"Ein Rätsel fürs Abendessen: „Wie viele Enden haben drei Stöcke? Und dreieinhalb?“"
],
"Головоломка: как отмерить 4 литра воды, если есть ведро на 3 литра и ведро на 5?": [
"A brain teaser: how do you measure out 4 litres of water if you have a 3-litre bucket and a 5-litre bucket?",
"Um quebra-cabeças: como medir 4 litros de água se têm um balde de 3 litros e outro de 5?",
"Eine Knobelei: Wie messen Sie 4 Liter Wasser ab, wenn Sie einen 3-Liter-Eimer und einen 5-Liter-Eimer haben?"
],
"В машине скажите вместе скороговорку: «Тридцать три корабля лавировали, лавировали, да не вылавировали». Медленно — это не стыдно.": [
"In the car, say a tongue-twister together: “Red lorry, yellow lorry.” Go slowly. There is nothing to be shy about.",
"No carro, digam juntos um trava-línguas: «O rato roeu a roupa do rei de Roma.» Devagar, não há vergonha nenhuma.",
"Sagen Sie im Auto gemeinsam einen Zungenbrecher: „Brautkleid bleibt Brautkleid und Blaukraut bleibt Blaukraut.“ Langsam, das ist nicht peinlich."
],
"Порычите вместе, как тигры: кто дольше протянет «р-р-р»?": [
"Growl together like tigers: who can hold the “rrr” longest?",
"Rosnem juntos como tigres: quem aguenta o «rrr» durante mais tempo?",
"Brummen Sie gemeinsam wie Tiger: Wer hält das „rrr“ am längsten?"
],
"Игра «заведи мотор»: «д-д-д-р-р-р» — и поехали по комнате.": [
"Play “start the engine”: “d-d-d-rrr”, and off you go round the room.",
"Brinquem a «ligar o motor»: «d-d-d-rrr», e lá vão pela sala.",
"Spielen Sie „Motor anlassen“: „d-d-d-rrr“, und schon fahren Sie durchs Zimmer."
],
"Найдите дома пять вещей со звуком Р: ручка, ковёр, рубашка…": [
"Find five things at home with the R sound: rug, ribbon, rabbit…",
"Encontrem em casa cinco coisas com o som R: rato, roupa, rádio, rolha…",
"Finden Sie zu Hause fünf Dinge mit dem R-Laut: Rock, Ring, Rose, Rucksack …"
],
"Попросите ребёнка научить игрушку говорить «Р»: объяснять — лучший способ выучить самому.": [
"Ask your child to teach a toy to say “R”: explaining is the best way to learn it yourself.",
"Peçam à criança que ensine um brinquedo a dizer «R»: explicar é a melhor maneira de aprender.",
"Bitten Sie Ihr Kind, einem Kuscheltier das „R“ beizubringen: Erklären ist der beste Weg, es selbst zu lernen."
],
"Скороговорка на прогулке: «На горе Арарат растёт крупный виноград».": [
"A tongue-twister for a walk: “Round the rugged rock the ragged rascal ran.”",
"Um trava-línguas para o passeio: «Três pratos de trigo para três tigres tristes.»",
"Ein Zungenbrecher für den Spaziergang: „Rote Rübe, rote Rübe, rote Rübe.“"
],
"Не поправляйте каждое слово: похвалите, когда Р получилось, а трудное слово просто повторите правильно сами.": [
"Don’t correct every word: praise your child when the R comes out, and just say the hard word correctly yourself.",
"Não corrijam cada palavra: elogiem quando o R sair bem e, perante uma palavra difícil, limitem-se a repeti-la corretamente.",
"Verbessern Sie nicht jedes Wort: Loben Sie, wenn das R gelungen ist, und sagen Sie das schwierige Wort einfach selbst richtig vor."
],
"Скороговорка в дорогу: «Галка села на палку, палка ударила галку».": [
"A tongue-twister for the road: “Red leather, yellow leather.”",
"Um trava-línguas para a viagem: «A lula lambeu a lua cheia.»",
"Ein Zungenbrecher für unterwegs: „Blaukraut bleibt Blaukraut.“"
],
"Пусть язык «покрасит потолок»: широкий кончик за верхними зубами — вперёд и назад.": [
"Let your tongue “paint the ceiling”: the wide tip goes behind the top teeth, forwards and backwards.",
"Deixem a língua «pintar o teto»: a ponta larga vai atrás dos dentes de cima, para a frente e para trás.",
"Die Zunge „streicht die Decke“: Die breite Spitze fährt hinter den oberen Zähnen vor und zurück."
],
"Игра в пароход: «ы-л-л-л» — гудит пароход и плывёт по ванне.": [
"Play steamboat: “ooo-lll”, the steamboat hoots and sails across the bath.",
"Brinquem ao barco a vapor: «uuu-lll», o barco apita e navega pela banheira.",
"Spielen Sie Dampfer: „uuu-lll“, der Dampfer tutet und fährt durch die Badewanne."
],
"В магазине ищите слова со звуком Л: лук, молоко, булка. Пусть ребёнок называет сам.": [
"In the shop, look for words with the L sound: lemon, milk, lolly. Let your child say them.",
"Na loja, procurem palavras com o som L: leite, limão, luvas. A criança que as diga.",
"Suchen Sie im Laden Wörter mit dem L-Laut: Linsen, Milch, Limonade. Ihr Kind sagt sie selbst."
],
"Спойте любимую песенку на «ла-ла-ла» — громко и протяжно.": [
"Sing a favourite song to “la-la-la”, loud and long.",
"Cantem uma canção preferida só com «lá-lá-lá», bem alto e bem comprido.",
"Singen Sie ein Lieblingslied auf „la-la-la“, laut und lang gezogen."
],
"Скороговорка: «Мила ела белый хлеб, а Алла — пол-яблока».": [
"A tongue-twister: “Lucy lit a little lamp, and Larry lit a lantern.”",
"Um trava-línguas: «O lobo lava a louça e a Lola lê no sol.»",
"Ein Zungenbrecher: „Lange Leitern leiten Leute langsam.“"
],
"Накачайте «насос»: «с-с-с» — надули шарик, а «з-з-з» — летит комар.": [
"Pump up the “pump”: “sss” blows up the balloon, and “zzz” is a mosquito flying.",
"Encham a «bomba»: «sss» enche o balão e «zzz» é um mosquito a voar.",
"Pumpen Sie mit der „Luftpumpe“: „ssss“ bläst den Ballon auf, und ein summendes „sss“ ist eine Mücke im Flug."
],
"Скороговорка: «У осы не усы, не усищи, а усики».": [
"A tongue-twister: “Sister Susie sat sewing shirts for soldiers.”",
"Um trava-línguas: «Sete sapos sentados no sofá.»",
"Ein Zungenbrecher: „Zehn Ziegen ziehen zehn Zentner Zucker zum Zoo.“"
],
"Ищите в комнате вещи со звуком С: стол, стул, сок, носок.": [
"Look for things with the S sound in the room: sock, spoon, sofa, soap.",
"Procurem na sala coisas com o som S: sapato, sopa, sofá, sabonete.",
"Suchen Sie im Zimmer Dinge mit dem S-Laut: Sofa, Socke, Seife, Sessel."
],
"Улыбнитесь у зеркала и скажите «с-с-с»: язык прячется за нижними зубами.": [
"Smile in the mirror and say “sss”: the tongue hides behind the bottom teeth.",
"Sorriam ao espelho e digam «sss»: a língua esconde-se atrás dos dentes de baixo.",
"Lächeln Sie im Spiegel und sagen Sie „sss“: Die Zunge versteckt sich hinter den unteren Zähnen."
],
"Игра «комар и оса»: на «з» ребёнок машет руками, на «с» — замирает.": [
"Play “mosquito and wasp”: on “z” your child waves their arms, on “s” they freeze.",
"Brinquem ao «mosquito e vespa»: no «z» a criança agita os braços, no «s» fica quieta.",
"Spielen Sie „Mücke und Wespe“: Bei einem summenden „sss“ wedelt Ihr Kind mit den Armen, bei einem zischenden „ssss“ erstarrt es."
],
"Скороговорка: «Шла Саша по шоссе и сосала сушку».": [
"A tongue-twister: “She sells seashells on the seashore.”",
"Um trava-línguas: «A chuva chove, chove, chove sem parar.»",
"Ein Zungenbrecher: „Fischers Fritz fischt frische Fische.“"
],
"Сдувайте «шарик» вместе: «ш-ш-ш» — кто дольше?": [
"Let the “balloon” down together: “shhh”. Who can go on longest?",
"Esvaziem juntos o «balão»: «chhh». Quem aguenta mais tempo?",
"Lassen Sie gemeinsam die Luft aus dem „Ballon“: „schhh“. Wer schafft es am längsten?"
],
"Изобразите поезд: «ч-ч-ч» — колёса, «ш-ш-ш» — пар.": [
"Be a train: “ch-ch-ch” for the wheels, “shhh” for the steam.",
"Sejam um comboio: «tch-tch-tch» são as rodas, «chhh» é o vapor.",
"Spielen Sie Eisenbahn: „tsch-tsch-tsch“ sind die Räder, „schhh“ ist der Dampf."
],
"На кухне ищите слова с Ш и Ж: каша, ложка, жёлудь, ножик.": [
"In the kitchen, look for words with Sh and Zh: dish, fish, squash, measure.",
"Na cozinha, procurem palavras com Ch e J: chávena, chá, jarro, laranja.",
"Suchen Sie in der Küche Wörter mit Sch: Schüssel, Schinken, Tasche, Fisch."
],
"Жук жужжит: «ж-ж-ж» — летайте по комнате и садитесь на «цветок».": [
"A beetle buzzes: “zzz”. Fly round the room and land on a “flower”.",
"Um besouro zumbe: «zzz». Voem pela sala e pousem numa «flor».",
"Ein Käfer summt: „summ, summ“. Fliegen Sie durchs Zimmer und landen Sie auf einer „Blume“."
],
"Скороговорка: «Щеткой чищу я щенка, щекочу ему бока».": [
"A tongue-twister: “Fresh fried fish, fresh fried fish, fresh fried fish.”",
"Um trava-línguas: «O chefe chama o Chico para a chávena de chá.»",
"Ein Zungenbrecher: „Schnell schnitzt Schmidt schöne Schilder.“"
],
"Задуйте свечку издалека или подуйте на кораблик в ванне: длинный выдох помогает звукам.": [
"Blow out a candle from far away, or blow a little boat across the bath: one long breath helps the sounds.",
"Apaguem uma vela à distância ou soprem um barquinho na banheira: um sopro comprido ajuda os sons.",
"Pusten Sie eine Kerze aus der Ferne aus oder ein Schiffchen durch die Badewanne: Ein langer Atem hilft den Lauten."
],
"Пускайте мыльные пузыри: ровный долгий выдох — большой пузырь.": [
"Blow soap bubbles: one steady, long breath makes a big bubble.",
"Façam bolas de sabão: um sopro longo e constante faz uma bola grande.",
"Machen Sie Seifenblasen: Ein gleichmäßiger, langer Atem macht eine große Blase."
],
"Рассказывайте друг другу, как прошёл день: по три предложения по очереди.": [
"Tell each other about your day, three sentences each, taking turns.",
"Contem um ao outro como foi o dia: três frases cada um, à vez.",
"Erzählen Sie sich gegenseitig vom Tag: abwechselnd je drei Sätze."
],
"Корчите рожицы у зеркала: улыбка — трубочка, десять раз, кто смешнее.": [
"Pull faces in the mirror: a smile, a pretend straw, ten times each. Who is funnier?",
"Façam caretas ao espelho: um sorriso, uma «palhinha», dez vezes cada. Quem fica mais engraçado?",
"Schneiden Sie Grimassen im Spiegel: lächeln, Rüsselmund, je zehnmal. Wer ist lustiger?"
],
"Попросите пересказать мультфильм целиком — вы только кивайте и спрашивайте: «А потом?»": [
"Ask your child to retell a whole cartoon: you only nod and ask, “And then?”",
"Peçam à criança que conte um desenho animado inteiro: vocês só acenam e perguntam: «E depois?»",
"Bitten Sie Ihr Kind, einen ganzen Zeichentrickfilm nachzuerzählen: Sie nicken nur und fragen: „Und dann?“"
],
"На прогулке ищите буквы на вывесках: кто первым найдёт «М»?": [
"On a walk, look for letters on the signs: who spots an “M” first?",
"Num passeio, procurem letras nas tabuletas: quem vê primeiro um «M»?",
"Suchen Sie beim Spaziergang Buchstaben auf Schildern: Wer entdeckt zuerst ein „M“?"
],
"Слепите букву из пластилина или выложите её из макарон.": [
"Make a letter out of plasticine, or lay it out in pasta.",
"Façam uma letra com plasticina ou formem-na com massa.",
"Formen Sie einen Buchstaben aus Knete oder legen Sie ihn mit Nudeln."
],
"Напишите имя ребёнка крупно и повесьте на дверь его комнаты.": [
"Write your child’s name in big letters and hang it on their bedroom door.",
"Escrevam o nome da criança em letras grandes e pendurem-no na porta do quarto dela.",
"Schreiben Sie den Namen Ihres Kindes groß auf und hängen Sie ihn an die Zimmertür."
],
"Игра «первый звук»: «Мама» — какой звук первый? А в слове «кот»?": [
"Play “first sound”: “Mum”, which sound comes first? And in the word “cat”?",
"Brinquem ao «primeiro som»: «Mãe», qual é o primeiro som? E na palavra «gato»?",
"Spielen Sie „Erster Laut“: „Mama“, welcher Laut kommt zuerst? Und im Wort „Hund“?"
],
"Нарисуйте пальцем букву на спине ребёнка — пусть угадает какую.": [
"Draw a letter with your finger on your child’s back and let them guess which one it is.",
"Desenhem uma letra com o dedo nas costas da criança e peçam-lhe que adivinhe qual é.",
"Malen Sie mit dem Finger einen Buchstaben auf den Rücken Ihres Kindes. Es rät, welcher es ist."
],
"Прочитайте вместе вывеску у магазина — по слогам, не торопясь.": [
"Read the sign outside a shop together, one syllable at a time, without rushing.",
"Leiam juntos a tabuleta de uma loja, sílaba a sílaba, sem pressas.",
"Lesen Sie gemeinsam das Schild am Laden, Silbe für Silbe, ohne Eile."
],
"Прохлопайте слова по слогам: «ма-ши-на» — три хлопка. А «кот»?": [
"Clap out words in syllables: “ba-na-na” is three claps. And “cat”?",
"Batam palmas às sílabas das palavras: «ba-na-na» são três palmas. E «pé»?",
"Klatschen Sie Wörter in Silben: „Ba-na-ne“ sind drei Klatscher. Und „Hund“?"
],
"Найдите на упаковке короткое слово и прочитайте его вместе.": [
"Find a short word on a packet and read it together.",
"Encontrem uma palavra curta numa embalagem e leiam-na juntos.",
"Suchen Sie auf einer Packung ein kurzes Wort und lesen Sie es gemeinsam."
],
"Напишите записку из трёх слов и положите в карман: «Ты мой герой».": [
"Write a note of three words and slip it in a pocket: “You are my hero.”",
"Escrevam um bilhete com três palavras e ponham-no no bolso: «És o meu herói.»",
"Schreiben Sie einen Zettel mit drei Wörtern und stecken Sie ihn in die Tasche: „Du bist mein Held.“"
],
"Пусть ребёнок прочитает вам список покупок прямо в магазине.": [
"Let your child read you the shopping list right in the shop.",
"Deixem a criança ler a lista de compras mesmo na loja.",
"Lassen Sie Ihr Kind die Einkaufsliste direkt im Laden vorlesen."
],
"Перед сном читайте по очереди: строчку вы, строчку ребёнок.": [
"At bedtime, take turns reading: a line from you, a line from your child.",
"À hora de deitar, leiam à vez: uma linha vocês, uma linha a criança.",
"Lesen Sie vor dem Schlafen abwechselnd: eine Zeile Sie, eine Zeile Ihr Kind."
],
"Прочитайте вместе меню в кафе — пусть ребёнок выберет блюдо сам.": [
"Read the menu in a café together and let your child choose the dish.",
"Leiam juntos a ementa de um café e deixem a criança escolher o prato.",
"Lesen Sie die Speisekarte im Café gemeinsam und lassen Sie Ihr Kind das Gericht auswählen."
],
"Подпишите вместе коробки с игрушками: «машинки», «кубики», «куклы».": [
"Label the toy boxes together: “cars”, “bricks”, “dolls”.",
"Escrevam juntos as etiquetas das caixas dos brinquedos: «carros», «cubos», «bonecas».",
"Beschriften Sie gemeinsam die Spielzeugkisten: „Autos“, „Bausteine“, „Puppen“."
],
"В дороге читайте вместе названия улиц и остановок.": [
"On the road, read the street names and stops together.",
"Na estrada, leiam juntos os nomes das ruas e das paragens.",
"Lesen Sie unterwegs gemeinsam die Straßennamen und Haltestellen."
],
"Попросите прочитать вслух рецепт, пока вы вместе готовите.": [
"Ask your child to read the recipe out loud while you cook together.",
"Peçam à criança que leia a receita em voz alta enquanto cozinham juntos.",
"Bitten Sie Ihr Kind, beim gemeinsamen Kochen das Rezept laut vorzulesen."
],
"За ужином попросите пересказать главу книги, которую ребёнок читает сейчас.": [
"At supper, ask your child to retell the chapter of the book they are reading now.",
"Ao jantar, peçam à criança que conte o capítulo do livro que está a ler agora.",
"Bitten Sie Ihr Kind beim Abendessen, das Kapitel des Buches nachzuerzählen, das es gerade liest."
],
"Сходите в библиотеку: пусть ребёнок сам выберет книгу.": [
"Go to the library and let your child choose a book by themselves.",
"Vão à biblioteca e deixem a criança escolher um livro sozinha.",
"Gehen Sie in die Bücherei und lassen Sie Ihr Kind selbst ein Buch aussuchen."
],
"Обсудите героя книги: «Как бы ты поступил на его месте?»": [
"Talk about a character in a book: “What would you have done in their place?”",
"Conversem sobre uma personagem de um livro: «O que farias no lugar dela?»",
"Sprechen Sie über eine Figur aus einem Buch: „Was hättest du an ihrer Stelle getan?“"
],
"Пусть ребёнок прочитает сказку младшим — с выражением, разными голосами.": [
"Let your child read a story to younger children, with expression and different voices.",
"Peçam à criança que leia um conto aos mais pequenos, com expressão e várias vozes.",
"Lassen Sie Ihr Kind jüngeren Kindern ein Märchen vorlesen, mit Betonung und verschiedenen Stimmen."
],
"Почитайте вслух по ролям: каждый читает за своего героя.": [
"Read aloud in parts: everyone reads for their own character.",
"Leiam em voz alta por papéis: cada um lê a sua personagem.",
"Lesen Sie mit verteilten Rollen laut: Jeder liest für seine Figur."
],
"Разложите носки по парам — кто быстрее? Потом спрячьте один: какой пропал?": [
"Sort the socks into pairs: who is faster? Then hide one: which one has gone missing?",
"Juntem as meias aos pares: quem é mais rápido? Depois escondam uma: qual desapareceu?",
"Sortieren Sie Socken zu Paaren: Wer ist schneller? Dann verstecken Sie eine: Welche fehlt?"
],
"Игра «что изменилось»: ребёнок отворачивается, вы убираете одну вещь со стола.": [
"Play “what has changed”: your child turns away and you take one thing off the table.",
"Brinquem ao «o que mudou»: a criança vira-se de costas e vocês tiram uma coisa da mesa.",
"Spielen Sie „Was hat sich verändert?“: Ihr Kind dreht sich um, und Sie nehmen einen Gegenstand vom Tisch."
],
"Загадка за ужином: «Что тяжелее: килограмм ваты или килограмм железа?»": [
"A riddle for supper: “Which is heavier, a kilo of feathers or a kilo of iron?”",
"Uma adivinha ao jantar: «O que pesa mais, um quilo de penas ou um quilo de ferro?»",
"Ein Rätsel fürs Abendessen: „Was ist schwerer, ein Kilo Federn oder ein Kilo Eisen?“"
],
"Постройте из конструктора то, что нарисовано на картинке, — а потом наоборот: нарисуйте постройку.": [
"Build with bricks what is drawn in a picture, and then the other way round: draw what you built.",
"Construam com peças o que está desenhado numa imagem e depois ao contrário: desenhem o que construíram.",
"Bauen Sie mit Bausteinen nach, was auf einem Bild gezeichnet ist, und dann umgekehrt: Zeichnen Sie das Gebaute."
],
"Составьте вместе маршрут до парка: где поворачиваем, сколько перекрёстков?": [
"Plan the route to the park together: where do we turn, how many crossings are there?",
"Planeiem juntos o caminho até ao parque: onde viramos, quantos cruzamentos há?",
"Planen Sie gemeinsam den Weg zum Park: Wo biegen wir ab, wie viele Kreuzungen gibt es?"
],
"Сыграйте в «20 вопросов»: загадайте предмет, отвечать можно только «да» или «нет».": [
"Play “20 questions”: think of an object, and the only answers allowed are “yes” or “no”.",
"Joguem aos «20 perguntas»: pensem num objeto e só se pode responder «sim» ou «não».",
"Spielen Sie „20 Fragen“: Denken Sie sich einen Gegenstand aus, geantwortet wird nur mit „Ja“ oder „Nein“."
],
"Попросите придумать свою задачу-ловушку для мамы или папы.": [
"Ask your child to invent a trick puzzle for Mum or Dad.",
"Peçam à criança que invente um problema-armadilha para a mãe ou para o pai.",
"Bitten Sie Ihr Kind, ein Fangrätsel für Mama oder Papa zu erfinden."
],
"Сыграйте партию в шашки или шахматы и обсудите вслух один ход: «Почему сюда?»": [
"Play a game of draughts or chess and talk through one move out loud: “Why there?”",
"Joguem uma partida de damas ou de xadrez e falem em voz alta sobre uma jogada: «Porque aí?»",
"Spielen Sie eine Partie Dame oder Schach und besprechen Sie einen Zug laut: „Warum dorthin?“"
],
"Задачка: у отца три дочери, у каждой дочери есть брат. Сколько всего детей в семье?": [
"A puzzle: a father has three daughters and each daughter has a brother. How many children are there in all?",
"Um problema: um pai tem três filhas e cada filha tem um irmão. Quantos filhos há ao todo?",
"Ein Rätsel: Ein Vater hat drei Töchter, und jede Tochter hat einen Bruder. Wie viele Kinder sind es insgesamt?"
],
"Найдите на карте или глобусе место из последней истории.": [
"Find on a map or globe a place from the last story.",
"Procurem num mapa ou num globo um lugar da última história.",
"Suchen Sie auf einer Karte oder einem Globus einen Ort aus der letzten Geschichte."
],
"Нарисуйте вместе героя истории, которую ребёнок слушал на этой неделе.": [
"Draw together the hero of the story your child listened to this week.",
"Desenhem juntos o herói da história que a criança ouviu esta semana.",
"Zeichnen Sie gemeinsam die Hauptfigur der Geschichte, die Ihr Kind diese Woche gehört hat."
],
"Пусть ребёнок перескажет историю из игры кому-то из взрослых своими словами.": [
"Let your child retell a story from the game to one of the grown-ups in their own words.",
"Peçam à criança que conte a um adulto, pelas suas palavras, uma história do jogo.",
"Lassen Sie Ihr Kind einem Erwachsenen eine Geschichte aus dem Spiel mit eigenen Worten nacherzählen."
],
"Устройте «музей» на полке: три вещи из разных стран, ребёнок — экскурсовод.": [
"Set up a “museum” on a shelf: three things from different countries, and your child is the guide.",
"Montem um «museu» numa prateleira: três objetos de países diferentes, e a criança é o guia.",
"Richten Sie auf einem Regal ein „Museum“ ein: drei Dinge aus verschiedenen Ländern, und Ihr Kind ist der Führer."
],
"Посмотрите в окно на погоду и спросите: «Откуда берётся дождь?» Ответ найдите вместе.": [
"Look out of the window at the weather and ask, “Where does rain come from?” Find the answer together.",
"Olhem pela janela para o tempo e perguntem: «De onde vem a chuva?» Descubram a resposta juntos.",
"Schauen Sie aus dem Fenster aufs Wetter und fragen Sie: „Woher kommt der Regen?“ Finden Sie die Antwort gemeinsam."
],
"Дайте ребёнку одно домашнее дело на всю неделю: полить цветы или накормить кота.": [
"Give your child one household job for the whole week: watering the plants or feeding the cat.",
"Deem à criança uma tarefa de casa para a semana inteira: regar as plantas ou dar comida ao gato.",
"Geben Sie Ihrem Kind eine Aufgabe im Haushalt für die ganze Woche: die Blumen gießen oder die Katze füttern."
],
"Пусть ребёнок сам соберёт рюкзак на завтра по списку из картинок.": [
"Let your child pack their own bag for tomorrow from a list of pictures.",
"Deixem a criança preparar a sua mochila para amanhã a partir de uma lista de imagens.",
"Lassen Sie Ihr Kind seinen Rucksack für morgen selbst nach einer Bilderliste packen."
],
"Пусть ребёнок сам заведёт будильник и вечером проверит, что всё готово к утру.": [
"Let your child set their own alarm clock and check in the evening that all is ready for the morning.",
"Deixem a criança acertar o seu despertador e conferir à noite que tudo está pronto para a manhã.",
"Lassen Sie Ihr Kind selbst den Wecker stellen und abends prüfen, ob alles für den Morgen bereit ist."
],
"Вечером спросите: «Что сегодня было трудным? А что получилось?» Хвалите за старание, а не за результат.": [
"In the evening, ask, “What was hard today? And what went well?” Praise the effort, not the result.",
"À noite, perguntem: «O que foi difícil hoje? E o que correu bem?» Elogiem o esforço, não o resultado.",
"Fragen Sie abends: „Was war heute schwer? Und was ist dir gelungen?“ Loben Sie die Mühe, nicht das Ergebnis."
],
"Расскажите, чему вы сами сейчас учитесь и где ошибаетесь: ребёнку легче пробовать новое.": [
"Tell your child what you are learning right now and where you make mistakes: it makes trying new things easier.",
"Contem à criança o que vocês estão a aprender agora e onde erram: assim é mais fácil experimentar coisas novas.",
"Erzählen Sie Ihrem Kind, was Sie gerade selbst lernen und wo Sie Fehler machen: So fällt es ihm leichter, Neues zu probieren."
],
"Готовьте ужин вместе: помыть овощи, порезать мягкое, накрыть на стол.": [
"Cook supper together: washing the vegetables, cutting the soft ones, laying the table.",
"Preparem o jantar juntos: lavar os legumes, cortar os mais moles, pôr a mesa.",
"Kochen Sie das Abendessen gemeinsam: Gemüse waschen, Weiches schneiden, den Tisch decken."
],
"Договоритесь о маленькой цели на неделю и отмечайте её на холодильнике.": [
"Agree on a small goal for the week and mark it on the fridge.",
"Combinem um pequeno objetivo para a semana e marquem-no no frigorífico.",
"Vereinbaren Sie ein kleines Ziel für die Woche und halten Sie es am Kühlschrank fest."
],
"Позвоните вместе бабушке или дедушке: пусть ребёнок расскажет, что узнал нового.": [
"Ring Grandma or Grandad together: let your child tell them what they learnt that is new.",
"Liguem juntos à avó ou ao avô: a criança conta o que aprendeu de novo.",
"Rufen Sie gemeinsam Oma oder Opa an: Ihr Kind erzählt, was es Neues gelernt hat."
],
"Дайте ребёнку бюджет на семейный перекус и попросите уложиться в него.": [
"Give your child a budget for the family snack and ask them to stay within it.",
"Deem à criança um orçamento para o lanche da família e peçam-lhe que não o ultrapasse.",
"Geben Sie Ihrem Kind ein Budget für den Familiensnack und bitten Sie es, damit auszukommen."
],
"Перед сном поблагодарите друг друга за одно дело этого дня.": [
"At bedtime, thank each other for one thing from today.",
"Antes de dormir, agradeçam um ao outro por uma coisa de hoje.",
"Bedanken Sie sich vor dem Schlafen gegenseitig für eine Sache von heute."
],
"Когда что-то не получается, скажите: «Пока не получается» — и попробуйте ещё раз вместе.": [
"When something doesn’t work, say, “It’s not working yet”, and try again together.",
"Quando algo não sai bem, digam: «Ainda não está a sair» e tentem outra vez juntos.",
"Wenn etwas nicht klappt, sagen Sie: „Es klappt noch nicht“, und versuchen Sie es gemeinsam noch einmal."
],
"Посадите фасолину в стаканчик и каждый день мерьте росток линейкой. Записывайте сантиметры на листке.": [
"Plant a bean in a cup and measure the shoot with a ruler every day. Write the centimetres on a sheet of paper.",
"Plantem um feijão num copo e meçam o rebento com uma régua todos os dias. Escrevam os centímetros numa folha.",
"Pflanzen Sie eine Bohne in einen Becher und messen Sie den Keimling jeden Tag mit dem Lineal. Schreiben Sie die Zentimeter auf ein Blatt."
],
"Сходите в магазин с 5 евро: ребёнок сам выбирает покупки, считает и проверяет сдачу.": [
"Go shopping with $5: your child chooses what to buy, adds it up and checks the change.",
"Vão às compras com 5 euros: a criança escolhe o que comprar, faz as contas e confere o troco.",
"Gehen Sie mit 5 Euro einkaufen: Ihr Kind wählt aus, rechnet zusammen und prüft das Wechselgeld."
],
"Испеките что-нибудь вместе: ребёнок читает рецепт и отмеряет половину и четверть стакана.": [
"Bake something together: your child reads the recipe and measures out half a cup and a quarter of a cup.",
"Façam um bolo ou umas bolachas juntos: a criança lê a receita e mede meia chávena e um quarto de chávena.",
"Backen Sie etwas zusammen: Ihr Kind liest das Rezept und misst eine halbe und eine viertel Tasse ab."
],
"Нарисуйте вместе карту своей комнаты: где кровать, окно, стол. Спрячьте «клад» и найдите его по карте.": [
"Draw a map of your room together: where the bed, the window and the table are. Hide a “treasure” and find it using the map.",
"Desenhem juntos o mapa do vosso quarto: onde fica a cama, a janela, a mesa. Escondam um «tesouro» e encontrem-no pelo mapa.",
"Zeichnen Sie gemeinsam eine Karte Ihres Zimmers: Wo stehen Bett, Fenster und Tisch? Verstecken Sie einen „Schatz“ und finden Sie ihn mit der Karte."
],
"Пусть ребёнок расскажет бабушке или дедушке о стране из истории: где она, что там интересного.": [
"Let your child tell Grandma or Grandad about a country from a story: where it is and what is interesting there.",
"Peçam à criança que conte à avó ou ao avô sobre um país de uma história: onde fica e o que tem de interessante.",
"Lassen Sie Ihr Kind Oma oder Opa von einem Land aus einer Geschichte erzählen: wo es liegt und was dort spannend ist."
],
"Неделю ведите дневник погоды: солнце, дождь или облака и сколько градусов. В конце — какой день был теплее всех?": [
"Keep a weather diary for a week: sun, rain or clouds, and how many degrees. At the end: which day was the warmest?",
"Façam um diário do tempo durante uma semana: sol, chuva ou nuvens e quantos graus. No fim: que dia foi o mais quente?",
"Führen Sie eine Woche lang ein Wettertagebuch: Sonne, Regen oder Wolken und wie viele Grad. Am Ende: Welcher Tag war der wärmste?"
],
"Сделайте кормушку из пакета от сока и записывайте, какие птицы прилетают.": [
"Make a bird feeder from a juice carton and write down which birds come.",
"Façam um comedouro com uma embalagem de sumo e registem que aves aparecem.",
"Bauen Sie aus einem Saftkarton ein Vogelhäuschen und schreiben Sie auf, welche Vögel kommen."
],
"Отметьте на двери рост всех в семье: кто выше всех, а кто на сколько ниже?": [
"Mark everyone’s height on a door frame: who is tallest, and by how much is everyone else shorter?",
"Marquem na porta a altura de todos na família: quem é o mais alto e quanto mais baixos são os outros?",
"Markieren Sie die Größe aller in der Familie am Türrahmen: Wer ist am größten, und um wie viel sind die anderen kleiner?"
],
"Напишите и отправьте настоящую открытку родным: ребёнок пишет сам, вы только помогаете с адресом.": [
"Write and post a real postcard to relatives: your child writes it, and you only help with the address.",
"Escrevam e enviem um postal a sério à família: a criança escreve sozinha e vocês só ajudam com a morada.",
"Schreiben und verschicken Sie eine echte Postkarte an Verwandte: Ihr Kind schreibt selbst, Sie helfen nur bei der Adresse."
],
"Сделайте солнечные часы: палка в земле и камешки там, где тень в 10, 12 и 14 часов.": [
"Make a sundial: a stick in the ground and pebbles where the shadow falls at 10, 12 and 2 o’clock.",
"Façam um relógio de sol: um pau no chão e pedrinhas onde cai a sombra às 10, às 12 e às 14 horas.",
"Bauen Sie eine Sonnenuhr: ein Stock im Boden und Steinchen dort, wo der Schatten um 10, 12 und 14 Uhr liegt."
],
"Спланируйте прогулку выходного дня: маршрут по карте, время в пути и бюджет на перекус.": [
"Plan a weekend outing: the route on a map, the time it takes and a budget for a snack.",
"Planeiem um passeio de fim de semana: o caminho no mapa, o tempo do percurso e um orçamento para o lanche.",
"Planen Sie einen Ausflug am Wochenende: die Route auf der Karte, die Fahrzeit und ein Budget für den Snack."
],
"Разберите вместе мусор на бумагу, пластик и стекло и подпишите коробки.": [
"Sort the rubbish together into paper, plastic and glass, and label the boxes.",
"Separem o lixo juntos em papel, plástico e vidro e escrevam etiquetas para as caixas.",
"Trennen Sie den Müll gemeinsam in Papier, Plastik und Glas und beschriften Sie die Kisten."
],
"Устройте домашний театр по любимой сказке: билеты, роли и аплодисменты.": [
"Put on a home theatre show of a favourite fairy tale: tickets, parts and applause.",
"Montem um teatro em casa com um conto preferido: bilhetes, papéis e aplausos.",
"Führen Sie zu Hause ein Theaterstück nach einem Lieblingsmärchen auf: mit Eintrittskarten, Rollen und Applaus."
],
"Заведите копилку с целью: что хотим купить, сколько стоит, сколько откладываем в неделю.": [
"Start a piggy bank with a goal: what we want to buy, what it costs and how much we save each week.",
"Façam um mealheiro com um objetivo: o que queremos comprar, quanto custa e quanto poupamos por semana.",
"Legen Sie eine Spardose mit einem Ziel an: Was wollen wir kaufen, was kostet es und wie viel sparen wir pro Woche?"
],
"Мастер дела": [
"Master of Doing",
"Mestre de Projetos",
"Meister der Tat"
],
"Проект недели вместе со взрослыми": [
"The project of the week, with the grown-ups",
"O projeto da semana com os adultos",
"Das Wochenprojekt zusammen mit den Erwachsenen"
],
"Пять проектов": [
"Five projects",
"Cinco projetos",
"Fünf Projekte"
],
"Пять проектов недели": [
"Five projects of the week",
"Cinco projetos da semana",
"Fünf Wochenprojekte"
]
}
''')
CYR = re.compile('[А-Яа-яЁё]'); n = 0; lost = []
for g, keys in miss.items():
    if g in ('GAMES', 'LEARN_IMG', 'SND_HI'): continue
    for k in keys:
        if k not in W: lost.append(k); continue
        tr = W[k]
        assert len(tr) == 3 and not any(CYR.search(x) for x in tr), k
        assert re.findall(r'\{\d\}', k) == re.findall(r'\{\d\}', tr[0]) == re.findall(r'\{\d\}', tr[1]) == re.findall(r'\{\d\}', tr[2]), k
        fixed.setdefault(g, {})[k] = list(tr[:2]); fde.setdefault(g, {})[k] = tr[2]; n += 1
json.dump(fixed, open(H + '/fixed.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
json.dump(fde, open(H + '/de/fixed_de.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('ok', n, 'missing', len(lost), lost[:10])
