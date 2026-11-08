# Globe feature: translations (TRAVEL button, GLOBE, GLOBE_CITIES, GLOBE_SCREEN)
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

# countries and capitals
for a in [
 ('Россия','Russia','Rússia','Russland'),('Москва','Moscow','Moscovo','Moskau'),
 ('Португалия','Portugal','Portugal','Portugal'),('Лиссабон','Lisbon','Lisboa','Lissabon'),
 ('Испания','Spain','Espanha','Spanien'),('Мадрид','Madrid','Madrid','Madrid'),
 ('Германия','Germany','Alemanha','Deutschland'),('Берлин','Berlin','Berlim','Berlin'),
 ('Франция','France','França','Frankreich'),('Париж','Paris','Paris','Paris'),
 ('Великобритания','the United Kingdom','o Reino Unido','Großbritannien'),('Лондон','London','Londres','London'),
 ('Италия','Italy','Itália','Italien'),('Рим','Rome','Roma','Rom'),
 ('США','the USA','os EUA','die USA'),('Вашингтон','Washington','Washington','Washington'),
 ('Канада','Canada','Canadá','Kanada'),('Оттава','Ottawa','Ottawa','Ottawa'),
 ('Бразилия','Brazil','Brasil','Brasilien'),('Бразилиа','Brasília','Brasília','Brasília'),
 ('Аргентина','Argentina','Argentina','Argentinien'),('Буэнос-Айрес','Buenos Aires','Buenos Aires','Buenos Aires'),
 ('Мексика','Mexico','México','Mexiko'),('Мехико','Mexico City','Cidade do México','Mexiko-Stadt'),
 ('Перу','Peru','Peru','Peru'),('Лима','Lima','Lima','Lima'),
 ('Китай','China','China','China'),('Пекин','Beijing','Pequim','Peking'),
 ('Япония','Japan','Japão','Japan'),('Токио','Tokyo','Tóquio','Tokio'),
 ('Индия','India','Índia','Indien'),('Нью-Дели','New Delhi','Nova Deli','Neu-Delhi'),
 ('Австралия','Australia','Austrália','Australien'),('Канберра','Canberra','Camberra','Canberra'),
 ('Новая Зеландия','New Zealand','Nova Zelândia','Neuseeland'),('Веллингтон','Wellington','Wellington','Wellington'),
 ('Египет','Egypt','Egito','Ägypten'),('Каир','Cairo','Cairo','Kairo'),
 ('Кения','Kenya','Quénia','Kenia'),('Найроби','Nairobi','Nairóbi','Nairobi'),
 ('Южная Африка','South Africa','África do Sul','Südafrika'),('Претория','Pretoria','Pretória','Pretoria'),
 ('Марокко','Morocco','Marrocos','Marokko'),('Рабат','Rabat','Rabat','Rabat'),
 ('Греция','Greece','Grécia','Griechenland'),('Афины','Athens','Atenas','Athen'),
 ('Турция','Turkey','Turquia','Türkei'),('Анкара','Ankara','Ancara','Ankara'),
 ('Норвегия','Norway','Noruega','Norwegen'),('Осло','Oslo','Oslo','Oslo'),
 ('Швеция','Sweden','Suécia','Schweden'),('Стокгольм','Stockholm','Estocolmo','Stockholm'),
 ('Финляндия','Finland','Finlândia','Finnland'),('Хельсинки','Helsinki','Helsínquia','Helsinki'),
 ('Нидерланды','the Netherlands','os Países Baixos','die Niederlande'),('Амстердам','Amsterdam','Amesterdão','Amsterdam'),
 ('Швейцария','Switzerland','Suíça','die Schweiz'),('Берн','Bern','Berna','Bern'),
 ('Исландия','Iceland','Islândia','Island'),('Рейкьявик','Reykjavik','Reiquejavique','Reykjavík'),
 ('Казахстан','Kazakhstan','Cazaquistão','Kasachstan'),('Астана','Astana','Astana','Astana'),
 ('Грузия','Georgia','Geórgia','Georgien'),('Тбилиси','Tbilisi','Tbilissi','Tiflis'),
 ('Армения','Armenia','Arménia','Armenien'),('Ереван','Yerevan','Erevan','Eriwan'),
 ('Кипр','Cyprus','Chipre','Zypern'),('Никосия','Nicosia','Nicósia','Nikosia'),
 ('Сербия','Serbia','Sérvia','Serbien'),('Белград','Belgrade','Belgrado','Belgrad'),
 ('Санкт-Петербург','Saint Petersburg','São Petersburgo','Sankt Petersburg'),
 ('Порту','Porto','Porto','Porto'),('Кашкайш','Cascais','Cascais','Cascais'),
 ('Барселона','Barcelona','Barcelona','Barcelona'),('Нью-Йорк','New York','Nova Iorque','New York'),
 ('Торонто','Toronto','Toronto','Toronto'),
 ('Северный Ледовитый океан','Arctic Ocean','Oceano Ártico','Arktischer Ozean'),
 ('Южный океан','Southern Ocean','Oceano Antártico','Südlicher Ozean'),
 ('Индийский океан','Indian Ocean','Oceano Índico','Indischer Ozean'),
 ('Атлантический океан','Atlantic Ocean','Oceano Atlântico','Atlantischer Ozean'),
 ('Тихий океан','Pacific Ocean','Oceano Pacífico','Pazifischer Ozean'),
 ('Глобус','Globe','Globo','Globus'),
]: T(*a)

# country texts
T('Россия — самая большая страна на свете. Когда на одном её краю люди ложатся спать, на другом уже наступает утро. Здесь есть озеро Байкал — самое глубокое на Земле.',
 'Russia is the biggest country in the world. When people at one end of it go to bed, it is already morning at the other end. Here is Lake Baikal, the deepest lake on Earth.',
 'A Rússia é o maior país do mundo. Quando numa ponta as pessoas vão dormir, na outra já é de manhã. Aqui fica o lago Baikal, o mais fundo da Terra.',
 'Russland ist das größte Land der Welt. Wenn die Menschen am einen Ende ins Bett gehen, ist am anderen Ende schon Morgen. Hier liegt der Baikalsee, der tiefste See der Erde.')
T('В Москве стоит Кремль с красными стенами и башнями. На Спасской башне живут главные часы страны — куранты.',
 'In Moscow stands the Kremlin, with its red walls and towers. On the Spasskaya Tower lives the most important clock in the country, the chiming clock.',
 'Em Moscovo fica o Kremlin, com as suas muralhas e torres vermelhas. Na Torre Spasskaya vive o relógio mais importante do país, que toca as horas.',
 'In Moskau steht der Kreml mit roten Mauern und Türmen. Auf dem Spasski-Turm wohnt die wichtigste Uhr des Landes, die Glockenuhr.')
T('Португалия стоит на самом краю Европы, у Атлантического океана. Отсюда много лет назад уплывали на парусных кораблях смелые мореплаватели. А ещё здесь пекут маленькие пирожные с заварным кремом.',
 'Portugal is at the very edge of Europe, by the Atlantic Ocean. Long ago, brave sailors set off from here in sailing ships. And here they bake little cakes filled with custard.',
 'Portugal fica mesmo na ponta da Europa, junto ao oceano Atlântico. Daqui partiram, há muitos anos, marinheiros corajosos em barcos à vela. E aqui fazem-se bolinhos com creme de ovos.',
 'Portugal liegt ganz am Rand von Europa, am Atlantischen Ozean. Von hier aus segelten vor vielen Jahren mutige Seefahrer in Segelschiffen los. Und hier backt man kleine Törtchen mit Vanillecreme.')
T('Лиссабон стоит на семи холмах. По его крутым улочкам ездят маленькие жёлтые трамвайчики.',
 'Lisbon is built on seven hills. Little yellow trams rattle along its steep streets.',
 'Lisboa fica em sete colinas. Pelas suas ruas íngremes andam pequenos elétricos amarelos.',
 'Lissabon liegt auf sieben Hügeln. Durch die steilen Gassen fahren kleine gelbe Straßenbahnen.')
T('В Испании тепло и много солнца. Здесь танцуют фламенко под стук кастаньет и готовят паэлью — рис с овощами и морепродуктами.',
 'Spain is warm and sunny. People dance flamenco to the clicking of castanets, and cook paella, which is rice with vegetables and seafood.',
 'Em Espanha está calor e há muito sol. Aqui dança-se flamenco ao som das castanholas e faz-se paelha, arroz com legumes e marisco.',
 'In Spanien ist es warm und sonnig. Hier tanzt man Flamenco zum Klappern der Kastagnetten und kocht Paella, das ist Reis mit Gemüse und Meeresfrüchten.')
T('В Мадриде есть огромный музей Прадо со старинными картинами. А в центре города стоит памятник медведю, который тянется к ягодам на дереве.',
 'Madrid has a huge museum, the Prado, full of old paintings. And in the middle of the city stands a statue of a bear reaching for berries on a tree.',
 'Em Madrid há um museu enorme, o Prado, com quadros antigos. E no centro da cidade há uma estátua de um urso que se estica para chegar às bagas de uma árvore.',
 'In Madrid gibt es das riesige Prado-Museum mit alten Bildern. Und mitten in der Stadt steht ein Denkmal von einem Bären, der sich nach Beeren an einem Baum streckt.')
T('В Германии много старинных замков, будто из сказки. Здесь жили братья Гримм, которые записали сказки про Белоснежку и Бременских музыкантов.',
 'Germany has many old castles, like in a fairy tale. The Brothers Grimm lived here. They wrote down the stories of Snow White and the Town Musicians of Bremen.',
 'A Alemanha tem muitos castelos antigos, como nos contos de fadas. Aqui viveram os irmãos Grimm, que escreveram as histórias da Branca de Neve e dos Músicos de Bremen.',
 'In Deutschland gibt es viele alte Schlösser, wie im Märchen. Hier lebten die Brüder Grimm. Sie schrieben die Märchen von Schneewittchen und den Bremer Stadtmusikanten auf.')
T('В Берлине стоят Бранденбургские ворота, а на них — колесница с четвёркой коней. Когда-то город был разделён стеной, а теперь он снова вместе.',
 'In Berlin stands the Brandenburg Gate, with a chariot and four horses on top. Once the city was split by a wall, but now it is together again.',
 'Em Berlim fica a Porta de Brandemburgo, com uma carruagem de quatro cavalos no topo. Um dia a cidade foi dividida por um muro, mas agora está outra vez junta.',
 'In Berlin steht das Brandenburger Tor, und oben darauf ein Wagen mit vier Pferden. Einmal war die Stadt durch eine Mauer geteilt, aber jetzt ist sie wieder zusammen.')
T('Франция славится длинными хрустящими багетами и сырами — их здесь сотни разных. Во Франции много старинных замков и виноградников.',
 'France is famous for long, crusty baguettes and for cheese, with hundreds of kinds. France also has many old castles and vineyards.',
 'A França é famosa pelas baguetes compridas e estaladiças e pelos queijos, há centenas de tipos. Na França há também muitos castelos antigos e vinhas.',
 'Frankreich ist berühmt für lange, knusprige Baguettes und für Käse, es gibt hunderte Sorten. In Frankreich gibt es auch viele alte Schlösser und Weinberge.')
T('В Париже стоит Эйфелева башня. Она железная и такая высокая, что с неё виден весь город.',
 'In Paris stands the Eiffel Tower. It is made of iron and so tall that you can see the whole city from the top.',
 'Em Paris fica a Torre Eiffel. É de ferro e tão alta que de lá de cima se vê a cidade toda.',
 'In Paris steht der Eiffelturm. Er ist aus Eisen und so hoch, dass man von oben die ganze Stadt sieht.')
T('Великобритания — страна на островах. Там часто идёт дождь, поэтому здесь так любят горячий чай. По улицам ездят красные двухэтажные автобусы.',
 'The United Kingdom is a country on islands. It often rains there, so people love a hot cup of tea. Red double-decker buses drive along the streets.',
 'O Reino Unido é um país de ilhas. Chove muitas vezes, por isso as pessoas gostam tanto de chá quente. Pelas ruas andam autocarros vermelhos de dois andares.',
 'Großbritannien ist ein Land auf Inseln. Dort regnet es oft, darum trinken die Leute so gern heißen Tee. Durch die Straßen fahren rote Doppeldeckerbusse.')
T('В Лондоне есть башня с большими часами, их колокол зовут Биг-Бен. А дворец короля охраняют гвардейцы в высоких меховых шапках.',
 'London has a tower with a big clock, and its bell is called Big Ben. The king\'s palace is guarded by soldiers in tall furry hats.',
 'Em Londres há uma torre com um relógio grande, e o sino chama-se Big Ben. O palácio do rei é guardado por soldados com chapéus altos de pelo.',
 'In London gibt es einen Turm mit einer großen Uhr, ihre Glocke heißt Big Ben. Den Palast des Königs bewachen Soldaten mit hohen Fellmützen.')
T('Италия на карте похожа на сапожок. Именно отсюда пришли к нам пицца и макароны.',
 'On the map, Italy looks like a little boot. Pizza and pasta come from here.',
 'No mapa, a Itália parece uma botinha. Foi daqui que vieram a pizza e a massa.',
 'Auf der Karte sieht Italien aus wie ein kleiner Stiefel. Von hier kommen Pizza und Nudeln.')
T('Рим — очень древний город. В нём стоит Колизей — огромный каменный цирк, которому почти две тысячи лет.',
 'Rome is a very old city. The Colosseum stands here, a huge stone arena that is almost two thousand years old.',
 'Roma é uma cidade muito antiga. Aqui fica o Coliseu, uma arena enorme de pedra com quase dois mil anos.',
 'Rom ist eine sehr alte Stadt. Hier steht das Kolosseum, eine riesige Arena aus Stein, die fast zweitausend Jahre alt ist.')
T('США — большая страна, где есть и жаркие пустыни, и снежные горы. Здесь есть гора, на которой высечены лица четырёх президентов.',
 'The USA is a big country with hot deserts and snowy mountains. There is a mountain here with the faces of four presidents carved into it.',
 'Os EUA são um país grande, com desertos quentes e montanhas com neve. Aqui há uma montanha onde estão esculpidas as caras de quatro presidentes.',
 'Die USA sind ein großes Land mit heißen Wüsten und verschneiten Bergen. Hier gibt es einen Berg, in den die Gesichter von vier Präsidenten gemeißelt sind.')
T('Вашингтон — столица США. Президент живёт и работает здесь, в Белом доме.',
 'Washington is the capital of the USA. The president lives and works here, in the White House.',
 'Washington é a capital dos EUA. O presidente vive e trabalha aqui, na Casa Branca.',
 'Washington ist die Hauptstadt der USA. Der Präsident wohnt und arbeitet hier, im Weißen Haus.')
T('Канада — вторая по величине страна в мире. Там много лесов и озёр, а на флаге нарисован кленовый лист. Из сока клёна здесь варят сладкий сироп.',
 'Canada is the second biggest country in the world. It has many forests and lakes, and its flag has a maple leaf on it. Here they boil maple sap into sweet syrup.',
 'O Canadá é o segundo maior país do mundo. Tem muitas florestas e lagos, e na bandeira há uma folha de bordo. Aqui faz-se xarope doce com a seiva do bordo.',
 'Kanada ist das zweitgrößte Land der Welt. Es hat viele Wälder und Seen, und auf der Flagge ist ein Ahornblatt. Aus dem Saft vom Ahorn kocht man hier süßen Sirup.')
T('Оттава — столица Канады. Зимой городской канал замерзает, и люди едут по нему на коньках прямо на работу.',
 'Ottawa is the capital of Canada. In winter the city canal freezes, and people skate along it straight to work.',
 'Ottawa é a capital do Canadá. No inverno o canal da cidade gela, e as pessoas vão patinando por ele diretamente para o trabalho.',
 'Ottawa ist die Hauptstadt von Kanada. Im Winter friert der Kanal in der Stadt zu, und die Leute fahren auf Schlittschuhen direkt zur Arbeit.')
T('В Бразилии растут самые большие на Земле джунгли — леса Амазонии. Там живут попугаи, ленивцы и обезьяны. А ещё бразильцы очень любят футбол.',
 'In Brazil grows the biggest jungle on Earth, the Amazon rainforest. Parrots, sloths and monkeys live there. And Brazilians love football very much.',
 'No Brasil cresce a maior selva da Terra, a floresta da Amazónia. Lá vivem papagaios, preguiças e macacos. E os brasileiros gostam muito de futebol.',
 'In Brasilien wächst der größte Dschungel der Erde, der Regenwald am Amazonas. Dort leben Papageien, Faultiere und Affen. Und die Brasilianer lieben Fußball.')
T('Бразилиа — молодая столица, её построили в 1960 году. Сверху город похож на самолёт или на птицу.',
 'Brasília is a young capital. It was built in nineteen sixty. From above, the city looks like a plane or a bird.',
 'Brasília é uma capital jovem, foi construída em mil novecentos e sessenta. Vista de cima, a cidade parece um avião ou um pássaro.',
 'Brasília ist eine junge Hauptstadt. Sie wurde im Jahr neunzehnhundertsechzig gebaut. Von oben sieht die Stadt aus wie ein Flugzeug oder ein Vogel.')
T('Аргентина тянется далеко на юг, до холодных краёв, где живут пингвины. А ещё здесь танцуют танго.',
 'Argentina stretches far south, to the cold lands where penguins live. And people dance the tango here.',
 'A Argentina estende-se muito para sul, até às terras frias onde vivem os pinguins. E aqui dança-se o tango.',
 'Argentinien reicht weit nach Süden, bis in die kalten Gegenden, wo Pinguine leben. Und hier tanzt man Tango.')
T('Буэнос-Айрес — большой город с широкими улицами. Его название значит «хороший воздух».',
 'Buenos Aires is a big city with wide streets. Its name means "good air".',
 'Buenos Aires é uma cidade grande, com ruas largas. O nome quer dizer «bons ares».',
 'Buenos Aires ist eine große Stadt mit breiten Straßen. Der Name bedeutet „gute Luft“.')
T('В Мексике стоят древние пирамиды, которые индейцы построили много веков назад. Отсюда к нам пришли кукуруза, помидоры и какао для шоколада.',
 'In Mexico there are ancient pyramids that the native people built many hundreds of years ago. Corn, tomatoes and cocoa for chocolate come from here.',
 'No México há pirâmides antigas, que os povos indígenas construíram há muitos séculos. Daqui vieram o milho, os tomates e o cacau do chocolate.',
 'In Mexiko stehen uralte Pyramiden, die die Ureinwohner vor vielen hundert Jahren gebaut haben. Von hier kommen Mais, Tomaten und Kakao für Schokolade.')
T('Мехико — один из самых больших городов мира. Он стоит высоко в горах, на месте старого озера.',
 'Mexico City is one of the biggest cities in the world. It stands high in the mountains, where an old lake used to be.',
 'A Cidade do México é uma das maiores cidades do mundo. Fica no alto das montanhas, onde havia um lago antigo.',
 'Mexiko-Stadt ist eine der größten Städte der Welt. Sie liegt hoch in den Bergen, dort wo früher ein See war.')
T('В горах Перу живут ламы и альпаки — у них очень тёплая шерсть. Высоко в горах прячется древний город Мачу-Пикчу.',
 'In the mountains of Peru live llamas and alpacas, with very warm wool. High in the mountains hides the ancient city of Machu Picchu.',
 'Nas montanhas do Peru vivem lamas e alpacas, com uma lã muito quente. No alto das montanhas esconde-se a antiga cidade de Machu Picchu.',
 'In den Bergen von Peru leben Lamas und Alpakas mit sehr warmer Wolle. Hoch oben in den Bergen versteckt sich die uralte Stadt Machu Picchu.')
T('Лима стоит на берегу Тихого океана. Дождь здесь бывает очень редко.',
 'Lima is on the shore of the Pacific Ocean. It hardly ever rains here.',
 'Lima fica na costa do oceano Pacífico. Aqui quase nunca chove.',
 'Lima liegt am Pazifischen Ozean. Hier regnet es nur ganz selten.')
T('В Китае живёт очень много людей. Через горы тянется Великая Китайская стена — её строили сотни лет. А ещё только здесь живут на воле большие панды.',
 'Very many people live in China. The Great Wall of China runs over the mountains, and it took hundreds of years to build. And giant pandas live in the wild only here.',
 'Na China vivem muitíssimas pessoas. Pelas montanhas estende-se a Grande Muralha da China, que demorou centenas de anos a construir. E só aqui vivem pandas gigantes em liberdade.',
 'In China leben sehr viele Menschen. Über die Berge zieht sich die Große Mauer, an der man hunderte Jahre gebaut hat. Und nur hier leben Riesenpandas in freier Natur.')
T('В Пекине стоит Запретный город — огромный дворец, где раньше жили императоры. Простым людям входить туда было нельзя.',
 'In Beijing stands the Forbidden City, a huge palace where emperors used to live. Ordinary people were not allowed to go in.',
 'Em Pequim fica a Cidade Proibida, um palácio enorme onde antigamente viviam os imperadores. As pessoas comuns não podiam entrar.',
 'In Peking steht die Verbotene Stadt, ein riesiger Palast, in dem früher Kaiser wohnten. Normale Leute durften dort nicht hinein.')
T('Япония — страна на островах. Весной здесь цветёт сакура, и все выходят любоваться розовыми деревьями. Японцы едят палочками.',
 'Japan is a country on islands. In spring the cherry trees bloom, and everyone goes out to look at the pink blossom. Japanese people eat with chopsticks.',
 'O Japão é um país de ilhas. Na primavera florescem as cerejeiras, e toda a gente sai para ver as árvores cor-de-rosa. Os japoneses comem com pauzinhos.',
 'Japan ist ein Land auf Inseln. Im Frühling blühen die Kirschbäume, und alle gehen hinaus und schauen sich die rosa Bäume an. Die Japaner essen mit Stäbchen.')
T('Токио — огромный город с очень быстрыми поездами. В ясный день отсюда видна гора Фудзи со снежной шапкой.',
 'Tokyo is a huge city with very fast trains. On a clear day you can see Mount Fuji from here, with a snowy cap.',
 'Tóquio é uma cidade enorme, com comboios muito rápidos. Num dia limpo vê-se daqui o monte Fuji, com um chapéu de neve.',
 'Tokio ist eine riesige Stadt mit ganz schnellen Zügen. An einem klaren Tag sieht man von hier den Berg Fuji mit einer Schneemütze.')
T('В Индии живут слоны, тигры и павлины. Здесь стоит прекрасный белый дворец Тадж-Махал. А индийская еда бывает очень острой.',
 'In India live elephants, tigers and peacocks. Here stands the beautiful white palace, the Taj Mahal. And Indian food can be very spicy.',
 'Na Índia vivem elefantes, tigres e pavões. Aqui fica o lindo palácio branco, o Taj Mahal. E a comida indiana pode ser muito picante.',
 'In Indien leben Elefanten, Tiger und Pfauen. Hier steht der wunderschöne weiße Palast Taj Mahal. Und das indische Essen kann sehr scharf sein.')
T('Нью-Дели — столица Индии. На улице здесь можно встретить корову: в Индии коров очень уважают.',
 'New Delhi is the capital of India. You can meet a cow in the street here, because in India cows are treated with great respect.',
 'Nova Deli é a capital da Índia. Na rua podes encontrar uma vaca, porque na Índia as vacas são muito respeitadas.',
 'Neu-Delhi ist die Hauptstadt von Indien. Auf der Straße kann man hier eine Kuh treffen, denn in Indien werden Kühe sehr geachtet.')
T('Австралия — это целый материк. Только здесь живут кенгуру, которые носят детёнышей в сумке, и сонные коалы.',
 'Australia is a whole continent. Only here live kangaroos, who carry their babies in a pouch, and sleepy koalas.',
 'A Austrália é um continente inteiro. Só aqui vivem os cangurus, que levam as crias numa bolsa, e os coalas sonolentos.',
 'Australien ist ein ganzer Kontinent. Nur hier leben Kängurus, die ihre Babys im Beutel tragen, und verschlafene Koalas.')
T('Канберра — столица Австралии. А самый известный её город — Сидней, там стоит театр с крышей, похожей на паруса.',
 'Canberra is the capital of Australia. But its most famous city is Sydney, where there is a theatre with a roof like sails.',
 'Camberra é a capital da Austrália. Mas a cidade mais conhecida é Sydney, onde há um teatro com um telhado que parece velas.',
 'Canberra ist die Hauptstadt von Australien. Die bekannteste Stadt ist aber Sydney, dort steht ein Opernhaus mit einem Dach wie Segel.')
T('Новая Зеландия — это острова далеко в океане. Там живёт птица киви, которая не умеет летать. А овец здесь больше, чем людей.',
 'New Zealand is a group of islands far away in the ocean. The kiwi bird lives there, and it cannot fly. And there are more sheep here than people.',
 'A Nova Zelândia são ilhas longe, no meio do oceano. Lá vive a ave kiwi, que não sabe voar. E aqui há mais ovelhas do que pessoas.',
 'Neuseeland besteht aus Inseln weit draußen im Ozean. Dort lebt der Kiwi, ein Vogel, der nicht fliegen kann. Und hier gibt es mehr Schafe als Menschen.')
T('Веллингтон — столица Новой Зеландии. Это очень ветреный город у моря.',
 'Wellington is the capital of New Zealand. It is a very windy city by the sea.',
 'Wellington é a capital da Nova Zelândia. É uma cidade muito ventosa, junto ao mar.',
 'Wellington ist die Hauptstadt von Neuseeland. Es ist eine sehr windige Stadt am Meer.')
T('В Египте стоят древние пирамиды. Рядом лежит каменный Сфинкс с телом льва и головой человека. Через пустыню течёт великая река Нил.',
 'In Egypt stand the ancient pyramids. Next to them lies the stone Sphinx, with the body of a lion and the head of a man. The great river Nile flows through the desert.',
 'No Egito há pirâmides antigas. Ao lado delas está a Esfinge de pedra, com corpo de leão e cabeça de homem. Pelo deserto corre o grande rio Nilo.',
 'In Ägypten stehen uralte Pyramiden. Daneben liegt die steinerne Sphinx mit dem Körper eines Löwen und dem Kopf eines Menschen. Durch die Wüste fließt der große Fluss Nil.')
T('Каир стоит на реке Нил. Совсем рядом с городом поднимаются пирамиды.',
 'Cairo is on the River Nile. The pyramids rise very close to the city.',
 'O Cairo fica no rio Nilo. Mesmo perto da cidade erguem-se as pirâmides.',
 'Kairo liegt am Fluss Nil. Ganz nah bei der Stadt ragen die Pyramiden auf.')
T('В Кении есть саванна, где гуляют жирафы, зебры, слоны и львы. Люди приезжают сюда на сафари, чтобы посмотреть на них.',
 'Kenya has a savannah where giraffes, zebras, elephants and lions roam. People come here on safari to see them.',
 'No Quénia há savana, onde passeiam girafas, zebras, elefantes e leões. As pessoas vêm aqui fazer safári para os ver.',
 'In Kenia gibt es eine Savanne, in der Giraffen, Zebras, Elefanten und Löwen umherziehen. Die Leute kommen hierher auf Safari, um sie zu sehen.')
T('Найроби — столица Кении. Прямо рядом с городом есть парк, где живут жирафы и носороги.',
 'Nairobi is the capital of Kenya. Right next to the city there is a park where giraffes and rhinos live.',
 'Nairóbi é a capital do Quénia. Mesmo ao lado da cidade há um parque onde vivem girafas e rinocerontes.',
 'Nairobi ist die Hauptstadt von Kenia. Gleich neben der Stadt gibt es einen Park, in dem Giraffen und Nashörner leben.')
T('Южная Африка — страна на самом юге Африки. Здесь в саванне живут львы и слоны, а на берегу моря — маленькие пингвины.',
 'South Africa is a country at the very south of Africa. Lions and elephants live in the savannah here, and little penguins live on the seashore.',
 'A África do Sul é um país mesmo no sul de África. Aqui, na savana, vivem leões e elefantes, e na praia vivem pinguins pequeninos.',
 'Südafrika ist ein Land ganz im Süden von Afrika. Hier leben Löwen und Elefanten in der Savanne, und am Meer leben kleine Pinguine.')
T('Претория — одна из трёх столиц страны. Весной её улицы становятся сиреневыми от цветущих деревьев.',
 'Pretoria is one of the three capitals of the country. In spring its streets turn purple with blossoming trees.',
 'Pretória é uma das três capitais do país. Na primavera as suas ruas ficam lilases, com as árvores em flor.',
 'Pretoria ist eine von drei Hauptstädten des Landes. Im Frühling werden die Straßen lila von den blühenden Bäumen.')
T('В Марокко начинается пустыня Сахара — по ней путешествуют на верблюдах. На рынках здесь продают яркие ковры и пряности.',
 'In Morocco the Sahara desert begins, and people travel across it on camels. In the markets here they sell bright carpets and spices.',
 'Em Marrocos começa o deserto do Sara, onde se viaja de camelo. Nos mercados vendem-se tapetes coloridos e especiarias.',
 'In Marokko beginnt die Wüste Sahara, dort reist man auf Kamelen. Auf den Märkten verkauft man bunte Teppiche und Gewürze.')
T('Рабат — столица Марокко. Это белый город на берегу океана.',
 'Rabat is the capital of Morocco. It is a white city on the shore of the ocean.',
 'Rabat é a capital de Marrocos. É uma cidade branca, junto ao oceano.',
 'Rabat ist die Hauptstadt von Marokko. Es ist eine weiße Stadt am Ozean.')
T('Греция — страна моря и тысяч островов. Отсюда пришли древние мифы о богах и героях. А ещё здесь придумали Олимпийские игры.',
 'Greece is a country of sea and thousands of islands. The ancient myths about gods and heroes come from here. And the Olympic Games were invented here.',
 'A Grécia é um país de mar e de milhares de ilhas. Daqui vêm os antigos mitos sobre deuses e heróis. E aqui inventaram-se os Jogos Olímpicos.',
 'Griechenland ist ein Land des Meeres und tausender Inseln. Von hier kommen die alten Sagen von Göttern und Helden. Und hier hat man die Olympischen Spiele erfunden.')
T('В Афинах на высокой скале стоит Парфенон — храм богини Афины. Ему почти две с половиной тысячи лет.',
 'In Athens, on a tall rock, stands the Parthenon, a temple of the goddess Athena. It is almost two and a half thousand years old.',
 'Em Atenas, numa rocha alta, fica o Pártenon, o templo da deusa Atena. Tem quase dois mil e quinhentos anos.',
 'In Athen steht auf einem hohen Felsen der Parthenon, ein Tempel der Göttin Athene. Er ist fast zweieinhalbtausend Jahre alt.')
T('Турция стоит сразу в двух частях света — в Европе и в Азии. Здесь любят сладости: лукум и пахлаву.',
 'Turkey lies in two parts of the world at once, in Europe and in Asia. People love sweets here, like Turkish delight and baklava.',
 'A Turquia fica em duas partes do mundo ao mesmo tempo, na Europa e na Ásia. Aqui gostam de doces, como o lokum e o baklava.',
 'Die Türkei liegt gleich in zwei Erdteilen, in Europa und in Asien. Hier mag man Süßes, zum Beispiel Lokum und Baklava.')
T('Анкара — столица Турции. А самый большой город страны — Стамбул: там можно переплыть из Европы в Азию на кораблике.',
 'Ankara is the capital of Turkey. But the biggest city in the country is Istanbul, where you can sail from Europe to Asia on a little boat.',
 'Ancara é a capital da Turquia. Mas a maior cidade do país é Istambul, onde se pode ir da Europa para a Ásia num barquinho.',
 'Ankara ist die Hauptstadt der Türkei. Die größte Stadt des Landes ist aber Istanbul, dort kann man mit einem kleinen Schiff von Europa nach Asien fahren.')
T('В Норвегии море заходит глубоко в горы — такие заливы называют фьордами. Зимой здесь на небе можно увидеть северное сияние.',
 'In Norway the sea reaches deep in between the mountains, and these inlets are called fjords. In winter you can see the northern lights in the sky here.',
 'Na Noruega o mar entra fundo pelas montanhas, e a esses braços de mar chama-se fiordes. No inverno pode ver-se no céu a aurora boreal.',
 'In Norwegen geht das Meer tief zwischen die Berge hinein, solche Buchten heißen Fjorde. Im Winter kann man hier am Himmel das Nordlicht sehen.')
T('Осло — столица Норвегии. Здесь хранят настоящие корабли викингов.',
 'Oslo is the capital of Norway. Real Viking ships are kept here.',
 'Oslo é a capital da Noruega. Aqui guardam-se barcos vikings verdadeiros.',
 'Oslo ist die Hauptstadt von Norwegen. Hier bewahrt man echte Wikingerschiffe auf.')
T('Швеция — страна лесов и озёр. Здесь жила писательница Астрид Линдгрен, которая придумала Карлсона и Пеппи Длинныйчулок.',
 'Sweden is a country of forests and lakes. The writer Astrid Lindgren lived here. She made up Karlsson-on-the-Roof and Pippi Longstocking.',
 'A Suécia é um país de florestas e lagos. Aqui viveu a escritora Astrid Lindgren, que inventou o Karlsson no Telhado e a Pippi das Meias Altas.',
 'Schweden ist ein Land der Wälder und Seen. Hier lebte die Schriftstellerin Astrid Lindgren. Sie hat sich Karlsson vom Dach und Pippi Langstrumpf ausgedacht.')
T('Стокгольм стоит на четырнадцати островах, и их соединяют мосты.',
 'Stockholm is built on fourteen islands, and bridges join them together.',
 'Estocolmo fica em catorze ilhas, ligadas por pontes.',
 'Stockholm liegt auf vierzehn Inseln, und Brücken verbinden sie.')
T('Финляндию называют страной тысячи озёр. На севере, в Лапландии, пасутся северные олени, а зимой там почти не бывает солнца.',
 'Finland is called the land of a thousand lakes. In the north, in Lapland, reindeer graze, and in winter there is hardly any sun.',
 'A Finlândia chama-se o país dos mil lagos. No norte, na Lapónia, pastam renas, e no inverno quase não há sol.',
 'Finnland nennt man das Land der tausend Seen. Im Norden, in Lappland, weiden Rentiere, und im Winter gibt es dort fast keine Sonne.')
T('Хельсинки — столица Финляндии на берегу Балтийского моря. Зимой море у берега замерзает.',
 'Helsinki is the capital of Finland, on the shore of the Baltic Sea. In winter the sea freezes near the shore.',
 'Helsínquia é a capital da Finlândia, junto ao mar Báltico. No inverno o mar gela perto da costa.',
 'Helsinki ist die Hauptstadt von Finnland, am Ostseeufer. Im Winter friert das Meer am Ufer zu.')
T('Нидерланды — низкая страна: часть её земли лежит ниже уровня моря. Здесь много ветряных мельниц и полей с тюльпанами, а все ездят на велосипедах.',
 'The Netherlands is a low country, and part of its land lies below sea level. There are many windmills and fields of tulips, and everyone rides a bike.',
 'Os Países Baixos são um país baixo, e parte da terra fica abaixo do nível do mar. Há muitos moinhos de vento e campos de tulipas, e toda a gente anda de bicicleta.',
 'Die Niederlande sind ein flaches Land, ein Teil davon liegt unter dem Meeresspiegel. Hier gibt es viele Windmühlen und Tulpenfelder, und alle fahren Fahrrad.')
T('Амстердам — город каналов. По воде здесь плавают лодки, а над каналами перекинуты сотни мостов.',
 'Amsterdam is a city of canals. Boats float on the water, and hundreds of bridges cross the canals.',
 'Amesterdão é uma cidade de canais. Pela água andam barcos, e sobre os canais há centenas de pontes.',
 'Amsterdam ist eine Stadt der Kanäle. Auf dem Wasser fahren Boote, und über die Kanäle führen hunderte Brücken.')
T('Швейцария — страна высоких гор, Альп. Здесь делают знаменитый шоколад, сыр с дырками и точные часы.',
 'Switzerland is a country of high mountains, the Alps. Here they make famous chocolate, cheese with holes, and clocks that tell the time exactly.',
 'A Suíça é um país de montanhas altas, os Alpes. Aqui fazem-se o famoso chocolate, o queijo com buracos e relógios muito certos.',
 'Die Schweiz ist ein Land mit hohen Bergen, den Alpen. Hier macht man berühmte Schokolade, Käse mit Löchern und ganz genaue Uhren.')
T('Берн — столица Швейцарии. Медведь — символ города, он нарисован на его гербе.',
 'Bern is the capital of Switzerland. The bear is the symbol of the city, and it is painted on its coat of arms.',
 'Berna é a capital da Suíça. O urso é o símbolo da cidade, e está desenhado no brasão.',
 'Bern ist die Hauptstadt der Schweiz. Der Bär ist das Zeichen der Stadt, er ist auf ihrem Wappen.')
T('Исландия — остров огня и льда. Здесь есть вулканы и ледники, а гейзеры выбрасывают струи горячей воды прямо из земли.',
 'Iceland is an island of fire and ice. It has volcanoes and glaciers, and geysers shoot jets of hot water straight out of the ground.',
 'A Islândia é uma ilha de fogo e gelo. Tem vulcões e glaciares, e os géiseres lançam jatos de água quente diretamente da terra.',
 'Island ist eine Insel aus Feuer und Eis. Es gibt Vulkane und Gletscher, und Geysire schießen heißes Wasser direkt aus der Erde.')
T('Рейкьявик — самая северная столица в мире. Дома здесь греют горячей водой из-под земли.',
 'Reykjavik is the most northern capital in the world. The houses here are heated with hot water from under the ground.',
 'Reiquejavique é a capital mais a norte do mundo. As casas aqui são aquecidas com água quente que vem de debaixo da terra.',
 'Reykjavík ist die nördlichste Hauptstadt der Welt. Die Häuser werden hier mit heißem Wasser aus der Erde geheizt.')
T('Казахстан — огромная страна степей. Здесь растут дикие яблони, и учёные считают, что отсюда родом все яблоки на свете.',
 'Kazakhstan is a huge country of steppes. Wild apple trees grow here, and scientists think that all the apples in the world come from here.',
 'O Cazaquistão é um país enorme de estepes. Aqui crescem macieiras selvagens, e os cientistas acham que todas as maçãs do mundo vêm daqui.',
 'Kasachstan ist ein riesiges Land mit Steppen. Hier wachsen wilde Apfelbäume, und die Forscher glauben, dass alle Äpfel der Welt von hier kommen.')
T('Астана — молодая столица посреди степи. В ней стоит высокая башня Байтерек с золотым шаром наверху.',
 'Astana is a young capital in the middle of the steppe. It has a tall tower, the Baiterek, with a golden ball on top.',
 'Astana é uma capital jovem, no meio da estepe. Tem uma torre alta, a Baiterek, com uma bola dourada no topo.',
 'Astana ist eine junge Hauptstadt mitten in der Steppe. Dort steht der hohe Turm Baiterek mit einer goldenen Kugel oben drauf.')
T('Грузия — горная страна у Чёрного моря. Здесь пекут хачапури — лепёшку с сыром — и очень любят петь хором.',
 'Georgia is a mountain country by the Black Sea. Here they bake khachapuri, a flatbread with cheese, and people love singing in a choir.',
 'A Geórgia é um país de montanhas, junto ao mar Negro. Aqui faz-se o khachapuri, um pão achatado com queijo, e gosta-se muito de cantar em coro.',
 'Georgien ist ein Bergland am Schwarzen Meer. Hier backt man Chatschapuri, ein Fladenbrot mit Käse, und singt sehr gern im Chor.')
T('В Тбилиси есть тёплые серные бани, а над городом стоит большая статуя — Мать Грузия.',
 'In Tbilisi there are warm sulphur baths, and above the city stands a big statue called Mother Georgia.',
 'Em Tbilissi há banhos quentes de enxofre, e sobre a cidade ergue-se uma grande estátua, a Mãe Geórgia.',
 'In Tiflis gibt es warme Schwefelbäder, und über der Stadt steht eine große Statue, die Mutter Georgiens.')
T('Армения — страна гор. Отсюда видна гора Арарат, к которой, по легенде, причалил Ноев ковчег.',
 'Armenia is a country of mountains. From here you can see Mount Ararat, where, in the old story, Noah\'s Ark landed.',
 'A Arménia é um país de montanhas. Daqui vê-se o monte Ararate, onde, segundo a lenda, aportou a Arca de Noé.',
 'Armenien ist ein Land der Berge. Von hier sieht man den Berg Ararat, wo nach der Legende die Arche Noah gelandet ist.')
T('Ереван — очень древний город, он старше Рима. Многие дома здесь построены из розового камня.',
 'Yerevan is a very old city, older than Rome. Many houses here are built of pink stone.',
 'Erevan é uma cidade muito antiga, mais velha do que Roma. Muitas casas aqui são feitas de pedra cor-de-rosa.',
 'Eriwan ist eine sehr alte Stadt, älter als Rom. Viele Häuser hier sind aus rosa Stein gebaut.')
T('Кипр — солнечный остров в Средиземном море. По легенде, здесь из морской пены вышла богиня красоты Афродита.',
 'Cyprus is a sunny island in the Mediterranean Sea. In the old story, the goddess of beauty, Aphrodite, rose here from the sea foam.',
 'Chipre é uma ilha de sol no mar Mediterrâneo. Segundo a lenda, foi aqui que a deusa da beleza, Afrodite, saiu da espuma do mar.',
 'Zypern ist eine sonnige Insel im Mittelmeer. Nach der Sage ist hier die Göttin der Schönheit, Aphrodite, aus dem Meeresschaum gestiegen.')
T('Никосия — столица Кипра. Она стоит посередине острова.',
 'Nicosia is the capital of Cyprus. It is in the middle of the island.',
 'Nicósia é a capital de Chipre. Fica no meio da ilha.',
 'Nikosia ist die Hauptstadt von Zypern. Sie liegt mitten auf der Insel.')
T('Сербия — страна на Балканах, в самой середине полуострова. Через неё течёт большая река Дунай.',
 'Serbia is a country in the Balkans, right in the middle of the peninsula. The big River Danube flows through it.',
 'A Sérvia é um país dos Balcãs, mesmo no meio da península. Por ela corre o grande rio Danúbio.',
 'Serbien ist ein Land auf dem Balkan, mitten auf der Halbinsel. Durch das Land fließt der große Fluss Donau.')
T('Белград стоит там, где сливаются две реки. На высоком холме над ними — старая крепость.',
 'Belgrade is where two rivers meet. On a high hill above them stands an old fortress.',
 'Belgrado fica onde se juntam dois rios. Numa colina alta sobre eles há uma fortaleza antiga.',
 'Belgrad liegt dort, wo zwei Flüsse zusammenfließen. Auf einem hohen Hügel über ihnen steht eine alte Festung.')

# extra cities
T('Петербург построил царь Пётр Первый. Летом здесь белые ночи, а по ночам разводят мосты над Невой.',
 'Saint Petersburg was built by Tsar Peter the First. In summer the nights here are white and bright, and at night the bridges over the Neva are lifted.',
 'São Petersburgo foi construída pelo czar Pedro, o Primeiro. No verão há aqui noites brancas, e de noite levantam-se as pontes sobre o rio Neva.',
 'Sankt Petersburg hat Zar Peter der Erste gebaut. Im Sommer gibt es hier weiße Nächte, und nachts werden die Brücken über der Newa hochgeklappt.')
T('Порту стоит на реке Дору. Вдоль берега тянутся разноцветные домики, а по реке плавают старые лодки.',
 'Porto is on the River Douro. Colourful little houses line the bank, and old boats float on the river.',
 'O Porto fica no rio Douro. Ao longo da margem há casinhas coloridas, e pelo rio andam barcos antigos.',
 'Porto liegt am Fluss Douro. Am Ufer stehen bunte Häuschen, und auf dem Fluss fahren alte Boote.')
T('Кашкайш — городок у океана рядом с Лиссабоном. Здесь пляжи, маяк и рыбацкие лодки.',
 'Cascais is a little town by the ocean near Lisbon. It has beaches, a lighthouse and fishing boats.',
 'Cascais é uma vila junto ao oceano, perto de Lisboa. Tem praias, um farol e barcos de pesca.',
 'Cascais ist eine kleine Stadt am Ozean bei Lissabon. Hier gibt es Strände, einen Leuchtturm und Fischerboote.')
T('В Барселоне строят удивительный храм Саграда Фамилия — его строят уже больше ста лет.',
 'In Barcelona they are building an amazing church called the Sagrada Família. They have been building it for more than a hundred years.',
 'Em Barcelona está a ser construída uma igreja maravilhosa, a Sagrada Família. Já a constroem há mais de cem anos.',
 'In Barcelona baut man an einer erstaunlichen Kirche, der Sagrada Família. Man baut schon seit mehr als hundert Jahren daran.')
T('В Нью-Йорке очень высокие дома — небоскрёбы. А у входа в город с моря стоит статуя Свободы с факелом в руке.',
 'New York has very tall buildings called skyscrapers. And where the city meets the sea, the Statue of Liberty stands with a torch in her hand.',
 'Em Nova Iorque há prédios altíssimos, os arranha-céus. E à entrada da cidade, junto ao mar, está a Estátua da Liberdade com uma tocha na mão.',
 'In New York gibt es ganz hohe Häuser, die Wolkenkratzer. Und am Eingang der Stadt vom Meer her steht die Freiheitsstatue mit einer Fackel in der Hand.')
T('Торонто — самый большой город Канады. Над ним поднимается высоченная телебашня.',
 'Toronto is the biggest city in Canada. A very tall TV tower rises above it.',
 'Toronto é a maior cidade do Canadá. Sobre ela ergue-se uma torre de televisão altíssima.',
 'Toronto ist die größte Stadt von Kanada. Über der Stadt ragt ein riesiger Fernsehturm auf.')

# UI
S('<button class="tv-globe" id="tvGlobe"><span>🌍</span><span><b>Глобус</b><small>покрути Землю и нажми на страну или город</small></span></button>',
  ('Глобус','Globe','Globo','Globus'),('покрути Землю и нажми на страну или город','spin the Earth and tap a country or a city','roda a Terra e toca num país ou numa cidade','dreh die Erde und tippe auf ein Land oder eine Stadt'))
S('<div class="gl">\n      <div class="gl-box"><canvas id="glC" aria-label="Глобус"></canvas>\n        <div class="gl-zoom"><button class="ibtn" id="glIn" aria-label="Ближе">+</button><button class="ibtn" id="glOut" aria-label="Дальше">−</button></div></div>\n      <div class="gl-info" id="glInfo"><p class="gl-hint">👆 Покрути глобус пальцем и нажми на страну или на город.</p></div>\n    </div>',
  ('aria-label="Глобус"','aria-label="Globe"','aria-label="Globo"','aria-label="Globus"'),
  ('aria-label="Ближе"','aria-label="Closer"','aria-label="Mais perto"','aria-label="Näher"'),
  ('aria-label="Дальше"','aria-label="Further away"','aria-label="Mais longe"','aria-label="Weiter weg"'),
  ('Покрути глобус пальцем и нажми на страну или на город.','Spin the globe with your finger and tap a country or a city.','Roda o globo com o dedo e toca num país ou numa cidade.','Dreh den Globus mit dem Finger und tippe auf ein Land oder eine Stadt.'))
S('<div class="gl">\n      <div class="gl-box"><div class="gl-ball"><canvas id="glC" aria-label="Глобус"></canvas>\n        <div class="gl-zoom"><button class="ibtn" id="glIn" aria-label="Ближе">+</button><button class="ibtn" id="glOut" aria-label="Дальше">−</button></div></div></div>\n      <div class="gl-info" id="glInfo"><p class="gl-hint">👆 Покрути глобус пальцем и нажми на страну или на город.</p></div>\n    </div>',
  ('aria-label="Глобус"','aria-label="Globe"','aria-label="Globo"','aria-label="Globus"'),
  ('aria-label="Ближе"','aria-label="Closer"','aria-label="Mais perto"','aria-label="Näher"'),
  ('aria-label="Дальше"','aria-label="Further away"','aria-label="Mais longe"','aria-label="Weiter weg"'),
  ('Покрути глобус пальцем и нажми на страну или на город.','Spin the globe with your finger and tap a country or a city.','Roda o globo com o dedo e toca num país ou numa cidade.','Dreh den Globus mit dem Finger und tippe auf ein Land oder eine Stadt.'))
T('Покрути глобус пальцем и нажми на любую страну или на точку-город.',
  'Spin the globe with your finger and tap any country or a city dot.',
  'Roda o globo com o dedo e toca em qualquer país ou num ponto-cidade.',
  'Dreh den Globus mit dem Finger und tippe auf ein beliebiges Land oder auf einen Stadtpunkt.')
S('<h2 class="gl-t">🌊 {0}</h2><p class="gl-s">Здесь вода. Покрути глобус и найди сушу.</p>',
  ('Здесь вода. Покрути глобус и найди сушу.','This is water. Spin the globe and find some land.','Aqui há água. Roda o globo e encontra terra.','Hier ist Wasser. Dreh den Globus und such das Land.'))
T('Это {0}.','This is {0}.','Este é o nome: {0}.'.replace('Este é o nome: {0}.','Isto é {0}.'),'Das ist {0}.')
S('<button class="ibtn gl-say" id="glSay" aria-label="Послушать ещё раз">{0}</button>',
  ('Послушать ещё раз','Listen again','Ouvir outra vez','Noch einmal anhören'))
S('<h2 class="gl-t"><span>{0}</span> {1}</h2><p class="gl-s">Об этой стране я расскажу в другой раз. Найди страну, раскрашенную яркой краской!</p>{2}',
  ('Об этой стране я расскажу в другой раз. Найди страну, раскрашенную яркой краской!','I will tell you about this country another time. Find a country painted in bright colours!','Sobre este país eu conto-te outro dia. Encontra um país pintado com cores vivas!','Von diesem Land erzähle ich dir ein andermal. Such ein Land, das in leuchtenden Farben gemalt ist!'))
T('{0}. Об этой стране я расскажу в другой раз.','{0}. I will tell you about this country another time.','{0}. Sobre este país eu conto-te outro dia.','{0}. Von diesem Land erzähle ich dir ein andermal.')
T('Об этой стране я расскажу в другой раз.','I will tell you about this country another time.','Sobre este país eu conto-te outro dia.','Von diesem Land erzähle ich dir ein andermal.')
S('<h2 class="gl-t"><span>{0}</span> {1}</h2><p class="gl-cap">Столица — {2}</p><p class="gl-s no-said">{3}</p>{4}',
  ('Столица — {2}','Capital: {2}','Capital: {2}','Hauptstadt: {2}'))
T(' · столица',' · capital',' · capital',' · Hauptstadt')

CYR = re.compile('[А-Яа-яЁё]'); n = 0
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
