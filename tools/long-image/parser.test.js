const test = require('node:test');
const assert = require('node:assert/strict');
const { parseArticle } = require('./parser');

test('extracts title and summary', () => {
  const md = `# 标题\n\n**摘要**：\n这是一段摘要。\n\n---\n\n正文`;
  const article = parseArticle(md);

  assert.equal(article.title, '标题');
  assert.equal(article.summary, '这是一段摘要。');
});
