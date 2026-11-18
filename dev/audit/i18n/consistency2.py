import json,re,collections
f=json.load(open('/home/user/govorilki/dev/i18n/fixed.json'))
d=json.load(open('/home/user/govorilki/dev/i18n/de/fixed_de.json'))
rows=[]
for g,v in f.items():
    for ru,tr in v.items():
        if isinstance(tr,list) and len(tr)>=2: rows.append((g,ru,tr[0],tr[1],(d.get(g) or {}).get(ru,'')))
TERMS={
 'друг (helper/friend)': (r'(?<![а-яё])друг(а|у|ом|е|и)?(?![а-яё])', {'en':['friend','buddy','pal','helper','companion','mate'],'pt':['amigo','amiga','companheiro','ajudante','parceiro'],'de':['Freund','Kumpel','Begleiter','Helfer','Gefährte']}),
 'сундук': (r'сундук', {'en':['chest','treasure chest','box','trunk'],'pt':['baú','arca','cofre','caixa'],'de':['Truhe','Schatztruhe','Kiste','Schatzkiste']}),
 'Сегодня (screen)': (r'(?<![а-яё])сегодня(?![а-яё])', {'en':['today'],'pt':['hoje'],'de':['heute']}),
 'тропа/тропинка': (r'троп(а|ы|е|у|ой|инк)', {'en':['path','trail','track','route'],'pt':['trilho','caminho','trilha','percurso'],'de':['Pfad','Weg','Route','Strecke']}),
 'двери дня': (r'двер(и|ь) дня', {'en':['doors of the day','day doors','doors'],'pt':['portas do dia','portas'],'de':['Türen des Tages','Tagestüren','Türen']}),
 'наклейка': (r'наклей', {'en':['sticker'],'pt':['autocolante','adesivo','cromo'],'de':['Sticker','Aufkleber']}),
 'звёзды/звёздочки': (r'звёзд|звезд', {'en':['star'],'pt':['estrela'],'de':['Stern']}),
 'Для взрослых': (r'для взрослых', {'en':['for grown-ups','for adults','for parents','grown-ups','adults'],'pt':['para adultos','para os adultos','para pais','para crescidos','adultos'],'de':['für Erwachsene','für Eltern','Erwachsene','Elternbereich']}),
 'пульт': (r'(?<![а-яё])пульт', {'en':['control panel','panel','remote','dashboard','console'],'pt':['painel de controlo','painel','comando','consola'],'de':['Steuerung','Pult','Schaltzentrale','Bedienfeld','Elternbereich','Kontrollzentrum']}),
 'занятие': (r'заняти', {'en':['lesson','session','class','activity','practice'],'pt':['lição','sessão','aula','atividade'],'de':['Übung','Lektion','Stunde','Einheit','Sitzung']}),
 'медаль': (r'медал', {'en':['medal'],'pt':['medalha'],'de':['Medaille','Orden']}),
 'путешествие': (r'путешеств', {'en':['journey','trip','travel','voyage','adventure'],'pt':['viagem','jornada','aventura'],'de':['Reise','Fahrt','Abenteuer']}),
 'семья': (r'(?<![а-яё])семь(я|и|е|ю|ёй)(?![а-яё])', {'en':['family'],'pt':['família'],'de':['Familie']}),
 'телефон': (r'телефон', {'en':['phone','telephone','mobile','device'],'pt':['telemóvel','telefone','celular','dispositivo'],'de':['Handy','Telefon','Smartphone','Gerät']}),
 'экран': (r'(?<![а-яё])экран', {'en':['screen','display','page'],'pt':['ecrã','tela','página'],'de':['Bildschirm','Display','Seite']}),
 'нажми/нажмите': (r'(?<![а-яё])нажми(те)?(?![а-яё])', {'en':['tap','press','click','touch'],'pt':['toca','carrega','clica','prime','toque','carregue','clique'],'de':['tipp','tippe','drück','drücke','klick','tippen Sie','drücken Sie','klicken Sie']}),
}
out=[]
for name,(rx,cands) in TERMS.items():
    r=re.compile(rx,re.I)
    hit=[row for row in rows if r.search(row[1])]
    out.append(f'\n### {name}: {len(hit)} RU strings contain it')
    for lang,idx in [('en',2),('pt',3),('de',4)]:
        c=collections.Counter(); none=0; ex={}
        for row in hit:
            t=row[idx]
            if not t: continue
            found=[w for w in cands[lang] if re.search(r'(?<!\w)'+re.escape(w)+r'(s|es|en|n|e|er|a|as|os)?(?!\w)',t,re.I)]
            # prefer longest match
            found=sorted(found,key=len,reverse=True)
            if found:
                c[found[0]]+=1; ex.setdefault(found[0],(row[0],t[:70]))
            else: none+=1; ex.setdefault('∅',(row[0],t[:70]))
        parts=[f'{k}: {v}' for k,v in c.most_common()]
        out.append(f'  {lang}: '+', '.join(parts)+f' | no candidate word: {none}')
        for k,(g,t) in ex.items():
            if k!='∅' and c[k]<=max(3,0.15*sum(c.values())) and len(c)>1: out.append(f'      minority «{k}» e.g. [{g}] {t!r}')
print('\n'.join(out))
