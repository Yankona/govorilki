import json,re,glob,collections
f=json.load(open('/home/user/govorilki/dev/i18n/fixed.json'))
d=json.load(open('/home/user/govorilki/dev/i18n/de/fixed_de.json'))
en=[];pt=[];de=[]
for g,v in f.items():
    for ru,tr in v.items():
        if isinstance(tr,list) and len(tr)>=2:
            en.append((g,ru,tr[0])); pt.append((g,ru,tr[1]))
for g,v in d.items():
    for ru,tr in v.items():
        if isinstance(tr,str): de.append((g,ru,tr))
def stories(lang):
    out=[]
    for fn in sorted(glob.glob(f'/home/user/govorilki/data/{lang}/st*.json')):
        for i,it in json.load(open(fn)).items():
            out.append((fn.split('/')[-1],i,it.get('s','')+' || '+' | '.join(it.get('a') or [])))
    return out
def show(items,rx,label,n=12,ctx=90):
    r=re.compile(rx); hits=[(g,ru,t) for g,ru,t in items if r.search(t)]
    print(f'\n## {label}: {len(hits)}')
    for g,ru,t in hits[:n]:
        m=r.search(t); a=max(0,m.start()-ctx//2); print(f'   - [{g[:20]}] …{t[a:a+ctx+len(m.group())]!r}…   RU: {ru[:60]!r}')
    return hits
show(en,r'\bcolor(s|ed|ful|ing)?\b','EN US color')
show(en,r'\bmath\b','EN math')
show(en,r'\b(realiz|organiz|recogniz|memoriz|practic)e','EN -ize/practice')
show(en,r'\bmeters?\b','EN meters')
show(en+stories('en'),r'\b(gotten|fall\b.*\bseason|sidewalk|trash can|cookie|soccer|diaper|apartment|elevator|flashlight|vacation|eraser)\b','EN US vocabulary')
show(pt,r'\bvocês?\b','PT você')
show(pt+stories('pt'),r'\b(est[áa]|est[ãa]o|estava|estamos|vai|vão)\s+\w+ndo\b','PT gerund progressive')
show(pt+stories('pt'),r'\btela\b','PT tela')
show(pt,r'\btrem\b','PT trem')
show(pt,r'\btime\b','PT time')
show(pt+stories('pt'),r'\ba gente\b','PT a gente',8)
show(pt+stories('pt'),r'\bgalera\b','PT galera')
show(pt+stories('pt'),r'\b(bonde|ônibus|celular|geladeira|sorvete|banheiro|café da manhã|suco|xícara|aquarela|açougue|grama\b|caminhão|legal\b|bacana|tchau|esporte|ônibus|usuário|mouse|tela|time\b|trem\b|bala\b|pipoca|tênis|terno)','PT BR vocabulary',20)
# DE: Sie mid-sentence only (not after . ! ? or start, not after „ or «)
show(de,r'(?<=[a-zäöüß,;:] )(Sie|Ihnen|Ihre?[mnrs]?)(?![\w])','DE Sie mid-sentence',4)
show(de,r'(?s)(?=.*(?<=[a-zäöüß,;:] )(Sie|Ihnen|Ihre?[mnrs]?)(?![\w]))(?=.*(?<![\w])(du|dich|dir|deine?[mnrs]?)(?![\w]))','DE Sie+du same string',12,140)
show(stories('de'),r'(?s)(?=.*(?<=[a-zäöüß,;:] )(Sie|Ihnen|Ihre?[mnrs]?)(?![\w]))(?=.*(?<![\w])(du|dich|dir|deine?[mnrs]?)(?![\w]))','DE stories Sie+du same string',6,140)
show(de+stories('de'),r'\b(Strasse|gross|weiss\b|heisst|Fuss\b|Spass|schliess|Gruss|Schluss\b|grösse|süss|Füsse|draussen|ausser|heiss\b|fliessen|giessen|Strauss)','DE ß missing',12)
show(de+stories('de'),r'\b(der|die|das|ein|eine|einen|einem|dem|den|zum|zur|im|am) [a-zäöü]+(ung|heit|keit|schaft|chen|lein|tum|nis)\b(?! )','DE lowercase noun suffix after article',12)
show(de+stories('de'),r'(?<![\w-])(Du|Dich|Dir|Dein|Deine[mnrs]?)(?![\w])(?<!^Du)','DE capitalised Du mid-text',8)
# EN archaic / stilted
show(en,r"\b(shall|whilst|amongst|upon|thus|hence|alas)\b",'EN archaic/stilted',10)
# PT: 'o/a' gendered address to child in girl-default strings? count 'pronta' 'cansada' etc. not relevant.
# untranslated Cyrillic in translations
show(en,r'[А-Яа-яЁё]','EN Cyrillic in translation',20)
show(pt,r'[А-Яа-яЁё]','PT Cyrillic in translation',20)
show(de,r'[А-Яа-яЁё]','DE Cyrillic in translation',20)
# identical-to-Russian translations (untranslated) excluding code/short
same=[(g,ru,t) for g,ru,t in en if t==ru and re.search(r'[А-Яа-яЁё]{3,}',ru)]
print('\n## EN translation == RU (untranslated):',len(same)); [print('   -',g[:20],repr(ru[:80])) for g,ru,t in same[:25]]
same=[(g,ru,t) for g,ru,t in de if t==ru and re.search(r'[А-Яа-яЁё]{3,}',ru)]
print('\n## DE translation == RU (untranslated):',len(same)); [print('   -',g[:20],repr(ru[:80])) for g,ru,t in same[:25]]
