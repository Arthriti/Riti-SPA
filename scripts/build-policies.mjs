import { resolve } from 'node:path';
import { buildPolicyPreview } from './policy-pages.mjs';

if (process.argv.length > 2) throw new Error('This command only creates a local policy preview; it does not publish.');
const manifest = await buildPolicyPreview(resolve(import.meta.dirname,'..'));
console.log(`Prepared ${manifest.documents.length} source-based pages in .policy-preview/. Production dist/ was not changed.`);
