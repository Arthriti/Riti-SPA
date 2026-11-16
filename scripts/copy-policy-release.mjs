import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {createHash} from 'node:crypto';
export async function copyPolicyRelease(root,output){
 const manifest=JSON.parse(await readFile(resolve(root,'policy-release/manifest.json'),'utf8'));
 const files=new Map();
 for(const entry of manifest.documents){
  if(!/^\/(?:docs\/[a-z0-9_]+|support|delete-account)\.html$/.test(entry.path))throw Error('Invalid policy release path');
  const bytes=await readFile(resolve(root,'policy-release','.'+entry.path));
  if(createHash('sha256').update(bytes).digest('hex')!==entry.sha256)throw Error('Frozen policy changed: '+entry.path);
  files.set(entry.path,bytes);
 }
 for(const alias of manifest.aliases){
  if(!/^\/docs\/(?:privacy_policy|terms_conditions)(?:_hi)?\.html$/.test(alias.path)||!files.has(alias.target)||files.has(alias.path))throw Error('Invalid policy alias');
  files.set(alias.path,files.get(alias.target));
 }
 for(const [path,bytes] of files){const file=resolve(output,'.'+path);await mkdir(dirname(file),{recursive:true});await writeFile(file,bytes);}
}
