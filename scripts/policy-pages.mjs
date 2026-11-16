import { readFile, readdir, mkdir, writeFile, rm } from 'node:fs/promises';
import { resolve, dirname, posix } from 'node:path';
import { createHash } from 'node:crypto';

export const digest = value => createHash('sha256').update(value).digest('hex');
const escape = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const relativeLink = (from, to) => posix.relative(posix.dirname(from), to) || posix.basename(to);

export function parseSource(source, filename) {
  const text = source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  const match = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]+)$/);
  if (!match) throw new Error(`${filename}: expected metadata followed by Markdown`);
  const metadata = {};
  for (const line of match[1].split('\n')) {
    const field = line.match(/^([a-z_]+):\s*(.+)$/);
    if (!field || Object.hasOwn(metadata, field[1])) throw new Error(`${filename}: invalid or duplicate metadata`);
    metadata[field[1]] = field[2].replace(/^(['"])(.*)\1$/, '$2');
  }
  if (!metadata.page_title || !metadata.publication_status) throw new Error(`${filename}: title and publication_status are required`);
  if (!/^\/(?:docs\/[a-z0-9_]+|support|delete-account)\.html$/.test(metadata.canonical_path)) throw new Error(`${filename}: unsupported canonical_path`);
  const legal = metadata.canonical_path.startsWith('/docs/');
  if (legal && (!/^(privacy|terms)-v[1-9]\d*$/.test(metadata.version) || !['en','hi'].includes(metadata.language) || !metadata.effective_date)) throw new Error(`${filename}: policy version, language and effective_date are required`);
  if (legal) {
    const [, kind, revision] = metadata.version.match(/^(privacy|terms)-v(\d+)$/);
    const expected = `/docs/${kind === 'privacy' ? 'privacy_policy' : 'terms_conditions'}_v${revision}${metadata.language === 'hi' ? '_hi' : ''}.html`;
    if (expected !== metadata.canonical_path) throw new Error(`${filename}: URL must match version and language`);
    if (metadata.effective_date !== 'not-yet-published' && !/^\d{4}-\d{2}-\d{2}$/.test(metadata.effective_date)) throw new Error(`${filename}: use an ISO effective_date or not-yet-published`);
  }
  const blocks = [];
  const lines = match[2].trim().split('\n');
  for (let i = 0; i < lines.length;) {
    if (!lines[i].trim()) { i++; continue; }
    const heading = lines[i].match(/^(#{1,6}) (.+)$/);
    if (heading) { blocks.push({type:'heading', level:heading[1].length, text:heading[2]}); i++; continue; }
    if (/^(?:[-*] |\d+\. )/.test(lines[i])) {
      const ordered = /^\d+\. /.test(lines[i]);
      const items = [];
      while (i < lines.length && /^(?:[-*] |\d+\. )/.test(lines[i])) {
        if (ordered !== /^\d+\. /.test(lines[i])) break;
        let item = lines[i++].replace(/^(?:[-*]|\d+\.) /, '');
        while (i < lines.length && /^ {2}\S|^ {2} +\S/.test(lines[i])) {
          if (/^\s+(?:[-*] |\d+\. )/.test(lines[i])) throw new Error(`${filename}: nested lists need renderer support`);
          item += ' ' + lines[i++].trim();
        }
        items.push(item);
      }
      blocks.push({type:'list', ordered, items}); continue;
    }
    const paragraph = [];
    while (i < lines.length && lines[i].trim() && !/^(?:#{1,6} |[-*] |\d+\. )/.test(lines[i])) {
      if (/^(?:```|~~~|\||>|---$|\s{4})/.test(lines[i]) || /<\/?[a-z][^>]*>/i.test(lines[i].replace(/<(?:[^<>\s]+@[^<>\s]+|https?:\/\/[^<>\s]+)>/g,''))) throw new Error(`${filename}: unsupported Markdown block at line ${i + 1}; no text was published`);
      paragraph.push(lines[i++].trim());
    }
    blocks.push({type:'paragraph', text:paragraph.join(' ')});
  }
  if (blocks[0]?.type !== 'heading' || blocks[0].level !== 1 || blocks.filter(b=>b.type==='heading'&&b.level===1).length !== 1) throw new Error(`${filename}: exactly one leading H1 is required`);
  if (!legal && !blocks.some(b=>b.type==='heading'&&b.level===2&&b.text==='हिंदी')) throw new Error(`${filename}: bilingual operational pages need a ## हिंदी section`);
  return {filename, metadata, blocks, legal, sourceSha256:digest(source)};
}

export function inline(text, link = value => value) {
  const tokens = /\[([^\]]+)\]\(([^\s)]+)\)|<([^<>\s]+@[^<>\s]+|https?:\/\/[^<>\s]+)>|\*\*([^*]+)\*\*|`([^`]+)`|\*([^*]+)\*/g;
  let result = '', cursor = 0;
  for (const match of text.matchAll(tokens)) {
    result += escape(text.slice(cursor, match.index));
    if (match[1] || match[3]) {
      const label = match[1] || match[3];
      const href = match[2] || (/^https?:/.test(match[3]) ? match[3] : `mailto:${match[3]}`);
      if (!/^(?:https:\/\/|mailto:|\/|#)/.test(href) || href.startsWith('//')) throw new Error(`Unsupported link destination: ${href}`);
      result += `<a href="${escape(link(href))}">${escape(label)}</a>`;
    } else if (match[4]) result += `<strong>${escape(match[4])}</strong>`;
    else if (match[5]) result += `<code>${escape(match[5])}</code>`;
    else result += `<em>${escape(match[6])}</em>`;
    cursor = match.index + match[0].length;
  }
  return result + escape(text.slice(cursor));
}

export function renderPage(doc, documents, css) {
  const m = doc.metadata, hi = m.language === 'hi', lang = hi ? 'hi' : 'en';
  const aliases = new Map();
  for (const item of documents.filter(d=>d.legal).sort((a,b)=>Number(a.metadata.version.split('-v')[1])-Number(b.metadata.version.split('-v')[1]))) {
    aliases.set(item.metadata.canonical_path.replace(/_v\d+/, ''), item.metadata.canonical_path);
  }
  const paths = new Set(documents.map(d=>d.metadata.canonical_path));
  const mapLink = href => {
    if (!href.startsWith('https://nowriti.app/')) return href;
    const url = new URL(href);
    const path = aliases.get(url.pathname) || url.pathname;
    return paths.has(path) ? relativeLink(m.canonical_path, path) + url.hash : href;
  };
  const content = value => inline(value, mapLink);
  const counterpart = doc.legal ? documents.find(d=>d.metadata.version===m.version && d.metadata.language!==m.language) : null;
  if (doc.legal && !counterpart) throw new Error(`${doc.filename}: matching English/Hindi version is missing`);
  let headingIndex = 0;
  const headings = [];
  let body = doc.legal ? '' : '<section id="english" lang="en" aria-label="English">';
  for (const block of doc.blocks.slice(1)) {
    if (block.type === 'heading') {
      if (!doc.legal && block.text === 'हिंदी' && block.level === 2) {
        body += '</section><section id="hindi" lang="hi" aria-label="हिंदी"><h2>हिंदी</h2>\n'; continue;
      }
      const id = `section-${++headingIndex}`;
      headings.push({id, text:block.text});
      body += `<h${block.level} id="${id}">${content(block.text)}</h${block.level}>\n`;
    } else if (block.type === 'list') {
      const tag = block.ordered ? 'ol' : 'ul';
      body += `<${tag}>${block.items.map(item=>`<li>${content(item)}</li>`).join('\n')}</${tag}>\n`;
    } else body += `<p>${content(block.text)}</p>\n`;
  }
  if (!doc.legal) body += '</section>';
  const languageNav = doc.legal
    ? ['en','hi'].map(language=>`<a lang="${language}" hreflang="${language}" ${language===lang?'aria-current="page" ':''}href="${escape(relativeLink(m.canonical_path, language===lang?m.canonical_path:counterpart.metadata.canonical_path))}">${language==='en'?'English':'हिंदी'}</a>`).join('')
    : '<a lang="en" href="#english">English</a><a lang="hi" href="#hindi">हिंदी</a>';
  const date = m.effective_date === 'not-yet-published' ? (hi?'अभी लागू नहीं':'Not yet effective') : escape(m.effective_date || '');
  const metadata = doc.legal ? `<dl class="metadata"><div><dt>${hi?'संस्करण':'Version'}</dt><dd>${escape(m.version)}</dd></div><div><dt>${hi?'लागू होने की तारीख':'Effective date'}</dt><dd>${date}</dd></div></dl>` : '';
  const toc = headings.length ? `<aside><details><summary>${hi?'इस पृष्ठ पर':'On this page'}</summary><nav aria-label="${hi?'विषय सूची':'Contents'}">${headings.map(h=>`<a href="#${h.id}">${escape(h.text)}</a>`).join('')}</nav></details></aside>` : '';
  const title = doc.legal ? content(doc.blocks[0].text) : doc.blocks[0].text.split(' / ').map((part,i)=>`<span lang="${i?'hi':'en'}">${content(part)}</span>`).join(' / ');
  return `<!doctype html>
<html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="description" content="${escape(m.page_title)}"><title>${escape(m.page_title)} | Riti</title><style>${css}</style></head>
<body><a class="skip" href="#document">${hi?'दस्तावेज़ पर जाएँ':'Skip to document'}</a>
<div class="review-note">${hi?'समीक्षा प्रति · प्रकाशित नहीं':'Review copy · Not published'}</div>
<header class="site-header"><a class="wordmark" href="https://nowriti.app/" aria-label="Riti home">Riti<span>.</span></a><nav class="language" aria-label="${hi?'भाषा':'Language'}">${languageNav}</nav></header>
<main id="document" tabindex="-1"><div class="document-heading"><p class="eyebrow">${hi?'Riti मोबाइल ऐप':'Riti mobile app'}</p><h1>${title}</h1>${metadata}</div>
<div class="document-layout ${toc?'':'without-toc'}">${toc}<article aria-label="${escape(m.page_title)}">${body}</article></div></main>
<footer><a href="${relativeLink(m.canonical_path,'/support.html')}">${hi?'सहायता':'App support'}</a><a href="${relativeLink(m.canonical_path,'/delete-account.html')}">${hi?'खाता मिटाएँ':'Delete account'}</a><a href="https://nowriti.app/privacy.html">${hi?'वेबसाइट की निजता सूचना':'Website privacy notice'}</a></footer></body></html>\n`;
}

export async function buildPolicyPreview(root) {
  const input = resolve(root, 'content/mobile-policies');
  const filenames = (await readdir(input)).filter(name=>name.endsWith('.md')).sort();
  const documents = await Promise.all(filenames.map(async name=>parseSource(await readFile(resolve(input,name),'utf8'),name)));
  const paths = documents.map(d=>d.metadata.canonical_path);
  if (new Set(paths).size !== paths.length) throw new Error('Duplicate canonical paths');
  for (const path of ['/support.html','/delete-account.html']) if (!paths.includes(path)) throw new Error(`Missing ${path}`);
  for (const kind of ['privacy','terms']) for (const language of ['en','hi']) if (!documents.some(d=>d.metadata.version?.startsWith(kind+'-v')&&d.metadata.language===language)) throw new Error(`Missing ${kind} ${language}`);
  const css = await readFile(resolve(root,'scripts/policy-page.css'),'utf8');
  const rendered = documents.map(doc=>({doc, html:renderPage(doc,documents,css)}));
  const output = resolve(root,'.policy-preview');
  // A fixed child directory only. Parse and render everything before replacing it.
  if (dirname(output) !== resolve(root) || output === resolve(root)) throw new Error('Unsafe preview output');
  await rm(output,{recursive:true,force:true});
  await mkdir(output,{recursive:true});
  const manifest = {status:'local-review-only', publicationAllowed:false, documents:[]};
  for (const {doc,html} of rendered) {
    const path = resolve(output,'.'+doc.metadata.canonical_path);
    await mkdir(dirname(path),{recursive:true});
    await writeFile(path,html,'utf8');
    manifest.documents.push({source:doc.filename,path:doc.metadata.canonical_path,version:doc.metadata.version||null,language:doc.metadata.language||'en-hi',effectiveDate:doc.metadata.effective_date||null,sourceSha256:doc.sourceSha256,previewHtmlSha256:digest(html)});
  }
  await writeFile(resolve(output,'preview-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  return manifest;
}
