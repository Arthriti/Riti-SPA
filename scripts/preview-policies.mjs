import http from 'node:http';
import { watch } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { buildPolicyPreview } from './policy-pages.mjs';

const root = resolve(import.meta.dirname,'..');
const output = resolve(root,'.policy-preview');
await buildPolicyPreview(root);
let dirty = false, rebuilding, buildError;
watch(resolve(root,'content/mobile-policies'),()=>{dirty=true;});
watch(resolve(root,'scripts/policy-page.css'),()=>{dirty=true;});
http.createServer(async (request,response)=>{
  try {
    if (dirty && !rebuilding) { dirty=false; rebuilding=buildPolicyPreview(root).then(()=>{buildError=null;}).catch(error=>{buildError=error;}).finally(()=>{rebuilding=null;}); }
    if (rebuilding) await rebuilding;
    if (buildError) throw buildError;
    const path = decodeURIComponent(new URL(request.url,'http://localhost').pathname);
    const target = resolve(output,'.'+(path==='/'?'/support.html':path));
    if (!target.startsWith(output+sep) || !target.endsWith('.html')) { response.writeHead(404).end('Not found'); return; }
    const body=await readFile(target);
    response.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow'}).end(body);
  } catch (error) {
    console.error(error.message);
    response.writeHead(503,{'Content-Type':'text/plain; charset=utf-8'}).end('The local preview could not be rebuilt. Check the terminal for the source error.');
  }
}).listen(4186,'127.0.0.1',()=>console.log('Policy review: http://127.0.0.1:4186/ (local only; replace a source file, then refresh)'));
