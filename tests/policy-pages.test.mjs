import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, readdir, mkdtemp, cp, writeFile, rm} from 'node:fs/promises';
import {resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {parseSource, inline, renderPage, buildPolicyPreview, digest} from '../scripts/policy-pages.mjs';
const root=resolve(import.meta.dirname,'..');
const sourceDir=resolve(root,'content/mobile-policies');
async function documents(){return Promise.all((await readdir(sourceDir)).filter(f=>f.endsWith('.md')).sort().map(async f=>parseSource(await readFile(resolve(sourceDir,f),'utf8'),f)));}
const decode=text=>text.replace(/<[^>]*>/g,'').replaceAll('&amp;','&').replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&quot;','"').replaceAll('&#39;',"'").replace(/\s+/g,' ').trim();
test('all six sources render their complete policy body without metadata or script leakage',async()=>{
  const docs=await documents(); assert.equal(docs.length,6);
  const css=await readFile(resolve(root,'scripts/policy-page.css'),'utf8');
  for(const doc of docs){
    const html=renderPage(doc,docs,css);
    assert.equal((html.match(/<h1>/g)||[]).length,1);
    assert.doesNotMatch(html,/<script|publication_status|blocked-see-SITE_HANDOFF|canonical_path/);
    const article=decode(html.match(/<article[^>]*>([\s\S]*?)<\/article>/)[1]);
    const expected=doc.blocks.slice(1).flatMap(b=>b.items||[b.text]).map(text=>decode(inline(text))).join(' ');
    assert.equal(article,expected,doc.filename);
    assert.ok(html.includes('https://nowriti.app/privacy.html'));
    assert.ok(html.includes('noindex,nofollow'));
  }
});
test('translations point to the matching version and bilingual instructions work without scripts',async()=>{
  const docs=await documents();
  for(const doc of docs){
    const html=renderPage(doc,docs,'');
    if(doc.legal){assert.match(html,/<html lang="(?:en|hi)"/);assert.match(html,/hreflang="en"/);assert.match(html,/hreflang="hi"/);}
    else{assert.match(html,/href="#english"/);assert.match(html,/href="#hindi"/);assert.match(html,/id="hindi" lang="hi"/);}
    for(const [,href] of html.matchAll(/href="([^"]+)"/g)){
      if(href.startsWith('https:')||href.startsWith('mailto:'))continue;
      if(href.startsWith('#')){assert.ok(html.includes(`id="${href.slice(1)}"`),href);continue;}
      const path=new URL(href,'https://nowriti.app'+doc.metadata.canonical_path).pathname;
      assert.ok(docs.some(d=>d.metadata.canonical_path===path),href);
    }
  }
});
test('unsafe routes, active markup, unsupported Markdown and unsafe links fail visibly',async()=>{
  const source=await readFile(resolve(sourceDir,'privacy_policy_v1.md'),'utf8');
  assert.throws(()=>parseSource(source.replace('/docs/privacy_policy_v1.html','/../privacy.html'),'bad.md'));
  assert.throws(()=>parseSource(source+'\n<script>alert(1)</script>\n','bad.md'));
  assert.throws(()=>parseSource(source+'\n| table |\n','bad.md'));
  assert.throws(()=>inline('[unsafe](javascript:alert)'));
  assert.equal(inline('<privacy@nowriti.app>'),'<a href="mailto:privacy@nowriti.app">privacy@nowriti.app</a>');
});
test('replacing one draft updates only its rendered document and deterministic hashes',async()=>{
  const fixture=await mkdtemp(resolve(tmpdir(),'riti-policies-'));
  try{
    await cp(sourceDir,resolve(fixture,'content/mobile-policies'),{recursive:true});
    await cp(resolve(root,'scripts'),resolve(fixture,'scripts'),{recursive:true});
    const first=await buildPolicyPreview(fixture),second=await buildPolicyPreview(fixture);
    assert.deepEqual(first,second);
    const file=resolve(fixture,'content/mobile-policies/privacy_policy_v1.md');
    await writeFile(file,(await readFile(file,'utf8')).replace('publication_status: blocked-see-SITE_HANDOFF','publication_status: ready-for-review').replace('effective_date: not-yet-published','effective_date: 2026-12-01').replace('The effective publication date will appear here when this\nversion is released.','Effective 1 December 2026.'));
    const changed=await buildPolicyPreview(fixture);
    for(const entry of changed.documents){
      const old=first.documents.find(d=>d.path===entry.path);
      assert.equal(entry.previewHtmlSha256!==old.previewHtmlSha256,entry.source==='privacy_policy_v1.md');
      assert.equal(entry.previewHtmlSha256,digest(await readFile(resolve(fixture,'.policy-preview','.'+entry.path))));
    }
    const html=await readFile(resolve(fixture,'.policy-preview/docs/privacy_policy_v1.html'),'utf8');
    assert.ok(html.includes('2026-12-01'));assert.ok(html.includes('Review copy · Not published'));
  }finally{if(!fixture.startsWith(resolve(tmpdir(),'riti-policies-')))throw Error('Unsafe fixture cleanup');await rm(fixture,{recursive:true,force:true});}
});
test('normal website build excludes mobile policy candidates',async()=>{
  const build=await readFile(resolve(root,'scripts/build.mjs'),'utf8');
  assert.doesNotMatch(build,/mobile-policies|policy-preview|buildPolicyPreview|build-policies/);
});
