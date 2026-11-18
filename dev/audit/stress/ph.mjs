globalThis.__dirname='/home/user/govorilki/dev/tools/phsrv'; globalThis.__filename=__dirname+'/pp.js';
import {createRequire} from 'module'; globalThis.require=createRequire(import.meta.url);
const {createPiperPhonemize}=await import('/home/user/govorilki/dev/tools/phsrv/pp.js');
import fs from 'fs';
const dir='/home/user/govorilki/dev/tools/phsrv/';
const words=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
const cfg=JSON.parse(fs.readFileSync(dir+'ru.json','utf8'));const inv={};for(const [k,v] of Object.entries(cfg.phoneme_id_map))inv[v[0]]=k;const out={};
for (const w of words){
  out[w]=await new Promise(async res=>{
    const mod=await createPiperPhonemize({print:d=>{const r=JSON.parse(d);res(r.phoneme_ids.map(i=>inv[i]??'?').filter(c=>c!=='_').join(''))},printErr:()=>{},locateFile:u=>dir+(u.endsWith('.wasm')?'piper_phonemize.wasm':'piper_phonemize.data')});
    try{ mod.callMain(['-l','ru','--input',JSON.stringify([{text:w}]),'--espeak_data','/espeak-ng-data']);}catch(e){res('err '+e)}
  });
}
console.log(JSON.stringify(out));
