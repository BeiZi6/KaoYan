function escapeHtml(input) {
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderBlocks(blocks) {
  return blocks
    .map((block) => {
      if (block.type === 'p') {
        return `<p class="para">${escapeHtml(block.text)}</p>`;
      }
      if (block.type === 'blockquote') {
        return `<div class="quote">${escapeHtml(block.text)}</div>`;
      }
      if (block.type === 'list') {
        return `<ul class="list">${block.items
          .map((item) => `<li>${escapeHtml(item)}</li>`)
          .join('')}</ul>`;
      }
      if (block.type === 'image') {
        return `<figure class="figure"><img src="${block.src}" alt="${escapeHtml(
          block.alt
        )}" /></figure>`;
      }
      return '';
    })
    .join('\n');
}

function renderHtml(article, { coverImage }) {
  const css = `
:root {
  --bg: #f6f1e7;
  --ink: #2f2a25;
  --muted: #6a6157;
  --accent: #6b7d6b;
  --card: #f1e9dc;
  --line: #d8cdbf;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  background: var(--bg);
  color: var(--ink);
  font-family: "PingFang SC", "Noto Sans CJK SC", "Helvetica Neue", sans-serif;
}
.page {
  width: 1080px;
  margin: 0 auto;
  padding: 120px 160px 140px;
  position: relative;
  background: var(--bg);
}
.page::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image: radial-gradient(rgba(0,0,0,0.035) 1px, transparent 0);
  background-size: 6px 6px;
  opacity: 0.35;
  pointer-events: none;
}
.cover { margin-bottom: 80px; }
.cover img { width: 100%; border-radius: 18px; display: block; }
.title {
  font-family: "Songti SC", "Noto Serif CJK SC", serif;
  font-size: 56px;
  line-height: 1.35;
  margin: 30px 0 10px;
}
.subtitle {
  color: var(--muted);
  font-size: 20px;
  letter-spacing: 0.06em;
}
.summary, .toc, .closing {
  background: var(--card);
  border: 1px solid var(--line);
  padding: 28px 30px;
  border-radius: 16px;
  margin: 36px 0;
}
.section { margin: 60px 0; }
.section h2 {
  font-family: "Songti SC", "Noto Serif CJK SC", serif;
  font-size: 34px;
  margin-bottom: 16px;
}
.para { font-size: 24px; line-height: 1.9; margin: 18px 0; }
.quote {
  border-left: 4px solid var(--accent);
  padding: 14px 18px;
  background: rgba(107, 125, 107, 0.08);
  margin: 22px 0;
  font-size: 22px;
  color: var(--muted);
}
.list { margin: 18px 0 18px 20px; font-size: 24px; line-height: 1.8; }
.figure img { width: 80%; margin: 26px auto; display: block; border-radius: 14px; }
.tags { margin-top: 30px; color: var(--muted); font-size: 20px; }
`;

  const tocList = article.toc.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
  const sectionsHtml = article.sections
    .map(
      (section) => `
<section class="section">
  <h2>${escapeHtml(section.title)}</h2>
  ${renderBlocks(section.blocks)}
</section>`
    )
    .join('\n');

  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=1080" />
<title>${escapeHtml(article.title)}</title>
<style>${css}</style>
</head>
<body>
<main class="page">
  <section class="cover">
    <img src="${coverImage}" alt="cover" />
    <h1 class="title">${escapeHtml(article.title)}</h1>
    <div class="subtitle">社论 · 人文观察</div>
  </section>
  <section class="summary">
    <strong>摘要</strong>
    <p class="para">${escapeHtml(article.summary)}</p>
  </section>
  <section class="toc">
    <strong>本文目录</strong>
    <ol>${tocList}</ol>
  </section>
  ${sectionsHtml}
  <section class="closing">
    <strong>写在最后</strong>
    <p class="para">欢迎转发给正在思考这件事的朋友。</p>
  </section>
  <div class="tags">#社交观察 #智性恋 #短视频文化 #审美趋势 #观点文章</div>
</main>
</body>
</html>`;
}

module.exports = { renderHtml };
