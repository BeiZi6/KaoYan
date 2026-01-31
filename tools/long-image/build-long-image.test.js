const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { writeHtmlOutput } = require('./build-long-image');

const sampleArticle = {
  title: '标题',
  summary: '摘要',
  toc: [],
  sections: [],
};

test('writes HTML output', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'long-image-'));
  const outPath = writeHtmlOutput(sampleArticle, tempDir, 'test.html');
  assert.ok(fs.existsSync(outPath));
});
