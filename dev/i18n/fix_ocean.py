# ocean-water: translations of «Океан в глубину» and «Как вода путешествует» (the water stories stay Russian-only)
import json, os, re
H = os.path.dirname(os.path.abspath(__file__))
fixed = json.load(open(H + '/fixed.json', encoding='utf-8')); fde = json.load(open(H + '/de/fixed_de.json', encoding='utf-8'))
miss = json.load(open(H + '/out-en.html.missing.json', encoding='utf-8'))
OC_HUD = '<div class="oc">\n      <div class="oc-hud"><div class="oc-meter"><span>🤿</span><b id="ocD">0 {0}</b><small id="ocZ">{1}</small></div><button class="oc-dn" id="ocDn" aria-label="%s">⬇</button></div>\n      {2}\n      <div class="oc-card" id="ocCard"><p>%s</p></div>\n    </div>'
WC = '<div class="wc">\n      <div class="lab-tabs"><button class="chip {0}" data-m="learn">🔍 %s</button><button class="chip {1}" data-m="order">🔢 %s</button></div>\n      <div class="wc-main"><div class="wc-fig {2}">{3}</div>\n        <div class="wc-side"><div class="bd-card" id="wcCard"></div>{4}</div></div>\n    </div>'
W = {
 'м': ('m', 'm', 'm'),
 'поверхность': ('surface', 'superfície', 'Oberfläche'),
 'солнечная зона': ('sunlit zone', 'zona de luz', 'Sonnenzone'),
 'сумерки': ('twilight zone', 'zona crepuscular', 'Dämmerzone'),
 'вечная темнота': ('endless darkness', 'escuridão total', 'ewige Dunkelheit'),
 'дно океана': ('ocean floor', 'fundo do oceano', 'Meeresboden'),
 'глубоководная впадина': ('deep-sea trench', 'fossa abissal', 'Tiefseegraben'),
 'Дельфин': ('Dolphin', 'Golfinho', 'Delfin'),
 'Дельфины — не рыбы, а звери: они дышат воздухом и поднимаются к поверхности, чтобы вдохнуть. Дельфины зовут друг друга свистом, и у каждого есть свой свист, как имя.':
  ('Dolphins are not fish but mammals: they breathe air and swim up to the surface to take a breath. Dolphins call each other by whistling, and each one has its own whistle, like a name.',
   'Os golfinhos não são peixes, são mamíferos: respiram ar e sobem à superfície para respirar. Os golfinhos chamam-se uns aos outros com assobios, e cada um tem o seu assobio, como um nome.',
   'Delfine sind keine Fische, sondern Säugetiere: Sie atmen Luft und schwimmen nach oben, um Luft zu holen. Delfine rufen einander mit Pfiffen, und jeder hat seinen eigenen Pfiff, wie einen Namen.'),
 'Коралловый риф': ('Coral reef', 'Recife de coral', 'Korallenriff'),
 'Коралловый риф — это подводный город. Его строят крошечные животные — коралловые полипы, а рыбка-клоун прячется в жгучих щупальцах актинии, и они её не трогают.':
  ('A coral reef is an underwater city. Tiny animals called coral polyps build it, and the clownfish hides among the stinging tentacles of a sea anemone, which never sting it.',
   'Um recife de coral é uma cidade debaixo de água. Constroem-no animais minúsculos, os pólipos de coral, e o peixe-palhaço esconde-se entre os tentáculos urticantes da anémona, que não lhe fazem mal.',
   'Ein Korallenriff ist eine Stadt unter Wasser. Winzige Tiere, die Korallenpolypen, bauen es, und der Clownfisch versteckt sich zwischen den brennenden Armen einer Seeanemone, die ihm nichts tun.'),
 'Морская черепаха': ('Sea turtle', 'Tartaruga-marinha', 'Meeresschildkröte'),
 'Морская черепаха плавает, будто летает: её лапы похожи на крылья. Чтобы отложить яйца, она возвращается к берегу, где когда-то вылупилась сама.':
  ('A sea turtle swims as if it were flying: its flippers look like wings. To lay her eggs, she comes back to the beach where she hatched long ago.',
   'A tartaruga-marinha nada como se voasse: as patas parecem asas. Para pôr os ovos, volta à praia onde ela própria nasceu.',
   'Eine Meeresschildkröte schwimmt, als würde sie fliegen: Ihre Flossen sehen aus wie Flügel. Um ihre Eier zu legen, kehrt sie an den Strand zurück, wo sie selbst einst geschlüpft ist.'),
 'Осьминог': ('Octopus', 'Polvo', 'Krake'),
 'У осьминога восемь рук с присосками, три сердца и голубая кровь. Он умеет менять цвет, а если испугается — выпускает облако чернил и уплывает.':
  ('An octopus has eight arms with suckers, three hearts and blue blood. It can change colour, and when it gets scared it squirts a cloud of ink and swims away.',
   'O polvo tem oito braços com ventosas, três corações e sangue azul. Sabe mudar de cor e, quando se assusta, solta uma nuvem de tinta e foge a nadar.',
   'Ein Krake hat acht Arme mit Saugnäpfen, drei Herzen und blaues Blut. Er kann seine Farbe ändern, und wenn er erschrickt, spritzt er eine Tintenwolke und schwimmt davon.'),
 'Медуза': ('Jellyfish', 'Medusa', 'Qualle'),
 'Медуза почти вся из воды: у неё нет ни костей, ни сердца, ни мозга. Она плывёт, сжимая свой купол, как зонтик, а трогать её нельзя — многие медузы больно жгутся.':
  ('A jellyfish is almost all water: it has no bones, no heart and no brain. It swims by squeezing its bell like an umbrella, but never touch one — many jellyfish sting.',
   'A medusa é quase toda feita de água: não tem ossos, nem coração, nem cérebro. Nada a apertar a sua cúpula como um guarda-chuva, mas não se deve tocar-lhe — muitas medusas picam.',
   'Eine Qualle besteht fast nur aus Wasser: Sie hat keine Knochen, kein Herz und kein Gehirn. Sie schwimmt, indem sie ihren Schirm zusammendrückt, aber fass sie nie an — viele Quallen brennen.'),
 'Акула': ('Shark', 'Tubarão', 'Hai'),
 'Акулы появились на Земле раньше динозавров. Зубы у акулы растут рядами: выпадет один — на его место встанет новый.':
  ('Sharks lived on Earth before the dinosaurs. A shark’s teeth grow in rows: when one falls out, a new one takes its place.',
   'Os tubarões já existiam na Terra antes dos dinossauros. Os dentes do tubarão crescem em filas: quando um cai, outro novo toma o seu lugar.',
   'Haie gab es auf der Erde schon vor den Dinosauriern. Die Zähne eines Hais wachsen in Reihen: Fällt einer aus, rückt ein neuer nach.'),
 'Синий кит': ('Blue whale', 'Baleia-azul', 'Blauwal'),
 'Синий кит — самое большое животное, которое когда-либо жило на Земле, больше любого динозавра. А ест этот великан крошечных рачков — криль.':
  ('The blue whale is the biggest animal that has ever lived on Earth, bigger than any dinosaur. And this giant eats tiny shrimp-like creatures called krill.',
   'A baleia-azul é o maior animal que alguma vez viveu na Terra, maior do que qualquer dinossauro. E este gigante come uns camarõezinhos minúsculos: o krill.',
   'Der Blauwal ist das größte Tier, das je auf der Erde gelebt hat, größer als jeder Dinosaurier. Und dieser Riese frisst winzige Krebschen — den Krill.'),
 'Рыба-фонарь': ('Lanternfish', 'Peixe-lanterna', 'Laternenfisch'),
 'На теле у рыб-фонарей горят маленькие огоньки. Днём они прячутся в глубине, а ночью поднимаются повыше, чтобы поесть.':
  ('Lanternfish have little lights glowing on their bodies. In the day they hide in the deep, and at night they swim higher up to eat.',
   'Os peixes-lanterna têm luzinhas a brilhar no corpo. De dia escondem-se nas profundezas e à noite sobem para comer.',
   'Laternenfische haben kleine Lichter am Körper. Am Tag verstecken sie sich in der Tiefe, und nachts schwimmen sie nach oben, um zu fressen.'),
 'Гигантский кальмар': ('Giant squid', 'Lula-gigante', 'Riesenkalmar'),
 'Гигантский кальмар бывает длиной с автобус, а глаза у него — размером с тарелку. Он живёт так глубоко, что в родной глубине его впервые сняли на видео только в 2012 году.':
  ('A giant squid can be as long as a bus, and its eyes are as big as plates. It lives so deep that people first filmed it in its own deep home only in 2012.',
   'A lula-gigante pode ser tão comprida como um autocarro, e os olhos são do tamanho de pratos. Vive tão fundo que só em 2012 foi filmada pela primeira vez nas suas profundezas.',
   'Ein Riesenkalmar kann so lang sein wie ein Bus, und seine Augen sind so groß wie Teller. Er lebt so tief, dass man ihn erst 2012 zum ersten Mal in seiner Tiefe gefilmt hat.'),
 'Кашалот': ('Sperm whale', 'Cachalote', 'Pottwal'),
 'Кашалот — кит с огромной головой. Он ныряет больше чем на километр в глубину и может не дышать целый час, пока охотится на кальмаров.':
  ('The sperm whale is a whale with a huge head. It dives more than a kilometre deep and can hold its breath for a whole hour while it hunts squid.',
   'O cachalote é uma baleia com uma cabeça enorme. Mergulha a mais de um quilómetro de profundidade e consegue ficar uma hora inteira sem respirar enquanto caça lulas.',
   'Der Pottwal ist ein Wal mit einem riesigen Kopf. Er taucht mehr als einen Kilometer tief und kann eine ganze Stunde die Luft anhalten, während er Kalmare jagt.'),
 'Рыба-удильщик': ('Anglerfish', 'Tamboril-das-profundezas', 'Anglerfisch'),
 'У рыбы-удильщика на голове растёт удочка со светящимся фонариком. Рыбки плывут на свет — прямо к её зубастому рту.':
  ('An anglerfish has a fishing rod growing on its head, with a glowing light at the end. Little fish swim towards the light — straight into its toothy mouth.',
   'O tamboril-das-profundezas tem na cabeça uma cana de pesca com uma luzinha na ponta. Os peixinhos nadam para a luz — direitinhos para a sua boca cheia de dentes.',
   'Ein Anglerfisch hat auf dem Kopf eine Angel mit einem leuchtenden Lämpchen. Kleine Fische schwimmen zum Licht — direkt in sein Maul voller Zähne.'),
 'Осьминог Дамбо': ('Dumbo octopus', 'Polvo-dumbo', 'Dumbo-Oktopus'),
 'Этого осьминога назвали в честь слонёнка Дамбо: его плавники похожи на большие уши. Он машет ими и медленно парит над самым дном.':
  ('This octopus is named after Dumbo the baby elephant: its fins look like big ears. It flaps them and slowly floats just above the sea floor.',
   'Este polvo tem o nome do elefantinho Dumbo: as barbatanas parecem orelhas grandes. Abana-as e flutua devagar mesmo por cima do fundo.',
   'Dieser Oktopus heißt nach dem kleinen Elefanten Dumbo: Seine Flossen sehen aus wie große Ohren. Er schlägt mit ihnen und schwebt langsam knapp über dem Boden.'),
 'Морской огурец': ('Sea cucumber', 'Pepino-do-mar', 'Seegurke'),
 'На дне океана холодно и совсем темно, а по дну ползают морские огурцы. Это не овощи, а животные: они собирают со дна крошки еды, как пылесос.':
  ('At the bottom of the ocean it is cold and completely dark, and sea cucumbers crawl along the floor. They are not vegetables but animals: they pick up crumbs of food like a vacuum cleaner.',
   'No fundo do oceano está frio e completamente escuro, e os pepinos-do-mar rastejam pelo fundo. Não são legumes, são animais: apanham as migalhas de comida como um aspirador.',
   'Auf dem Meeresboden ist es kalt und ganz dunkel, und dort kriechen Seegurken herum. Sie sind kein Gemüse, sondern Tiere: Sie sammeln Futterkrümel auf wie ein Staubsauger.'),
 'Рыба-липарис': ('Snailfish', 'Peixe-caracol', 'Scheibenbauch'),
 'Эта маленькая рыбка — рекордсменка: её видели на глубине больше восьми тысяч метров. Вода там давит в сотни раз сильнее, чем у поверхности, а тело у липариса мягкое, как желе.':
  ('This little fish is a record-breaker: it has been seen more than eight thousand metres deep. The water there presses hundreds of times harder than at the surface, and the snailfish’s body is soft, like jelly.',
   'Este peixinho é um campeão: foi visto a mais de oito mil metros de profundidade. Lá, a água aperta centenas de vezes mais do que à superfície, e o corpo do peixe-caracol é mole como gelatina.',
   'Dieser kleine Fisch ist ein Rekordhalter: Man hat ihn in mehr als achttausend Metern Tiefe gesehen. Das Wasser drückt dort hundertmal stärker als an der Oberfläche, und sein Körper ist weich wie Wackelpudding.'),
 'Марианская впадина': ('Mariana Trench', 'Fossa das Marianas', 'Marianengraben'),
 'Это самое глубокое место на Земле: почти одиннадцать километров. Даже самая высокая гора, Эверест, поместилась бы здесь целиком, а люди впервые опустились сюда в 1960 году на батискафе «Триест».':
  ('This is the deepest place on Earth: almost eleven kilometres. Even the highest mountain, Everest, would fit inside it, and people first went down here in 1960 in the bathyscaphe “Trieste”.',
   'Este é o sítio mais fundo da Terra: quase onze quilómetros. Até a montanha mais alta, o Evereste, caberia aqui inteira, e as pessoas desceram cá pela primeira vez em 1960, no batiscafo «Trieste».',
   'Das ist die tiefste Stelle der Erde: fast elf Kilometer. Sogar der höchste Berg, der Mount Everest, würde ganz hineinpassen, und Menschen tauchten hier zum ersten Mal 1960 mit dem Tauchboot „Trieste“ hinab.'),
 'Здесь кончается солнечный свет': ('Sunlight ends here', 'Aqui acaba a luz do sol', 'Hier endet das Sonnenlicht'),
 'Дальше — полная темнота': ('Below this, total darkness', 'Daqui para baixo, escuridão total', 'Darunter ist es stockdunkel'),
 'Дно океана': ('Ocean floor', 'Fundo do oceano', 'Meeresboden'),
 'Глубоководная впадина': ('Deep-sea trench', 'Fossa abissal', 'Tiefseegraben'),
 'Океан в глубину': ('Deep into the ocean', 'Mergulho no oceano', 'Tief ins Meer'),
 OC_HUD % ('Глубже', 'Листай вниз и ныряй! Нажимай на жителей океана.'): (
   OC_HUD % ('Deeper', 'Scroll down and dive! Tap the ocean animals.'),
   OC_HUD % ('Mais fundo', 'Desliza para baixo e mergulha! Toca nos animais do oceano.'),
   OC_HUD % ('Tiefer', 'Wische nach unten und tauche! Tippe auf die Meerestiere.')),
 'Ты нырнула до самого дна Марианской впадины и узнала всех жителей океана!': ('You dived all the way to the bottom of the Mariana Trench and met every ocean animal!', 'Mergulhaste até ao fundo da Fossa das Marianas e conheceste todos os animais do oceano!', 'Du bist bis ganz nach unten in den Marianengraben getaucht und hast alle Meerestiere kennengelernt!'),
 'Ты нырнул до самого дна Марианской впадины и узнал всех жителей океана!': ('You dived all the way to the bottom of the Mariana Trench and met every ocean animal!', 'Mergulhaste até ao fundo da Fossa das Marianas e conheceste todos os animais do oceano!', 'Du bist bis ganz nach unten in den Marianengraben getaucht und hast alle Meerestiere kennengelernt!'),
 'Ныряем в океан! Листай вниз: чем глубже, тем темнее. Нажимай на тех, кто там живёт.': ('Let’s dive into the ocean! Scroll down: the deeper you go, the darker it gets. Tap the animals that live there.', 'Vamos mergulhar no oceano! Desliza para baixo: quanto mais fundo, mais escuro. Toca nos animais que lá vivem.', 'Wir tauchen ins Meer! Wische nach unten: Je tiefer, desto dunkler. Tippe auf die Tiere, die dort leben.'),
 'Солнце греет море': ('The sun warms the sea', 'O sol aquece o mar', 'Die Sonne wärmt das Meer'),
 'Солнце греет море. Вода нагревается и понемногу превращается в невидимый пар — она испаряется.': ('The sun warms the sea. The water gets warm and little by little turns into invisible vapour — it evaporates.', 'O sol aquece o mar. A água fica quente e, pouco a pouco, transforma-se em vapor invisível — evapora-se.', 'Die Sonne wärmt das Meer. Das Wasser wird warm und wird nach und nach zu unsichtbarem Dampf — es verdunstet.'),
 'Всё начинается с солнца.': ('It all starts with the sun.', 'Tudo começa com o sol.', 'Alles beginnt mit der Sonne.'),
 'Пар поднимается': ('Vapour rises', 'O vapor sobe', 'Der Dampf steigt auf'),
 'Тёплый пар поднимается высоко-высоко. Наверху холодно, и пар превращается в крошечные капельки.': ('The warm vapour rises high, high up. It is cold up there, and the vapour turns into tiny droplets.', 'O vapor quente sobe muito, muito alto. Lá em cima está frio, e o vapor transforma-se em gotinhas minúsculas.', 'Der warme Dampf steigt hoch, hoch hinauf. Oben ist es kalt, und der Dampf wird zu winzigen Tröpfchen.'),
 'Солнце нагрело воду. Куда она девается?': ('The sun has warmed the water. Where does it go?', 'O sol aqueceu a água. Para onde vai ela?', 'Die Sonne hat das Wasser gewärmt. Wohin geht es?'),
 'Облака': ('Clouds', 'Nuvens', 'Wolken'),
 'Из миллионов крошечных капелек получаются облака. Ветер несёт их над землёй к горам.': ('Millions of tiny droplets make clouds. The wind carries them over the land to the mountains.', 'Milhões de gotinhas minúsculas formam as nuvens. O vento leva-as por cima da terra até às montanhas.', 'Aus Millionen winziger Tröpfchen werden Wolken. Der Wind trägt sie über das Land zu den Bergen.'),
 'Пар поднялся высоко. Что из него получается?': ('The vapour has risen high. What does it turn into?', 'O vapor subiu muito alto. Em que se transforma?', 'Der Dampf ist hoch gestiegen. Was wird daraus?'),
 'Дождь и снег': ('Rain and snow', 'Chuva e neve', 'Regen und Schnee'),
 'Капельки сливаются, становятся тяжёлыми и падают дождём. А высоко в горах, где холодно, падает снег.': ('The droplets join together, get heavy and fall as rain. And high in the mountains, where it is cold, snow falls.', 'As gotinhas juntam-se, ficam pesadas e caem em chuva. E lá no alto das montanhas, onde está frio, cai neve.', 'Die Tröpfchen fließen zusammen, werden schwer und fallen als Regen. Und hoch in den Bergen, wo es kalt ist, fällt Schnee.'),
 'Облака стали тяжёлыми. Что из них падает?': ('The clouds have got heavy. What falls from them?', 'As nuvens ficaram pesadas. O que cai delas?', 'Die Wolken sind schwer geworden. Was fällt aus ihnen?'),
 'Ручей и река': ('A stream and a river', 'Ribeiro e rio', 'Bach und Fluss'),
 'Снег в горах тает, дождевая вода собирается в ручейки. Ручьи бегут вниз, сливаются и становятся рекой.': ('The snow in the mountains melts, and rainwater gathers into little streams. The streams run down, join together and become a river.', 'A neve das montanhas derrete e a água da chuva junta-se em ribeirinhos. Os ribeiros correm para baixo, juntam-se e tornam-se um rio.', 'Der Schnee in den Bergen schmilzt, und das Regenwasser sammelt sich in Bächlein. Die Bäche laufen hinab, fließen zusammen und werden zu einem Fluss.'),
 'На горах дождь и снег. Куда бежит вода?': ('There is rain and snow on the mountains. Where does the water run?', 'Há chuva e neve nas montanhas. Para onde corre a água?', 'Auf den Bergen gibt es Regen und Schnee. Wohin läuft das Wasser?'),
 'Река впадает в море': ('The river flows into the sea', 'O rio desagua no mar', 'Der Fluss mündet ins Meer'),
 'Река всегда течёт вниз — к морю. Там, где она впадает в море, её вода снова становится морской. И всё начинается сначала!': ('A river always flows downhill — to the sea. Where it flows into the sea, its water becomes sea water again. And it all starts over!', 'Um rio corre sempre para baixo — até ao mar. Onde desagua no mar, a sua água volta a ser água do mar. E tudo começa outra vez!', 'Ein Fluss fließt immer bergab — zum Meer. Wo er ins Meer mündet, wird sein Wasser wieder Meerwasser. Und alles beginnt von vorn!'),
 'Река бежит вниз. Куда она впадает?': ('The river runs downhill. Where does it flow into?', 'O rio corre para baixo. Onde desagua?', 'Der Fluss läuft bergab. Wo mündet er?'),
 'Круговорот воды': ('The water cycle', 'O ciclo da água', 'Der Wasserkreislauf'),
 'Как вода путешествует': ('How water travels', 'Como a água viaja', 'Wie Wasser reist'),
 WC % ('Узнать', 'По порядку'): (WC % ('Learn', 'In order'), WC % ('Aprender', 'Por ordem'), WC % ('Entdecken', 'Der Reihe nach')),
 '<h2>👆 Нажми на солнце, облако или реку</h2><p>Вода всё время путешествует по кругу: из моря в небо, с неба на землю и снова в море.</p>': (
   '<h2>👆 Tap the sun, a cloud or the river</h2><p>Water is always travelling in a circle: from the sea to the sky, from the sky to the land and back to the sea.</p>',
   '<h2>👆 Toca no sol, numa nuvem ou no rio</h2><p>A água está sempre a viajar em círculo: do mar para o céu, do céu para a terra e outra vez para o mar.</p>',
   '<h2>👆 Tippe auf die Sonne, eine Wolke oder den Fluss</h2><p>Wasser reist immer im Kreis: vom Meer in den Himmel, vom Himmel aufs Land und wieder ins Meer.</p>'),
 'Вода всё время путешествует по кругу: из моря в небо, с неба на землю и снова в море. Нажимай по порядку: один, два, три…': ('Water is always travelling in a circle: from the sea to the sky, from the sky to the land and back to the sea. Tap them in order: one, two, three…', 'A água está sempre a viajar em círculo: do mar para o céu, do céu para a terra e outra vez para o mar. Toca por ordem: um, dois, três…', 'Wasser reist immer im Kreis: vom Meer in den Himmel, vom Himmel aufs Land und wieder ins Meer. Tippe der Reihe nach: eins, zwei, drei…'),
 'Ты узнала весь путь воды: море, пар, облака, дождь и снег, ручей, река и снова море! Теперь поставь всё по порядку.': ('You’ve learnt the whole journey of water: sea, vapour, clouds, rain and snow, a stream, a river and the sea again! Now put it all in order.', 'Aprendeste a viagem toda da água: mar, vapor, nuvens, chuva e neve, ribeiro, rio e outra vez o mar! Agora põe tudo por ordem.', 'Du kennst jetzt die ganze Reise des Wassers: Meer, Dampf, Wolken, Regen und Schnee, Bach, Fluss und wieder das Meer! Jetzt bring alles in die richtige Reihenfolge.'),
 'Ты узнал весь путь воды: море, пар, облака, дождь и снег, ручей, река и снова море! Теперь поставь всё по порядку.': ('You’ve learnt the whole journey of water: sea, vapour, clouds, rain and snow, a stream, a river and the sea again! Now put it all in order.', 'Aprendeste a viagem toda da água: mar, vapor, nuvens, chuva e neve, ribeiro, rio e outra vez o mar! Agora põe tudo por ordem.', 'Du kennst jetzt die ganze Reise des Wassers: Meer, Dampf, Wolken, Regen und Schnee, Bach, Fluss und wieder das Meer! Jetzt bring alles in die richtige Reihenfolge.'),
 '<h2>🔢 {0}</h2><p>Нажми на карточку: куда вода отправится {1}?</p>': ('<h2>🔢 {0}</h2><p>Tap a card: where does the water go {1}?</p>', '<h2>🔢 {0}</h2><p>Toca num cartão: para onde vai a água {1}?</p>', '<h2>🔢 {0}</h2><p>Tippe auf eine Karte: Wohin geht das Wasser {1}?</p>'),
 'Что дальше?': ('What comes next?', 'O que vem a seguir?', 'Was kommt als Nächstes?'),
 'Что бывает сначала?': ('What comes first?', 'O que vem primeiro?', 'Was kommt zuerst?'),
 'потом': ('next', 'a seguir', 'danach'),
 'в самом начале': ('first of all', 'logo no início', 'ganz am Anfang'),
 'С чего начинается путешествие воды?': ('How does the water’s journey begin?', 'Como começa a viagem da água?', 'Womit beginnt die Reise des Wassers?'),
 'Правильно!': ('Right!', 'Certo!', 'Richtig!'), 'Да!': ('Yes!', 'Sim!', 'Ja!'), 'Верно!': ('Correct!', 'Isso mesmo!', 'Genau!'),
 'Солнце, пар, облака, дождь и снег, ручей и река — и снова море. Так вода путешествует по кругу!': ('Sun, vapour, clouds, rain and snow, a stream and a river — and the sea again. That’s how water travels in a circle!', 'Sol, vapor, nuvens, chuva e neve, ribeiro e rio — e outra vez o mar. É assim que a água viaja em círculo!', 'Sonne, Dampf, Wolken, Regen und Schnee, Bach und Fluss — und wieder das Meer. So reist das Wasser im Kreis!'),
 '<h2>🎉 Круг готов!</h2><p>{0}</p>': ('<h2>🎉 The circle is complete!</h2><p>{0}</p>', '<h2>🎉 O círculo está completo!</h2><p>{0}</p>', '<h2>🎉 Der Kreis ist fertig!</h2><p>{0}</p>'),
 'Ты поставила всё по порядку! Вода снова в море — и всё начинается сначала.': ('You put everything in order! The water is back in the sea — and it all starts over.', 'Puseste tudo por ordem! A água voltou ao mar — e tudo começa outra vez.', 'Du hast alles in die richtige Reihenfolge gebracht! Das Wasser ist wieder im Meer — und alles beginnt von vorn.'),
 'Ты поставил всё по порядку! Вода снова в море — и всё начинается сначала.': ('You put everything in order! The water is back in the sea — and it all starts over.', 'Puseste tudo por ordem! A água voltou ao mar — e tudo começa outra vez.', 'Du hast alles in die richtige Reihenfolge gebracht! Das Wasser ist wieder im Meer — und alles beginnt von vorn.'),
 'Не сейчас. {0}': ('Not yet. {0}', 'Ainda não. {0}', 'Noch nicht. {0}'),
 ' Смотри, что мигает!': (' Look what’s blinking!', ' Olha o que está a piscar!', ' Schau, was blinkt!'),
 'ныряем до самого дна: кто где живёт': ('dive to the very bottom: who lives where', 'mergulha até ao fundo: quem vive onde', 'tauch bis ganz nach unten: Wer lebt wo?'),
 'море рыбы кит акула осьминог глубина дно впадина': ('sea fish whale shark octopus depth bottom trench', 'mar peixes baleia tubarão polvo profundidade fundo fossa', 'Meer Fische Wal Hai Krake Tiefe Boden Graben'),
 'круговорот воды: море, облака, дождь, река': ('the water cycle: sea, clouds, rain, river', 'o ciclo da água: mar, nuvens, chuva, rio', 'der Wasserkreislauf: Meer, Wolken, Regen, Fluss'),
 'круговорот дождь снег облака пар река море': ('water cycle rain snow clouds vapour river sea', 'ciclo da água chuva neve nuvens vapor rio mar', 'Wasserkreislauf Regen Schnee Wolken Dampf Fluss Meer'),
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
