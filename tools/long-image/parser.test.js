const test = require('node:test');
const assert = require('node:assert/strict');
const { parseArticle } = require('./parser');

test('extracts title and summary', () => {
  const md = `# 标题\n\n**摘要**：\n这是一段摘要。\n\n---\n\n正文`;
  const article = parseArticle(md);

  assert.equal(article.title, '标题');
  assert.equal(article.summary, '这是一段摘要。');
});

test('extracts toc and sections', () => {
  const md = `# 标题\n\n**本文目录**\n一、第一章\n二、第二章\n\n---\n\n## 第一章\n段落一\n\n> 引用\n\n- 列表1\n- 列表2\n\n## 第二章\n![图](./img.png)\n`;

  const article = parseArticle(md);

  assert.deepEqual(article.toc, ['第一章', '第二章']);
  assert.equal(article.sections.length, 2);
  assert.equal(article.sections[0].title, '第一章');
  assert.equal(article.sections[0].blocks[0].type, 'p');
  assert.equal(article.sections[0].blocks[1].type, 'blockquote');
  assert.equal(article.sections[0].blocks[2].type, 'list');
  assert.equal(article.sections[1].blocks[0].type, 'image');
});
