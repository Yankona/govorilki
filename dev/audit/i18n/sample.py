import json, random, re, sys
f=json.load(open('/home/user/govorilki/dev/i18n/fixed.json'))
d=json.load(open('/home/user/govorilki/dev/i18n/de/fixed_de.json'))
def human(ru,t):
    if not re.search(r'[А-Яа-яЁё]{2,}', ru): return False
    if len(ru)>220 or len(ru)<4: return False
    if ru.count('<')>2: return False
    if not isinstance(t,str) or not t.strip(): return False
    return True
cands=[]
for g,v in f.items():
    for ru,tr in v.items():
        if isinstance(tr,list) and len(tr)>=2 and human(ru,tr[0]) and human(ru,tr[1]):
            cands.append((g,ru,tr[0],tr[1], d.get(g,{}).get(ru)))
print('candidates',len(cands), 'with de', sum(1 for c in cands if c[4]))
# categorize
def cat(g,ru):
    gl=g.lower()
    if any(k in gl for k in ['parent','pult','guest','invite','fam','settings','sync','cloud','report','guide']): return 'parent'
    if any(k in ru.lower() for k in ['ошибк','не удалось','не получилось','нет связи','попробуй ещё','попробуйте']): return 'error'
    if len(ru)<=22 and not ru.endswith('.') : return 'button'
    return 'friend'
for c in cands: pass
random.seed(7)
pool={}
for c in cands:
    pool.setdefault(cat(c[0],c[1]),[]).append(c)
print({k:len(v) for k,v in pool.items()})
quota={'button':15,'friend':25,'parent':12,'error':8}
sample=[]
for k,n in quota.items():
    sample+=random.sample(pool[k],n)
# de sample: same items where de exists else fill from de-having candidates
random.seed(7)
de_pool={}
for c in cands:
    if c[4]: de_pool.setdefault(cat(c[0],c[1]),[]).append(c)
print('de pool',{k:len(v) for k,v in de_pool.items()})
de_sample=[]
for k,n in quota.items():
    de_sample+=random.sample(de_pool[k],n)
json.dump({'enpt':sample,'de':de_sample},open('/tmp/claude-0/-home-user-govorilki/c1b0d3e7-ea18-5cf4-9cf9-63cd21a8f7a6/scratchpad/i18n/sample.json','w'),ensure_ascii=False,indent=1)
for i,c in enumerate(sample):
    print(f'#{i+1} [{cat(c[0],c[1])}] {c[0]}\n RU: {c[1]}\n EN: {c[2]}\n PT: {c[3]}')
print('=========== DE')
for i,c in enumerate(de_sample):
    print(f'#{i+1} [{cat(c[0],c[1])}] {c[0]}\n RU: {c[1]}\n DE: {c[4]}')
