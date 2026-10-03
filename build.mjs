import { readFileSync, writeFileSync } from 'node:fs';

const sources = [
  'exams/core.js',
  'exams/paper-1.js',
  'exams/paper-2.js',
  'exams/paper-3.js',
  'exams/paper-4.js',
  'app.js'
];

const bundle = sources.map(path => readFileSync(new URL(path, import.meta.url), 'utf8').trimEnd()).join('\n;\n');
writeFileSync(new URL('bundle.js', import.meta.url), bundle + '\n');
console.log(`Built bundle.js from ${sources.length} source files`);
