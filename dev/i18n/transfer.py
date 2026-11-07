# For a template that got a block inserted: carry the old translation over, insert the block (translated by `seg`),
# and renumber the placeholders.
import json, re, sys
def norm(s): return re.sub(r'\{\d+\}', '{#}', s)
def transfer(old_ru, new_ru, old_tr, seg_tr=lambda x: x):
    a, b = norm(old_ru), norm(new_ru)
    i = 0
    while i < len(a) and i < len(b) and a[i] == b[i]: i += 1
    j = 0
    while j < len(a) - i and j < len(b) - i and a[-1 - j] == b[-1 - j]: j += 1
    # map normalized positions back to the real new string
    def real_pos(s, npos):
        k = n = 0
        while n < npos:
            m = re.match(r'\{\d+\}', s[k:])
            if m: k += len(m.group()); n += 3
            else: k += 1; n += 1
        return k
    ins_start, ins_end = real_pos(new_ru, i), real_pos(new_ru, len(b) - j)
    seg = new_ru[ins_start:ins_end]
    n_before = len(re.findall(r'\{\d+\}', new_ru[:ins_start])); n_ins = len(re.findall(r'\{\d+\}', seg))
    pre_a = a[:i]
    cy = max((k for k, ch in enumerate(pre_a) if re.match('[А-Яа-яЁё«»]', ch)), default=-1)
    anchor = pre_a[cy + 1:][-60:]
    if len(anchor) < 8: raise ValueError('anchor too short: ' + repr(anchor))
    # where the anchor ends in the translation (placeholders normalised)
    t_norm = norm(old_tr)
    p = t_norm.rfind(anchor) if t_norm.count(anchor) == 1 else -1
    if p < 0: raise ValueError('anchor not found: ' + anchor)
    tpos = real_pos(old_tr, p + len(anchor))
    shifted = re.sub(r'\{(\d+)\}', lambda m: '{%d}' % (int(m.group(1)) + (n_ins if int(m.group(1)) >= n_before else 0)), old_tr)
    # position in shifted: same as tpos plus growth of renumbered placeholders before it
    pre = re.sub(r'\{(\d+)\}', lambda m: '{%d}' % (int(m.group(1)) + (n_ins if int(m.group(1)) >= n_before else 0)), old_tr[:tpos])
    return pre + seg_tr(seg) + shifted[len(pre):]
