# target phonemes of a word with a given stress: the consonants of the word's own phonemes, the vowels (with their
# reduction) of its ё-proxy, and the stressed vowel by the letter
VL = 'аеёиоуыэюя'
VI = 'aɑeɛiɪoɔuyʌɵ'
def toks(p):
    out = []
    i = 0
    while i < len(p):
        c = p[i]
        if c in VI and p[i + 1:i + 2] == '^': out.append(('C', c + '^')); i += 2; continue
        if c in VI:
            t = c
            if p[i + 1:i + 2] == '"': t += '"'; i += 1
            out.append(('V', t))
        elif c in 'ˈˌ': out.append(('M', c))
        elif c == 'ʲ' and out and out[-1][0] == 'C': out[-1] = ('C', out[-1][1] + c)
        else: out.append(('C', c))
        i += 1
    return out
def vowel_at(w, k):
    n = 0
    for i, c in enumerate(w):
        if c in VL:
            if n == k: return i
            n += 1
def stressed_symbol(word, k):
    i = vowel_at(word, k); V = word[i]; prev = word[i - 1] if i > 0 else ''
    iot = prev == '' or prev in VL + 'ъь'
    hard = prev != '' and prev in 'жшц'
    last = i == len(word) - 1
    if V in 'ая': return 'a' if (V == 'я' and iot) else 'ɑ'
    if V == 'о': return 'o'
    if V == 'у': return 'u'
    if V == 'ю': return 'u' if iot else 'u"'
    if V == 'ы': return 'y'
    if V == 'э': return 'ɛ'
    if V == 'е': return 'ɛ' if hard else 'e'
    if V == 'и': return 'y' if hard else ('ɪ' if last else 'i')
    if V == 'ё': return 'ɵ'
def target(orig, prox, word, k):
    a = [t for t in toks(orig) if t[0] != 'M']; b = toks(prox)
    bv = [t[1] for t in b if t[0] == 'V']
    av = [i for i, t in enumerate(a) if t[0] == 'V']
    if len(av) != len(bv) or k >= len(av): return None
    out = []
    vi = 0
    for i, (kind, s) in enumerate(a):
        if kind == 'V':
            if vi == k:
                V = word[vowel_at(word, k)]
                if V in 'яю' and out and out[-1] == 'j': out.insert(len(out) - 1, 'ˈ')
                else: out.append('ˈ')
                out.append(stressed_symbol(word, k))
            else: out.append(bv[vi].replace('ɵ', 'o'))
            vi += 1
        else: out.append(s)
    return ''.join(out)
