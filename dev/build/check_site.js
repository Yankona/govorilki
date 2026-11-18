// Checks of the built site that need no browser (seconds). Run after build/build_all.sh, from dev/:
//   node build/check_site.js [site folder=the repository root]
// 1. translations: i18n/out-{en,pt,de}.html.missing.json hold exactly the baseline (8 strings in GAMES, LEARN_IMG,
//    SND_HI); anything else is printed by group, so the new strings are named (then skill translate);
// 2. every page's scripts parse (a syntax error kills the whole app at load; this names the line);
// 3. every data pack a page names (PACKS) is in data/<lang>/, parses and has the hash the page expects
//    (a page built without its packs, or packs from another build, breaks stories offline and online);
// 4. every file the service worker installs (SHELL in sw.js) exists, or the worker never installs and nothing is offline;
// 5. the source JSON files of dev/ parse;
// 6. no secrets and no personal email addresses in tracked text files (the repository is public).
// Exits 1 with one line per problem.
const fs = require('fs'), path = require('path'), crypto = require('crypto'), { execFileSync } = require('child_process');
const DEV = path.join(__dirname, '..');
const acorn = require(path.join(DEV, 'i18n', 'node_modules', 'acorn'));
const SITE = path.resolve(process.argv[2] || process.env.SITE || path.join(DEV, '..'));
const bad = [], ok = [];
const fail = m => bad.push(m);

// 1. translations
const BASE = { GAMES: 1, LEARN_IMG: 3, SND_HI: 4 };
for (const L of ['en', 'pt', 'de']) {
  const f = path.join(DEV, 'i18n', `out-${L}.html.missing.json`);
  if (!fs.existsSync(f)) { fail(`${L}: no ${path.relative(DEV, f)} (run build/build_all.sh first)`); continue; }
  const m = JSON.parse(fs.readFileSync(f, 'utf8'));
  for (const [g, a] of Object.entries(m)) if ((BASE[g] || 0) < a.length)
    fail(`${L}: untranslated in ${g}: ${a.slice(BASE[g] || 0, (BASE[g] || 0) + 5).map(s => JSON.stringify(String(s).slice(0, 60))).join(', ')}${a.length - (BASE[g] || 0) > 5 ? ' …' : ''} (skill translate)`);
  const n = Object.values(m).reduce((s, a) => s + a.length, 0);
  if (n === 8 && Object.keys(m).length === 3) ok.push(`${L} missing 8 in 3 groups`);
}

// 2–3. pages and packs
const PAGES = { '': 'en', 'en/': 'en', 'ru/': 'ru', 'pt/': 'pt', 'de/': 'de' };
for (const [dir, L] of Object.entries(PAGES)) {
  const f = path.join(SITE, dir, 'index.html');
  if (!fs.existsSync(f)) { fail(`/${dir}: no index.html`); continue; }
  let html = fs.readFileSync(f, 'utf8');
  // the game's script lives in data/<lang>/app.<hash>.js since v172 (audit-speed): check it as part of the page
  const ap = (html.match(/GV_APP\s*=\s*'([^']+)'/) || [])[1];
  if (ap) {
    const af = path.join(SITE, dir, ap);
    if (!fs.existsSync(af)) fail(`/${dir}: the game's script ${ap} is missing`);
    else html += '\n<script>' + fs.readFileSync(af, 'utf8') + '</script>';
  }
  const lang = (html.match(/\bLANG = '([a-z]+)'/) || [])[1];
  if (lang !== L) fail(`/${dir}: LANG is ${lang}, expected ${L}`);
  let i = 0, nScripts = 0;
  for (const m of html.matchAll(/<script(\s[^>]*)?>([\s\S]*?)<\/script>/g)) {
    i++; const attrs = m[1] || '', code = m[2];
    if (/\bsrc=/.test(attrs) || /type=["']?(application\/(ld\+)?json|text\/template)/.test(attrs) || !code.trim()) continue;
    nScripts++;
    try { acorn.parse(code, { ecmaVersion: 'latest', sourceType: /type=["']?module/.test(attrs) ? 'module' : 'script', allowHashBang: true }); }
    catch (e) {
      const ln = html.slice(0, m.index).split('\n').length + (e.loc ? e.loc.line - 1 : 0);
      fail(`/${dir}index.html script ${i}: ${e.message} (page line ${ln})`);
    }
  }
  const pm = html.match(/PACKS = (\{[^}]*\})/);
  if (!pm) { fail(`/${dir}: no PACKS in the page`); continue; }
  const packs = JSON.parse(pm[1]);
  for (const [k, h] of Object.entries(packs)) {
    const pf = path.join(SITE, 'data', L, k + '.json');
    if (!fs.existsSync(pf)) { fail(`/${dir}: pack data/${L}/${k}.json is missing`); continue; }
    const j = fs.readFileSync(pf, 'utf8');
    try { JSON.parse(j); } catch (e) { fail(`data/${L}/${k}.json: ${e.message}`); continue; }
    const got = crypto.createHash('sha1').update(j).digest('hex').slice(0, 10);
    if (got !== h) fail(`/${dir}: data/${L}/${k}.json has hash ${got}, the page expects ${h} (packs from another build?)`);
  }
  ok.push(`/${dir} ${nScripts} scripts parse, ${Object.keys(packs).length} packs`);
}

// 4. service worker
const sw = fs.readFileSync(path.join(SITE, 'sw.js'), 'utf8');
const shell = sw.match(/const SHELL = (\[[^\]]*\])/);
if (!shell) fail('sw.js: no SHELL list');
else for (const u of JSON.parse(shell[1].replace(/'/g, '"'))) {
  const p = path.join(SITE, u.replace(/^\.\//, ''));
  if (!fs.existsSync(p.endsWith('/') || u === './' ? path.join(p, 'index.html') : p)) fail(`sw.js SHELL: ${u} does not exist in the site`);
}
try { acorn.parse(sw, { ecmaVersion: 'latest' }); } catch (e) { fail(`sw.js: ${e.message}`); }

// 5. source JSON
const git = (...a) => execFileSync('git', a, { cwd: DEV, encoding: 'utf8', maxBuffer: 1 << 28 });
let nj = 0;
for (const f of git('ls-files', '-z', '--', '*.json').split('\0').filter(Boolean)) {
  const p = path.join(DEV, f); if (!fs.existsSync(p)) continue;
  try { JSON.parse(fs.readFileSync(p, 'utf8')); nj++; } catch (e) { fail(`dev/${f}: ${e.message}`); }
}
ok.push(`${nj} source JSON files parse`);

// 6. secrets and email addresses in tracked text files (binary files skipped with -I)
const grep = re => { try { return git('-C', path.join(DEV, '..'), 'grep', '-I', '-n', '-E', re, '--', '.', ':!*.min.js').trim().split('\n').filter(Boolean); } catch (e) { return []; } };
for (const l of grep('BEGIN (RSA |EC |OPENSSH |DSA )?PRIVATE KEY|ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{40,}|AKIA[0-9A-Z]{16}|sk-ant-[A-Za-z0-9_-]{20,}|xox[bp]-[A-Za-z0-9-]{20,}'))
  fail(`secret? ${l.slice(0, 140)}`);
for (const l of grep('[A-Za-z0-9._%+-]+@(gmail|googlemail|yahoo|hotmail|outlook|icloud|me|mail|yandex|ya|rambler|bk|inbox|list)\\.(com|ru|pt|de)\\b'))
  fail(`personal email? ${l.replace(/[A-Za-z0-9._%+-]+@/, '…@').slice(0, 140)}`);

for (const m of ok) console.log('ok  ' + m);
for (const m of bad) console.log('BAD ' + m);
console.log(bad.length ? `check_site: ${bad.length} problem(s)` : 'check_site: OK');
process.exit(bad.length ? 1 : 0);
