const test = require('node:test');
const assert = require('node:assert/strict');
const { renderHtml } = require('./renderer');

test('renders core layout', () => {
  const article = {
    title: '标题',
    summary: '摘要',
    toc: ['A', 'B'],
    sections: [
      { title: 'A', blocks: [{ type: 'p', text: '段落' }] },
    ],
  };

  const html = renderHtml(article, { coverImage: './cover.jpg' });

  assert.ok(html.includes('class="page"'));
  assert.ok(html.includes('class="cover"'));
  assert.ok(html.includes('class="summary"'));
  assert.ok(html.includes('class="toc"'));
  assert.ok(html.includes('标题'));
});
