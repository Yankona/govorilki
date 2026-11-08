# Animals on the globe: translations (GLOBE_ANIMALS, GLOBE_SCREEN). Run after a build: python3 i18n/fix_animals.py
import json, os, re
H = os.path.dirname(os.path.abspath(__file__))
fixed = json.load(open(H + '/fixed.json', encoding='utf-8')); fde = json.load(open(H + '/de/fixed_de.json', encoding='utf-8'))
miss = json.load(open(H + '/out-en.html.missing.json', encoding='utf-8'))
W = {}
def T(ru, en, pt, de): W[ru] = (en, pt, de)
def S(ru, *pairs):  # HTML: replace Russian parts inside the key itself
    out = []
    for i in range(3):
        s = ru
        for p in pairs: s = s.replace(p[0], p[i + 1])
        out.append(s)
    W[ru] = tuple(out)
def A(names, q, s):  # an animal: (ru, en, pt, de) for the name, the question and the text
    T(*names); T(*q); T(*s)

A(('Императорский пингвин', 'Emperor penguin', 'Pinguim-imperador', 'Kaiserpinguin'),
  ('Где живёт императорский пингвин?', 'Where does the emperor penguin live?', 'Onde vive o pinguim-imperador?', 'Wo lebt der Kaiserpinguin?'),
  ('Императорский пингвин живёт в Антарктиде, где лёд и снег лежат круглый год. Он ест рыбу и кальмаров и ныряет за ними глубоко в океан. Папа-пингвин два месяца держит яйцо на лапах и греет его тёплой складкой живота.',
   'The emperor penguin lives in Antarctica, where there is ice and snow all year round. It eats fish and squid and dives deep into the ocean to catch them. The daddy penguin holds the egg on his feet for two months and keeps it warm under a cosy fold of his tummy.',
   'O pinguim-imperador vive na Antártida, onde há gelo e neve o ano inteiro. Come peixe e lulas e mergulha bem fundo no oceano para os apanhar. O pai pinguim segura o ovo nas patas durante dois meses e aquece-o com uma prega quentinha da barriga.',
   'Der Kaiserpinguin lebt in der Antarktis, wo das ganze Jahr Eis und Schnee liegen. Er frisst Fische und Tintenfische und taucht dafür tief ins Meer. Der Pinguin-Papa hält das Ei zwei Monate lang auf seinen Füßen und wärmt es mit einer warmen Bauchfalte.'))
A(('Белый медведь', 'Polar bear', 'Urso-polar', 'Eisbär'),
  ('Где живёт белый медведь?', 'Where does the polar bear live?', 'Onde vive o urso-polar?', 'Wo lebt der Eisbär?'),
  ('Белый медведь живёт в Арктике, на льдинах вокруг Северного полюса. Он охотится на тюленей и отлично плавает. А под белой шерстью кожа у него чёрная!',
   'The polar bear lives in the Arctic, on the ice around the North Pole. It hunts seals and is a brilliant swimmer. And under its white fur, its skin is black!',
   'O urso-polar vive no Ártico, no gelo à volta do Polo Norte. Caça focas e nada muito bem. E debaixo do pelo branco, a pele dele é preta!',
   'Der Eisbär lebt in der Arktis, auf dem Eis rund um den Nordpol. Er jagt Robben und schwimmt sehr gut. Und unter dem weißen Fell ist seine Haut schwarz!'))
A(('Полярная сова', 'Snowy owl', 'Coruja-das-neves', 'Schnee-Eule'),
  ('Где живёт полярная сова?', 'Where does the snowy owl live?', 'Onde vive a coruja-das-neves?', 'Wo lebt die Schnee-Eule?'),
  ('Полярная сова живёт в тундре, на далёком холодном севере. Она охотится на леммингов — маленьких пушистых зверьков. Летом там солнце не заходит, и сова охотится даже днём.',
   'The snowy owl lives in the tundra, in the cold far north. It hunts lemmings, which are small furry animals. In summer the sun never sets there, so the owl hunts in the daytime too.',
   'A coruja-das-neves vive na tundra, no norte frio e distante. Caça lemingues, uns bichinhos pequenos e peludos. No verão o sol lá não se põe, e a coruja caça até de dia.',
   'Die Schnee-Eule lebt in der Tundra, im kalten hohen Norden. Sie jagt Lemminge, das sind kleine flauschige Tiere. Im Sommer geht dort die Sonne nicht unter, und die Eule jagt sogar am Tag.'))
A(('Северный олень', 'Reindeer', 'Rena', 'Rentier'),
  ('Где живёт северный олень?', 'Where does the reindeer live?', 'Onde vive a rena?', 'Wo lebt das Rentier?'),
  ('Северный олень живёт на холодном севере, в тундре и в лесах. Зимой он разгребает копытами снег и достаёт мох ягель. Рога у северных оленей растут и у пап, и у мам.',
   'The reindeer lives in the cold north, in the tundra and in forests. In winter it digs through the snow with its hooves to find reindeer moss. Both daddy and mummy reindeer grow antlers.',
   'A rena vive no norte frio, na tundra e nas florestas. No inverno escava a neve com os cascos para chegar ao líquen. Tanto os pais como as mães renas têm hastes.',
   'Das Rentier lebt im kalten Norden, in der Tundra und in Wäldern. Im Winter scharrt es mit den Hufen den Schnee weg und frisst Rentierflechte. Bei Rentieren tragen Papas und Mamas ein Geweih.'))
A(('Бурый медведь', 'Brown bear', 'Urso-pardo', 'Braunbär'),
  ('Где живёт бурый медведь?', 'Where does the brown bear live?', 'Onde vive o urso-pardo?', 'Wo lebt der Braunbär?'),
  ('Бурый медведь живёт в лесах России. Он ест ягоды, орехи, корешки и рыбу. Зимой медведица спит в берлоге, и прямо там, среди зимы, у неё рождаются медвежата.',
   'The brown bear lives in the forests of Russia. It eats berries, nuts, roots and fish. In winter the mother bear sleeps in her den, and right there, in the middle of winter, her cubs are born.',
   'O urso-pardo vive nas florestas da Rússia. Come bagas, nozes, raízes e peixe. No inverno a ursa dorme na toca, e é lá, a meio do inverno, que nascem os ursinhos.',
   'Der Braunbär lebt in den Wäldern Russlands. Er frisst Beeren, Nüsse, Wurzeln und Fische. Im Winter schläft die Bärenmama in ihrer Höhle, und genau dort, mitten im Winter, kommen ihre Jungen zur Welt.'))
A(('Амурский тигр', 'Amur tiger', 'Tigre-siberiano', 'Amurtiger'),
  ('Где живёт амурский тигр?', 'Where does the Amur tiger live?', 'Onde vive o tigre-siberiano?', 'Wo lebt der Amurtiger?'),
  ('Амурский тигр живёт на Дальнем Востоке России, где зимой лежит глубокий снег. Это одна из самых больших кошек на свете. Шерсть у него густая, а под кожей слой жира — так ему не страшен мороз.',
   'The Amur tiger lives in the Far East of Russia, where deep snow lies in winter. It is one of the biggest cats in the world. Its fur is thick and it has a layer of fat under its skin, so the frost does not bother it.',
   'O tigre-siberiano vive no Extremo Oriente da Rússia, onde no inverno há neve muito funda. É um dos maiores gatos do mundo. Tem o pelo grosso e uma camada de gordura debaixo da pele, por isso não tem medo do frio.',
   'Der Amurtiger lebt im Fernen Osten Russlands, wo im Winter tiefer Schnee liegt. Er ist eine der größten Katzen der Welt. Sein Fell ist dicht, und unter der Haut hat er eine Fettschicht, darum macht ihm der Frost nichts aus.'))
A(('Большая панда', 'Giant panda', 'Panda-gigante', 'Großer Panda'),
  ('Где живёт панда?', 'Where does the panda live?', 'Onde vive o panda?', 'Wo lebt der Panda?'),
  ('Большая панда живёт в горных лесах Китая. Почти весь день она жуёт бамбук — по двенадцать часов в сутки. Новорождённая панда весит примерно как яблоко!',
   'The giant panda lives in the mountain forests of China. It chews bamboo almost all day long, for twelve hours a day. A newborn panda weighs about as much as an apple!',
   'O panda-gigante vive nas florestas das montanhas da China. Passa quase o dia inteiro a mastigar bambu, doze horas por dia. Um panda bebé pesa mais ou menos o mesmo que uma maçã!',
   'Der Große Panda lebt in den Bergwäldern Chinas. Fast den ganzen Tag kaut er Bambus, zwölf Stunden am Tag. Ein neugeborener Panda wiegt ungefähr so viel wie ein Apfel!'))
A(('Японский макак', 'Japanese macaque', 'Macaco-japonês', 'Japanmakak'),
  ('Где живёт японский макак?', 'Where does the Japanese macaque live?', 'Onde vive o macaco-japonês?', 'Wo lebt der Japanmakak?'),
  ('Японские макаки живут в горах Японии, где зимой много снега. Они едят фрукты, листья и кору. В мороз эти обезьяны греются в горячих источниках, как в тёплой ванне.',
   'Japanese macaques live in the mountains of Japan, where there is lots of snow in winter. They eat fruit, leaves and bark. When it is freezing, these monkeys warm up in hot springs, like in a warm bath.',
   'Os macacos-japoneses vivem nas montanhas do Japão, onde no inverno há muita neve. Comem fruta, folhas e casca de árvore. Quando está muito frio, aquecem-se em fontes de água quente, como num banho quentinho.',
   'Japanmakaken leben in den Bergen Japans, wo im Winter viel Schnee liegt. Sie fressen Früchte, Blätter und Rinde. Bei Frost wärmen sich diese Affen in heißen Quellen, wie in einer warmen Badewanne.'))
A(('Бенгальский тигр', 'Bengal tiger', 'Tigre-de-bengala', 'Bengaltiger'),
  ('Где живёт бенгальский тигр?', 'Where does the Bengal tiger live?', 'Onde vive o tigre-de-bengala?', 'Wo lebt der Bengaltiger?'),
  ('Бенгальский тигр живёт в лесах Индии. Он охотится на оленей и диких кабанов. Полоски у каждого тигра свои, как узор на пальцах у человека.',
   'The Bengal tiger lives in the forests of India. It hunts deer and wild boar. Every tiger has its own stripes, like the pattern on a person\'s fingertips.',
   'O tigre-de-bengala vive nas florestas da Índia. Caça veados e javalis. Cada tigre tem as suas próprias riscas, como o desenho nas pontas dos nossos dedos.',
   'Der Bengaltiger lebt in den Wäldern Indiens. Er jagt Hirsche und Wildschweine. Jeder Tiger hat seine eigenen Streifen, wie das Muster auf unseren Fingerspitzen.'))
A(('Павлин', 'Peacock', 'Pavão', 'Pfau'),
  ('Где живёт павлин?', 'Where does the peacock live?', 'Onde vive o pavão?', 'Wo lebt der Pfau?'),
  ('Павлин — главная птица Индии. Он ест семена, насекомых и даже маленьких змей. Павлин раскрывает огромный хвост-веер с узором из «глазков», чтобы покрасоваться перед павой.',
   'The peacock is the national bird of India. It eats seeds, insects and even small snakes. The peacock spreads out its huge fan of a tail with its pattern of "eyes" to show off to the peahen.',
   'O pavão é a ave nacional da Índia. Come sementes, insetos e até cobras pequenas. O pavão abre a enorme cauda em leque, com desenhos de «olhos», para se exibir à pavoa.',
   'Der Pfau ist der Nationalvogel Indiens. Er frisst Samen, Insekten und sogar kleine Schlangen. Der Pfau schlägt ein Rad mit seinem riesigen Schwanz voller „Augen", um der Pfauenhenne zu gefallen.'))
A(('Орангутан', 'Orangutan', 'Orangotango', 'Orang-Utan'),
  ('Где живёт орангутан?', 'Where does the orangutan live?', 'Onde vive o orangotango?', 'Wo lebt der Orang-Utan?'),
  ('Орангутан живёт на островах Борнео и Суматра. Он ест фрукты, листья и кору. В дождь орангутан может накрыться большим листом, как зонтиком.',
   'The orangutan lives on the islands of Borneo and Sumatra. It eats fruit, leaves and bark. When it rains, an orangutan may hold a big leaf over its head, like an umbrella.',
   'O orangotango vive nas ilhas de Bornéu e Samatra. Come fruta, folhas e casca de árvore. Quando chove, o orangotango pode tapar-se com uma folha grande, como um guarda-chuva.',
   'Der Orang-Utan lebt auf den Inseln Borneo und Sumatra. Er frisst Früchte, Blätter und Rinde. Wenn es regnet, hält sich ein Orang-Utan manchmal ein großes Blatt wie einen Regenschirm über den Kopf.'))
A(('Комодский варан', 'Komodo dragon', 'Dragão-de-komodo', 'Komodowaran'),
  ('Где живёт комодский варан?', 'Where does the Komodo dragon live?', 'Onde vive o dragão-de-komodo?', 'Wo lebt der Komodowaran?'),
  ('Комодский варан — самая большая ящерица на свете, длиной до трёх метров. Он живёт на нескольких островах Индонезии и охотится на оленей и кабанов. Запах добычи варан чует своим раздвоенным языком.',
   'The Komodo dragon is the biggest lizard in the world, up to three metres long. It lives on a few islands in Indonesia and hunts deer and wild boar. It smells its prey with its forked tongue.',
   'O dragão-de-komodo é o maior lagarto do mundo, com até três metros de comprimento. Vive em algumas ilhas da Indonésia e caça veados e javalis. Sente o cheiro das presas com a língua bifurcada.',
   'Der Komodowaran ist die größte Echse der Welt, bis zu drei Meter lang. Er lebt auf ein paar Inseln in Indonesien und jagt Hirsche und Wildschweine. Den Geruch seiner Beute spürt er mit seiner gespaltenen Zunge.'))
A(('Кенгуру', 'Kangaroo', 'Canguru', 'Känguru'),
  ('Где живёт кенгуру?', 'Where does the kangaroo live?', 'Onde vive o canguru?', 'Wo lebt das Känguru?'),
  ('Кенгуру живёт в Австралии. Он ест траву и листья. Кенгурёнок растёт в сумке на мамином животе, а большой кенгуру одним прыжком пролетает дальше, чем длина машины.',
   'The kangaroo lives in Australia. It eats grass and leaves. A baby kangaroo grows up in a pouch on its mummy\'s tummy, and a big kangaroo can jump further than the length of a car in one hop.',
   'O canguru vive na Austrália. Come erva e folhas. O canguru bebé cresce numa bolsa na barriga da mãe, e um canguru grande salta, de uma só vez, mais longe do que o comprimento de um carro.',
   'Das Känguru lebt in Australien. Es frisst Gras und Blätter. Das Kängurubaby wächst im Beutel am Bauch der Mama auf, und ein großes Känguru springt mit einem Satz weiter, als ein Auto lang ist.'))
A(('Коала', 'Koala', 'Coala', 'Koala'),
  ('Где живёт коала?', 'Where does the koala live?', 'Onde vive o coala?', 'Wo lebt der Koala?'),
  ('Коала живёт на востоке Австралии, на эвкалиптовых деревьях. Она ест только листья эвкалипта. Коала спит почти весь день — до двадцати часов в сутки!',
   'The koala lives in the east of Australia, in eucalyptus trees. It eats only eucalyptus leaves. A koala sleeps almost all day, up to twenty hours a day!',
   'O coala vive no leste da Austrália, nos eucaliptos. Só come folhas de eucalipto. O coala dorme quase o dia todo, até vinte horas por dia!',
   'Der Koala lebt im Osten Australiens, auf Eukalyptusbäumen. Er frisst nur Eukalyptusblätter. Ein Koala schläft fast den ganzen Tag, bis zu zwanzig Stunden!'))
A(('Рыба-клоун', 'Clownfish', 'Peixe-palhaço', 'Clownfisch'),
  ('Где живёт рыба-клоун?', 'Where does the clownfish live?', 'Onde vive o peixe-palhaço?', 'Wo lebt der Clownfisch?'),
  ('Рыба-клоун живёт в тёплом море среди кораллов, например у Большого Барьерного рифа в Австралии. Она прячется в щупальцах актинии: те жалят других рыб, а её — нет. Ест она крошечных рачков и водоросли.',
   'The clownfish lives in the warm sea among the corals, for example at the Great Barrier Reef in Australia. It hides in the tentacles of a sea anemone: they sting other fish, but not the clownfish. It eats tiny shrimps and seaweed.',
   'O peixe-palhaço vive no mar quente, entre os corais, por exemplo na Grande Barreira de Coral, na Austrália. Esconde-se nos tentáculos de uma anémona: eles picam os outros peixes, mas a ele não. Come camarõezinhos minúsculos e algas.',
   'Der Clownfisch lebt im warmen Meer zwischen den Korallen, zum Beispiel am Großen Barriereriff in Australien. Er versteckt sich in den Tentakeln einer Seeanemone: Die nesseln andere Fische, ihn aber nicht. Er frisst winzige Krebschen und Algen.'))
A(('Верблюд', 'Camel', 'Camelo', 'Kamel'),
  ('Где живёт верблюд?', 'Where does the camel live?', 'Onde vive o camelo?', 'Wo lebt das Kamel?'),
  ('Одногорбый верблюд живёт в жарких пустынях Африки и Аравии. Он ест колючки и сухую траву. В горбе у верблюда не вода, а жир — запас еды на трудные дни.',
   'The one-humped camel lives in the hot deserts of Africa and Arabia. It eats thorny plants and dry grass. A camel\'s hump is not full of water but of fat, a store of food for hard days.',
   'O dromedário, o camelo de uma bossa, vive nos desertos quentes de África e da Arábia. Come plantas com espinhos e erva seca. A bossa não tem água, tem gordura: uma reserva de comida para os dias difíceis.',
   'Das einhöckrige Kamel lebt in den heißen Wüsten Afrikas und Arabiens. Es frisst dornige Pflanzen und trockenes Gras. Im Höcker ist kein Wasser, sondern Fett, ein Vorrat an Essen für schwere Tage.'))
A(('Фенек', 'Fennec fox', 'Feneco', 'Wüstenfuchs'),
  ('Где живёт фенек?', 'Where does the fennec fox live?', 'Onde vive o feneco?', 'Wo lebt der Wüstenfuchs?'),
  ('Фенек — самая маленькая лисичка на свете. Он живёт в пустыне Сахара и ест насекомых, ящериц и коренья. Огромные уши помогают ему слышать добычу под песком и не перегреваться в жару.',
   'The fennec is the smallest fox in the world. It lives in the Sahara Desert and eats insects, lizards and roots. Its huge ears help it hear prey under the sand and stay cool in the heat.',
   'O feneco é a raposa mais pequena do mundo. Vive no deserto do Saara e come insetos, lagartixas e raízes. As orelhas enormes ajudam-no a ouvir as presas debaixo da areia e a não aquecer demasiado com o calor.',
   'Der Fennek ist der kleinste Fuchs der Welt. Er lebt in der Wüste Sahara und frisst Insekten, Eidechsen und Wurzeln. Seine riesigen Ohren helfen ihm, Beute unter dem Sand zu hören und in der Hitze nicht zu überhitzen.'))
A(('Нильский крокодил', 'Nile crocodile', 'Crocodilo-do-nilo', 'Nilkrokodil'),
  ('Где живёт нильский крокодил?', 'Where does the Nile crocodile live?', 'Onde vive o crocodilo-do-nilo?', 'Wo lebt das Nilkrokodil?'),
  ('Нильский крокодил живёт в реках Африки. Он ест рыбу и подстерегает зверей, которые пришли на водопой. Мама-крокодил переносит малышей к воде прямо в пасти.',
   'The Nile crocodile lives in the rivers of Africa. It eats fish and lies in wait for animals that come to drink. A mummy crocodile carries her babies to the water in her mouth.',
   'O crocodilo-do-nilo vive nos rios de África. Come peixe e espera, escondido, pelos animais que vêm beber água. A mãe crocodilo leva os filhotes até à água dentro da boca.',
   'Das Nilkrokodil lebt in den Flüssen Afrikas. Es frisst Fische und lauert auf Tiere, die zum Trinken kommen. Die Krokodilmama trägt ihre Babys im Maul zum Wasser.'))
A(('Горилла', 'Gorilla', 'Gorila', 'Gorilla'),
  ('Где живёт горилла?', 'Where does the gorilla live?', 'Onde vive o gorila?', 'Wo lebt der Gorilla?'),
  ('Горилла живёт в тропических лесах Африки. Она ест листья, стебли и фрукты. Горилла — самая большая обезьяна на свете, и каждый вечер она строит себе гнездо для сна из веток и листьев.',
   'The gorilla lives in the rainforests of Africa. It eats leaves, stems and fruit. The gorilla is the biggest ape in the world, and every evening it builds itself a nest of branches and leaves to sleep in.',
   'O gorila vive nas florestas tropicais de África. Come folhas, caules e fruta. O gorila é o maior macaco do mundo, e todas as noites faz um ninho de ramos e folhas para dormir.',
   'Der Gorilla lebt in den Regenwäldern Afrikas. Er frisst Blätter, Stängel und Früchte. Der Gorilla ist der größte Affe der Welt, und jeden Abend baut er sich ein Schlafnest aus Ästen und Blättern.'))
A(('Жираф', 'Giraffe', 'Girafa', 'Giraffe'),
  ('Где живёт жираф?', 'Where does the giraffe live?', 'Onde vive a girafa?', 'Wo lebt die Giraffe?'),
  ('Жираф живёт в африканской саванне. Он ест листья акации с самых верхушек деревьев. Язык у жирафа тёмный и длинный — почти полметра!',
   'The giraffe lives in the African savannah. It eats acacia leaves from the very tops of the trees. A giraffe\'s tongue is dark and long, almost half a metre!',
   'A girafa vive na savana africana. Come folhas de acácia lá do cimo das árvores. A língua da girafa é escura e comprida, quase meio metro!',
   'Die Giraffe lebt in der afrikanischen Savanne. Sie frisst Akazienblätter ganz oben aus den Baumkronen. Ihre Zunge ist dunkel und lang, fast einen halben Meter!'))
A(('Лев', 'Lion', 'Leão', 'Löwe'),
  ('Где живёт лев?', 'Where does the lion live?', 'Onde vive o leão?', 'Wo lebt der Löwe?'),
  ('Лев живёт в африканской саванне, где много травы и мало деревьев. Львы охотятся на зебр и антилоп, и чаще всего охотятся львицы. Рык льва слышно за восемь километров.',
   'The lion lives in the African savannah, where there is lots of grass and few trees. Lions hunt zebras and antelopes, and it is mostly the lionesses who hunt. You can hear a lion\'s roar eight kilometres away.',
   'O leão vive na savana africana, onde há muita erva e poucas árvores. Os leões caçam zebras e antílopes, e quem caça mais são as leoas. O rugido do leão ouve-se a oito quilómetros.',
   'Der Löwe lebt in der afrikanischen Savanne, wo es viel Gras und wenige Bäume gibt. Löwen jagen Zebras und Antilopen, und meistens jagen die Löwinnen. Das Brüllen eines Löwen hört man acht Kilometer weit.'))
A(('Бегемот', 'Hippo', 'Hipopótamo', 'Nilpferd'),
  ('Где живёт бегемот?', 'Where does the hippo live?', 'Onde vive o hipopótamo?', 'Wo lebt das Nilpferd?'),
  ('Бегемот живёт в реках и озёрах Африки. Днём он лежит в воде, а ночью выходит на берег есть траву. Плавать бегемоты не умеют — они бегают по дну!',
   'The hippo lives in the rivers and lakes of Africa. In the daytime it lies in the water, and at night it comes out onto the bank to eat grass. Hippos can\'t swim: they run along the bottom!',
   'O hipopótamo vive nos rios e lagos de África. De dia fica deitado na água e à noite sai para a margem para comer erva. Os hipopótamos não sabem nadar: correm pelo fundo!',
   'Das Nilpferd lebt in den Flüssen und Seen Afrikas. Am Tag liegt es im Wasser, und nachts kommt es ans Ufer und frisst Gras. Nilpferde können nicht schwimmen, sie laufen über den Grund!'))
A(('Африканский слон', 'African elephant', 'Elefante-africano', 'Afrikanischer Elefant'),
  ('Где живёт африканский слон?', 'Where does the African elephant live?', 'Onde vive o elefante-africano?', 'Wo lebt der Afrikanische Elefant?'),
  ('Африканский слон — самое большое животное на суше. Он съедает больше ста килограммов травы, веток и фруктов в день. Хоботом слон набирает воду, нюхает, поднимает брёвна и гладит слонят.',
   'The African elephant is the biggest animal on land. It eats more than a hundred kilograms of grass, branches and fruit a day. With its trunk an elephant sucks up water, smells, lifts logs and strokes its babies.',
   'O elefante-africano é o maior animal em terra. Come mais de cem quilos de erva, ramos e fruta por dia. Com a tromba, o elefante apanha água, cheira, levanta troncos e faz festinhas aos filhotes.',
   'Der Afrikanische Elefant ist das größte Tier an Land. Er frisst über hundert Kilo Gras, Zweige und Früchte am Tag. Mit dem Rüssel saugt er Wasser auf, riecht, hebt Baumstämme und streichelt seine Kinder.'))
A(('Зебра', 'Zebra', 'Zebra', 'Zebra'),
  ('Где живёт зебра?', 'Where does the zebra live?', 'Onde vive a zebra?', 'Wo lebt das Zebra?'),
  ('Зебра живёт в африканской саванне и ест траву. Полоски у каждой зебры свои, двух одинаковых не бывает. Учёные думают, что полоски помогают отгонять кусачих мух.',
   'The zebra lives in the African savannah and eats grass. Every zebra has its own stripes, no two are the same. Scientists think the stripes help keep biting flies away.',
   'A zebra vive na savana africana e come erva. Cada zebra tem as suas riscas, não há duas iguais. Os cientistas pensam que as riscas ajudam a afastar as moscas que picam.',
   'Das Zebra lebt in der afrikanischen Savanne und frisst Gras. Jedes Zebra hat seine eigenen Streifen, keine zwei sind gleich. Forscher glauben, dass die Streifen beißende Fliegen fernhalten.'))
A(('Носорог', 'Rhino', 'Rinoceronte', 'Nashorn'),
  ('Где живёт носорог?', 'Where does the rhino live?', 'Onde vive o rinoceronte?', 'Wo lebt das Nashorn?'),
  ('Носорог живёт в саваннах Африки и ест траву и ветки. Его рог сделан из того же вещества, что и наши ногти. Видит носорог плохо, зато отлично слышит и чует запахи.',
   'The rhino lives in the savannahs of Africa and eats grass and branches. Its horn is made of the same stuff as our fingernails. A rhino can\'t see very well, but it hears and smells brilliantly.',
   'O rinoceronte vive nas savanas de África e come erva e ramos. O corno dele é feito da mesma matéria que as nossas unhas. O rinoceronte vê mal, mas ouve e cheira muito bem.',
   'Das Nashorn lebt in den Savannen Afrikas und frisst Gras und Zweige. Sein Horn ist aus demselben Stoff wie unsere Fingernägel. Ein Nashorn sieht schlecht, aber es hört und riecht sehr gut.'))
A(('Пиренейская рысь', 'Iberian lynx', 'Lince-ibérico', 'Pardelluchs'),
  ('Где живёт пиренейская рысь?', 'Where does the Iberian lynx live?', 'Onde vive o lince-ibérico?', 'Wo lebt der Pardelluchs?'),
  ('Пиренейская рысь живёт только в Испании и Португалии. Она охотится почти только на кроликов. На кончиках ушей у неё чёрные кисточки, а на щеках — пушистые бакенбарды.',
   'The Iberian lynx lives only in Spain and Portugal. It hunts almost nothing but rabbits. It has black tufts on the tips of its ears and fluffy whiskers on its cheeks.',
   'O lince-ibérico vive só em Espanha e em Portugal. Caça quase só coelhos. Tem tufos pretos nas pontas das orelhas e suíças fofas nas bochechas.',
   'Der Pardelluchs lebt nur in Spanien und Portugal. Er jagt fast nur Kaninchen. An den Ohrspitzen hat er schwarze Pinsel und an den Wangen einen flauschigen Backenbart.'))
A(('Дельфин-афалина', 'Bottlenose dolphin', 'Golfinho-roaz', 'Großer Tümmler'),
  ('Где живёт дельфин?', 'Where does the dolphin live?', 'Onde vive o golfinho?', 'Wo lebt der Delfin?'),
  ('Дельфины живут в морях и океанах, а в устье реки Саду в Португалии живёт целая семья дельфинов-афалин. Они едят рыбу и переговариваются свистом. Дельфин спит половинкой мозга: одна отдыхает, а другая следит, чтобы он вовремя выплыл подышать.',
   'Dolphins live in seas and oceans, and in the mouth of the river Sado in Portugal there lives a whole family of bottlenose dolphins. They eat fish and talk to each other by whistling. A dolphin sleeps with half of its brain: one half rests, and the other makes sure it comes up for air in time.',
   'Os golfinhos vivem nos mares e oceanos, e no estuário do rio Sado, em Portugal, vive uma família inteira de golfinhos-roazes. Comem peixe e falam uns com os outros com assobios. O golfinho dorme com metade do cérebro: uma metade descansa e a outra está atenta para ele vir respirar a tempo.',
   'Delfine leben in Meeren und Ozeanen, und in der Mündung des Flusses Sado in Portugal lebt eine ganze Familie von Großen Tümmlern. Sie fressen Fische und unterhalten sich mit Pfiffen. Ein Delfin schläft mit einer Hälfte seines Gehirns: Die eine ruht, und die andere passt auf, dass er rechtzeitig zum Atmen auftaucht.'))
A(('Фламинго', 'Flamingo', 'Flamingo', 'Flamingo'),
  ('Где живёт фламинго?', 'Where does the flamingo live?', 'Onde vive o flamingo?', 'Wo lebt der Flamingo?'),
  ('Фламинго живут у солёных озёр и лагун — в Африке, в Южной Америке и даже во Франции, Испании и Португалии. Они едят крошечных рачков, и от этой еды их перья становятся розовыми. Спят фламинго часто стоя на одной ноге.',
   'Flamingos live by salty lakes and lagoons, in Africa, in South America and even in France, Spain and Portugal. They eat tiny shrimps, and this food turns their feathers pink. Flamingos often sleep standing on one leg.',
   'Os flamingos vivem junto a lagos e lagoas de água salgada, em África, na América do Sul e até em França, Espanha e Portugal. Comem camarõezinhos minúsculos, e é essa comida que lhes deixa as penas cor-de-rosa. Os flamingos dormem muitas vezes em cima de uma perna só.',
   'Flamingos leben an salzigen Seen und Lagunen, in Afrika, in Südamerika und sogar in Frankreich, Spanien und Portugal. Sie fressen winzige Krebschen, und von diesem Futter werden ihre Federn rosa. Flamingos schlafen oft auf einem Bein.'))
A(('Ёж', 'Hedgehog', 'Ouriço-cacheiro', 'Igel'),
  ('Где живёт ёж?', 'Where does the hedgehog live?', 'Onde vive o ouriço-cacheiro?', 'Wo lebt der Igel?'),
  ('Ёж живёт в Европе — в садах, парках и лесах. Он ест жуков, червяков и улиток. На спине у ежа тысячи иголок, а когда ему страшно, он сворачивается колючим шариком.',
   'The hedgehog lives in Europe, in gardens, parks and woods. It eats beetles, worms and snails. A hedgehog has thousands of spines on its back, and when it is scared it curls up into a prickly ball.',
   'O ouriço-cacheiro vive na Europa, em jardins, parques e bosques. Come escaravelhos, minhocas e caracóis. Tem milhares de picos nas costas e, quando tem medo, enrola-se numa bola de picos.',
   'Der Igel lebt in Europa, in Gärten, Parks und Wäldern. Er frisst Käfer, Würmer und Schnecken. Auf dem Rücken hat er tausende Stacheln, und wenn er Angst hat, rollt er sich zu einer stacheligen Kugel zusammen.'))
A(('Белый аист', 'White stork', 'Cegonha-branca', 'Weißstorch'),
  ('Где живёт белый аист?', 'Where does the white stork live?', 'Onde vive a cegonha-branca?', 'Wo lebt der Weißstorch?'),
  ('Белый аист весной прилетает в Германию из Африки. Он ест лягушек, мышей и кузнечиков. Аисты строят огромные гнёзда на крышах и столбах и каждый год возвращаются в своё гнездо.',
   'In spring the white stork flies to Germany from Africa. It eats frogs, mice and grasshoppers. Storks build huge nests on roofs and poles and come back to the same nest every year.',
   'Na primavera, a cegonha-branca chega à Alemanha vinda de África. Come rãs, ratos e gafanhotos. As cegonhas fazem ninhos enormes em telhados e postes e todos os anos voltam ao mesmo ninho.',
   'Im Frühling fliegt der Weißstorch aus Afrika nach Deutschland. Er frisst Frösche, Mäuse und Heuschrecken. Störche bauen riesige Nester auf Dächern und Masten und kehren jedes Jahr zu ihrem Nest zurück.'))
A(('Синий кит', 'Blue whale', 'Baleia-azul', 'Blauwal'),
  ('Где живёт синий кит?', 'Where does the blue whale live?', 'Onde vive a baleia-azul?', 'Wo lebt der Blauwal?'),
  ('Синий кит живёт в океанах. Это самое большое животное на свете — больше любого динозавра. Ест он крошечных рачков, а сердце у него размером с маленькую машину.',
   'The blue whale lives in the oceans. It is the biggest animal in the world, bigger than any dinosaur. It eats tiny shrimps, and its heart is the size of a small car.',
   'A baleia-azul vive nos oceanos. É o maior animal do mundo, maior do que qualquer dinossauro. Come camarõezinhos minúsculos, e o coração dela é do tamanho de um carro pequeno.',
   'Der Blauwal lebt in den Ozeanen. Er ist das größte Tier der Welt, größer als jeder Dinosaurier. Er frisst winzige Krebschen, und sein Herz ist so groß wie ein kleines Auto.'))
A(('Ленивец', 'Sloth', 'Preguiça', 'Faultier'),
  ('Где живёт ленивец?', 'Where does the sloth live?', 'Onde vive a preguiça?', 'Wo lebt das Faultier?'),
  ('Ленивец живёт в тропических лесах Бразилии и висит на деревьях вниз головой. Он ест листья. Ленивец такой медленный, что в его шерсти растут крошечные зелёные водоросли.',
   'The sloth lives in the rainforests of Brazil and hangs upside down in the trees. It eats leaves. A sloth is so slow that tiny green algae grow in its fur.',
   'A preguiça vive nas florestas tropicais do Brasil e fica pendurada nas árvores de cabeça para baixo. Come folhas. A preguiça é tão lenta que no pelo dela crescem algas verdes minúsculas.',
   'Das Faultier lebt in den Regenwäldern Brasiliens und hängt kopfüber in den Bäumen. Es frisst Blätter. Ein Faultier ist so langsam, dass in seinem Fell winzige grüne Algen wachsen.'))
A(('Попугай ара', 'Macaw', 'Arara', 'Ara'),
  ('Где живёт попугай ара?', 'Where does the macaw live?', 'Onde vive a arara?', 'Wo lebt der Ara?'),
  ('Ара — большой яркий попугай из лесов Южной Америки. Он ест орехи и семена и раскалывает их крепким клювом. Живут ары очень долго — бывает, больше пятидесяти лет.',
   'The macaw is a big, bright parrot from the forests of South America. It eats nuts and seeds and cracks them open with its strong beak. Macaws live a very long time, sometimes more than fifty years.',
   'A arara é um papagaio grande e colorido das florestas da América do Sul. Come nozes e sementes e parte-as com o bico forte. As araras vivem muito tempo, às vezes mais de cinquenta anos.',
   'Der Ara ist ein großer, bunter Papagei aus den Wäldern Südamerikas. Er frisst Nüsse und Samen und knackt sie mit seinem kräftigen Schnabel. Aras leben sehr lange, manchmal über fünfzig Jahre.'))
A(('Ягуар', 'Jaguar', 'Jaguar', 'Jaguar'),
  ('Где живёт ягуар?', 'Where does the jaguar live?', 'Onde vive o jaguar?', 'Wo lebt der Jaguar?'),
  ('Ягуар живёт в лесах и на болотах Южной Америки. Он охотится на капибар, черепах и рыбу. В отличие от многих кошек, ягуар любит воду и отлично плавает.',
   'The jaguar lives in the forests and swamps of South America. It hunts capybaras, turtles and fish. Unlike lots of cats, the jaguar loves water and is a brilliant swimmer.',
   'O jaguar vive nas florestas e pântanos da América do Sul. Caça capivaras, tartarugas e peixes. Ao contrário de muitos gatos, o jaguar gosta de água e nada muito bem.',
   'Der Jaguar lebt in den Wäldern und Sümpfen Südamerikas. Er jagt Wasserschweine, Schildkröten und Fische. Anders als viele Katzen mag der Jaguar Wasser und schwimmt sehr gut.'))
A(('Лама', 'Llama', 'Lama', 'Lama'),
  ('Где живёт лама?', 'Where does the llama live?', 'Onde vive o lama?', 'Wo lebt das Lama?'),
  ('Лама живёт высоко в горах Анды — в Перу, Боливии и Чили. Она ест траву. Если ламу рассердить, она может плюнуть!',
   'The llama lives high up in the Andes mountains, in Peru, Bolivia and Chile. It eats grass. If you make a llama cross, it might spit!',
   'O lama vive no alto das montanhas dos Andes, no Peru, na Bolívia e no Chile. Come erva. Se um lama ficar zangado, pode cuspir!',
   'Das Lama lebt hoch oben in den Anden, in Peru, Bolivien und Chile. Es frisst Gras. Wenn man ein Lama ärgert, kann es spucken!'))
A(('Бабочка-монарх', 'Monarch butterfly', 'Borboleta-monarca', 'Monarchfalter'),
  ('Где зимуют бабочки-монархи?', 'Where do monarch butterflies spend the winter?', 'Onde passam o inverno as borboletas-monarca?', 'Wo überwintern die Monarchfalter?'),
  ('Каждую осень бабочки-монархи летят из Канады и США в горы Мексики — за тысячи километров. Там они зимуют, облепив деревья так густо, что ветки становятся оранжевыми. Гусеницы монарха едят листья растения ваточника.',
   'Every autumn, monarch butterflies fly from Canada and the USA to the mountains of Mexico, thousands of kilometres away. There they spend the winter, covering the trees so thickly that the branches turn orange. Monarch caterpillars eat the leaves of a plant called milkweed.',
   'Todos os outonos, as borboletas-monarca voam do Canadá e dos EUA até às montanhas do México, a milhares de quilómetros. Lá passam o inverno, a cobrir as árvores tão juntinhas que os ramos ficam cor de laranja. As lagartas da monarca comem as folhas de uma planta chamada asclépia.',
   'Jeden Herbst fliegen Monarchfalter aus Kanada und den USA in die Berge Mexikos, tausende Kilometer weit. Dort überwintern sie und bedecken die Bäume so dicht, dass die Äste orange aussehen. Die Raupen fressen die Blätter einer Pflanze namens Seidenpflanze.'))
A(('Бизон', 'Bison', 'Bisonte', 'Bison'),
  ('Где живёт бизон?', 'Where does the bison live?', 'Onde vive o bisonte?', 'Wo lebt der Bison?'),
  ('Бизон живёт в прериях Северной Америки и ест траву. Это самый тяжёлый зверь Северной Америки. Зимой бизон разгребает снег огромной головой, чтобы добраться до травы.',
   'The bison lives on the prairies of North America and eats grass. It is the heaviest animal in North America. In winter the bison pushes the snow aside with its huge head to get to the grass.',
   'O bisonte vive nas pradarias da América do Norte e come erva. É o animal mais pesado da América do Norte. No inverno, o bisonte afasta a neve com a cabeça enorme para chegar à erva.',
   'Der Bison lebt in der Prärie Nordamerikas und frisst Gras. Er ist das schwerste Tier Nordamerikas. Im Winter schiebt der Bison mit seinem riesigen Kopf den Schnee weg, um ans Gras zu kommen.'))
A(('Енот', 'Raccoon', 'Guaxinim', 'Waschbär'),
  ('Где живёт енот?', 'Where does the raccoon live?', 'Onde vive o guaxinim?', 'Wo lebt der Waschbär?'),
  ('Енот живёт в лесах и даже в городах Северной Америки, а ещё в Германии — туда его когда-то привезли. Он ест всё подряд: лягушек, ягоды, орехи. Еду енот ощупывает лапками, будто руками, особенно в воде.',
   'The raccoon lives in the forests and even the towns of North America, and in Germany too, where people once brought it. It eats almost anything: frogs, berries, nuts. A raccoon feels its food with its paws, as if with hands, especially in water.',
   'O guaxinim vive nas florestas e até nas cidades da América do Norte, e também na Alemanha, para onde um dia o levaram. Come de tudo: rãs, bagas, nozes. O guaxinim apalpa a comida com as patinhas, como se fossem mãos, sobretudo dentro de água.',
   'Der Waschbär lebt in den Wäldern und sogar in den Städten Nordamerikas, und auch in Deutschland, wohin man ihn einmal gebracht hat. Er frisst fast alles: Frösche, Beeren, Nüsse. Sein Futter betastet er mit den Pfoten wie mit Händen, besonders im Wasser.'))
A(('Бобр', 'Beaver', 'Castor', 'Biber'),
  ('Где живёт бобр?', 'Where does the beaver live?', 'Onde vive o castor?', 'Wo lebt der Biber?'),
  ('Бобр — символ Канады. Он грызёт деревья крепкими оранжевыми зубами и строит на реках плотины и домики-хатки из веток и ила. Ест бобр кору, листья и водяные растения.',
   'The beaver is a symbol of Canada. It gnaws trees with its strong orange teeth and builds dams and little houses called lodges on rivers, out of branches and mud. A beaver eats bark, leaves and water plants.',
   'O castor é um símbolo do Canadá. Rói árvores com os dentes fortes cor de laranja e constrói nos rios represas e casinhas de ramos e lama. O castor come casca de árvore, folhas e plantas aquáticas.',
   'Der Biber ist ein Symbol Kanadas. Er nagt mit seinen kräftigen orangen Zähnen Bäume an und baut in Flüssen Dämme und Burgen aus Ästen und Schlamm. Der Biber frisst Rinde, Blätter und Wasserpflanzen.'))
A(('Белоголовый орлан', 'Bald eagle', 'Águia-de-cabeça-branca', 'Weißkopfseeadler'),
  ('Где живёт белоголовый орлан?', 'Where does the bald eagle live?', 'Onde vive a águia-de-cabeça-branca?', 'Wo lebt der Weißkopfseeadler?'),
  ('Белоголовый орлан живёт в Северной Америке, у рек, озёр и моря. Он ловит рыбу острыми когтями. Орланы год за годом достраивают одно гнездо, и оно может стать тяжелее легковой машины.',
   'The bald eagle lives in North America, by rivers, lakes and the sea. It catches fish with its sharp claws. Eagles add to the same nest year after year, and it can end up heavier than a car.',
   'A águia-de-cabeça-branca vive na América do Norte, junto a rios, lagos e ao mar. Apanha peixes com as garras afiadas. Estas águias vão aumentando o mesmo ninho ano após ano, e ele pode ficar mais pesado do que um carro.',
   'Der Weißkopfseeadler lebt in Nordamerika, an Flüssen, Seen und am Meer. Er fängt Fische mit seinen scharfen Krallen. Die Adler bauen Jahr für Jahr an demselben Nest weiter, und es kann schwerer werden als ein Auto.'))

# the screen
S('<div class="gl">\n      <div class="gl-box"><div class="gl-ball"><canvas id="glC" aria-label="Глобус"></canvas>\n        <div class="gl-zoom"><button class="ibtn" id="glIn" aria-label="Ближе">+</button><button class="ibtn" id="glOut" aria-label="Дальше">−</button></div></div></div>\n      <div class="gl-side"><div class="gl-modes" id="glModes"><button class="chip" data-m="c"><span class="emo">🗺️</span>Страны</button><button class="chip" data-m="a"><span class="emo">🐾</span>Животные</button><button class="chip" data-m="g"><span class="emo">🎯</span>Где живёт?</button></div>\n      <div class="gl-info" id="glInfo"><p class="gl-hint">👆 Покрути глобус пальцем и нажми на страну или на город.</p></div></div>\n    </div>',
  ('aria-label="Глобус"', 'aria-label="Globe"', 'aria-label="Globo"', 'aria-label="Globus"'),
  ('aria-label="Ближе"', 'aria-label="Closer"', 'aria-label="Mais perto"', 'aria-label="Näher"'),
  ('aria-label="Дальше"', 'aria-label="Further away"', 'aria-label="Mais longe"', 'aria-label="Weiter weg"'),
  ('Страны<', 'Countries<', 'Países<', 'Länder<'), ('Животные<', 'Animals<', 'Animais<', 'Tiere<'),
  ('Где живёт?<', 'Where does it live?<', 'Onde vive?<', 'Wo lebt es?<'),
  ('Покрути глобус пальцем и нажми на страну или на город.', 'Spin the globe with your finger and tap a country or a city.', 'Roda o globo com o dedo e toca num país ou numa cidade.', 'Dreh den Globus mit dem Finger und tippe auf ein Land oder eine Stadt.'))
T('Антарктида — ледяной материк вокруг Южного полюса. Людей здесь почти нет, только учёные на станциях, зато живут пингвины и тюлени.',
  'Antarctica is a continent of ice around the South Pole. Hardly any people live here, only scientists at research stations, but penguins and seals do.',
  'A Antártida é um continente de gelo à volta do Polo Sul. Quase não há pessoas, só cientistas nas estações, mas vivem cá pinguins e focas.',
  'Die Antarktis ist ein Kontinent aus Eis rund um den Südpol. Hier wohnen fast keine Menschen, nur Forscher auf Stationen, aber Pinguine und Robben leben hier.')
S('<h2 class="gl-t"><span>🧊</span> Антарктида</h2><p class="gl-s no-said">{0}</p>', ('Антарктида', 'Antarctica', 'Antártida', 'Antarktis'))
T('Антарктида', 'Antarctica', 'Antártida', 'Antarktis')
S('<h2 class="gl-t">{0}</h2><p class="gl-s">Про зверей этой страны я расскажу в другой раз. Нажми на картинку-зверя на глобусе!</p>',
  ('Про зверей этой страны я расскажу в другой раз. Нажми на картинку-зверя на глобусе!', 'I will tell you about the animals of this country another time. Tap an animal picture on the globe!', 'Sobre os animais deste país eu conto-te outro dia. Toca num animal no globo!', 'Von den Tieren dieses Landes erzähle ich dir ein andermal. Tippe auf ein Tierbild auf dem Globus!'))
T('{0}. Про зверей этой страны я расскажу в другой раз.', '{0}. I will tell you about the animals of this country another time.', '{0}. Sobre os animais deste país eu conto-te outro dia.', '{0}. Von den Tieren dieses Landes erzähle ich dir ein andermal.')
S('<h2 class="gl-t">{0}</h2><p class="gl-cap">Здесь живут:</p><div class="gl-go">{1}</div>', ('Здесь живут:', 'Who lives here:', 'Aqui vivem:', 'Hier leben:'))
T('{0}. Здесь живут: {1}.', '{0}. Who lives here: {1}.', '{0}. Aqui vivem: {1}.', '{0}. Hier leben: {1}.')
S('<h2 class="gl-t">{0} {1}</h2><p class="gl-s">Покрути глобус и нажми туда, где живёт этот зверь.</p><p class="gl-cap">⭐ {2}</p>',
  ('Покрути глобус и нажми туда, где живёт этот зверь.', 'Spin the globe and tap the place where this animal lives.', 'Roda o globo e toca no sítio onde vive este animal.', 'Dreh den Globus und tippe dorthin, wo dieses Tier lebt.'))
S('<h2 class="gl-t">{0} Правильно!</h2><p class="gl-s no-said">{1}</p><p class="gl-cap">⭐ {2}</p><div class="gl-go"><button class="chip" id="glNext"><span class="emo">▶️</span>Дальше</button></div>',
  ('Правильно!', 'Well done!', 'Certo!', 'Richtig!'), ('Дальше<', 'Next<', 'Seguinte<', 'Weiter<'))
T('Правильно! {0}', 'Well done! {0}', 'Certo! {0}', 'Richtig! {0}')
S('<h2 class="gl-t">{0} {1}</h2><p class="gl-s">Это {2}. Не здесь — попробуй ещё!</p><p class="gl-cap">⭐ {3}</p>',
  ('Это {2}. Не здесь — попробуй ещё!', '{2}. Not here, try again!', '{2}. Não é aqui, tenta outra vez!', '{2}. Nicht hier, versuch es noch einmal!'))
T('Это {0}. Не здесь — попробуй ещё!', '{0}. Not here, try again!', '{0}. Não é aqui, tenta outra vez!', '{0}. Nicht hier, versuch es noch einmal!')
S('<h2 class="gl-t">{0} {1}</h2><p class="gl-s">Это {2}. Подсказка: смотри, куда повернётся глобус, и нажми на зверя!</p><p class="gl-cap">⭐ {3}</p>',
  ('Это {2}. Подсказка: смотри, куда повернётся глобус, и нажми на зверя!', '{2}. A clue: watch where the globe turns, and tap the animal!', '{2}. Uma pista: vê para onde o globo roda e toca no animal!', '{2}. Ein Tipp: Schau, wohin sich der Globus dreht, und tippe auf das Tier!'))
T('Это {0}. Подсказка: смотри, куда повернётся глобус, и нажми на зверя!', '{0}. A clue: watch where the globe turns, and tap the animal!', '{0}. Uma pista: vê para onde o globo roda e toca no animal!', '{0}. Ein Tipp: Schau, wohin sich der Globus dreht, und tippe auf das Tier!')
S('<p class="gl-hint">🐾 Нажми на зверя — я расскажу, где он живёт. А если нажать на страну, узнаешь, кто там живёт.</p>',
  ('Нажми на зверя — я расскажу, где он живёт. А если нажать на страну, узнаешь, кто там живёт.', 'Tap an animal and I will tell you where it lives. And if you tap a country, you will find out who lives there.', 'Toca num animal e eu digo-te onde ele vive. E se tocares num país, ficas a saber quem vive lá.', 'Tippe auf ein Tier, und ich erzähle dir, wo es lebt. Und wenn du auf ein Land tippst, erfährst du, wer dort lebt.'))
T('Нажми на зверя на глобусе, и я расскажу, где он живёт. А если нажать на страну, узнаешь, кто там живёт.',
  'Tap an animal on the globe and I will tell you where it lives. And if you tap a country, you will find out who lives there.',
  'Toca num animal no globo e eu digo-te onde ele vive. E se tocares num país, ficas a saber quem vive lá.',
  'Tippe auf ein Tier auf dem Globus, und ich erzähle dir, wo es lebt. Und wenn du auf ein Land tippst, erfährst du, wer dort lebt.')
S('<p class="gl-hint">👆 Покрути глобус пальцем и нажми на страну или на город.</p>',
  ('Покрути глобус пальцем и нажми на страну или на город.', 'Spin the globe with your finger and tap a country or a city.', 'Roda o globo com o dedo e toca num país ou numa cidade.', 'Dreh den Globus mit dem Finger und tippe auf ein Land oder eine Stadt.'))

CYR = re.compile('[А-Яа-яЁё]'); n = 0
for k in [x for x in W if x.startswith('Это {') or 'Это {2}' in x]: miss.setdefault('GLOBE_SCREEN', []).append(k) if k not in miss.get('GLOBE_SCREEN', []) else None
for g, keys in miss.items():
    if g in ('GAMES', 'LEARN_IMG', 'SND_HI'): continue
    for k in keys:
        tr = W[k]
        assert not any(CYR.search(x) for x in tr), k
        for x in tr: assert x.count('{') == k.count('{'), k
        fixed.setdefault(g, {})[k] = list(tr[:2]); fde.setdefault(g, {})[k] = tr[2]; n += 1
json.dump(fixed, open(H + '/fixed.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
json.dump(fde, open(H + '/de/fixed_de.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('ok', n)
