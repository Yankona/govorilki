# turn the phonemes of a ё-proxy (the stressed vowel written as ё) into the phonemes of the word with that stress
import re
VL = 'аеёиоуыэюя'
HARD = 'жшц'
def vowel_at(w, k):
    n = 0
    for i, c in enumerate(w):
        if c in VL:
            if n == k: return i
            n += 1
def conv(pipa, word, k):
    i = vowel_at(word, k); V = word[i]; prev = word[i - 1] if i > 0 else ''
    m = re.search(r'(j|ʲ)?ˈ(ɵ|o)', pipa)
    if not m: return None
    pre = m.group(1) or ''
    initial = (prev == '' or prev in VL or prev in 'ъь')
    if V in 'аоуыэ':
        # a hard vowel: the consonant stays hard (ё softened it), a word-initial or post-vowel one has no [j]
        keep = '' if (pre in ('ʲ', 'j') and not (prev in 'чщй' and pre == 'ʲ')) else pre
        if prev in 'чщ': keep = pre
        if pre == 'j' and prev in 'ъь': keep = ''
        v = {'а': 'ɑ', 'о': 'o', 'у': 'u', 'ы': 'y', 'э': 'ɛ'}[V]
        if prev in 'чщй' and V == 'а': v = 'a'
    else:
        keep = pre
        if prev in HARD: keep = ''
        if V == 'и' and pre == 'j' and initial and prev not in 'ь': keep = ''
        v = {'е': 'e', 'и': 'i', 'я': 'a', 'ю': 'u'}[V]
        if prev in HARD: v = {'е': 'ɛ', 'и': 'y', 'я': 'a', 'ю': 'u'}[V]
    return pipa[:m.start()] + keep + 'ˈ' + v + pipa[m.end():]
