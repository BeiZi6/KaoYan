# 1080px 超长图落地页生成 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a local pipeline that converts `社论/1.31.md` into a 1080px-wide mobile long image (paper-textured editorial style) with a single command.

**Architecture:** A small Node-based tool parses the markdown into a structured article object, renders a single HTML file with inline CSS, and optionally screenshots it into a PNG via Puppeteer. Output is written to `output/`.

**Tech Stack:** Node.js (built-in test runner), plain JS, Puppeteer (screenshot), inline HTML/CSS.

---

### Task 1: Scaffold parser + title/summary extraction

**Files:**
- Create: `tools/long-image/parser.js`
- Create: `tools/long-image/parser.test.js`

**Step 1: Write the failing test**

```js
// tools/long-image/parser.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const { parseArticle } = require('./parser');

test('extracts title and summary', () => {
  const md = `# 标题\n\n**摘要**：\n这是一段摘要。\n\n---\n\n正文`;
  const article = parseArticle(md);

  assert.equal(article.title, '标题');
  assert.equal(article.summary, '这是一段摘要。');
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tools/long-image/parser.test.js`
Expected: FAIL with "parseArticle is not a function" or module not found.

**Step 3: Write minimal implementation**

```js
// tools/long-image/parser.js
function parseArticle(markdown) {
  const lines = markdown.split(/\r?\n/);
  let title = '';
  let summary = '';
  let inSummary = false;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();

    if (!title && line.startsWith('# ')) {
      title = line.replace(/^#\s+/, '').trim();
      continue;
    }

    if (line.startsWith('**摘要**')) {
      inSummary = true;
      continue;
    }

    if (inSummary) {
      if (!line || line === '---') {
        inSummary = false;
        continue;
      }
      summary = summary ? `${summary}\n${line}` : line;
    }
  }

  return { title, summary };
}

module.exports = { parseArticle };
```

**Step 4: Run test to verify it passes**

Run: `node --test tools/long-image/parser.test.js`
Expected: PASS (1 test).

**Step 5: Commit**

```bash
git add tools/long-image/parser.js tools/long-image/parser.test.js
git commit -m "feat: add markdown parser with title and summary"
```

---

### Task 2: Extend parser for toc + sections + blocks

**Files:**
- Modify: `tools/long-image/parser.js`
- Modify: `tools/long-image/parser.test.js`

**Step 1: Write the failing test**

```js
// tools/long-image/parser.test.js (append)

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
```

**Step 2: Run test to verify it fails**

Run: `node --test tools/long-image/parser.test.js`
Expected: FAIL (missing toc/sections).

**Step 3: Write minimal implementation**

```js
// tools/long-image/parser.js (extend)
function parseArticle(markdown) {
  const lines = markdown.split(/\r?\n/);
  let title = '';
  let summary = '';
  let inSummary = false;
  let inToc = false;
  const toc = [];
  const sections = [];
  let currentSection = null;
  let paragraphBuffer = [];

  const flushParagraph = () => {
    if (paragraphBuffer.length && currentSection) {
      currentSection.blocks.push({ type: 'p', text: paragraphBuffer.join(' ') });
      paragraphBuffer = [];
    }
  };

  for (let i = 0; i < lines.length; i += 1) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (!title && line.startsWith('# ')) {
      title = line.replace(/^#\s+/, '').trim();
      continue;
    }

    if (line.startsWith('**摘要**')) {
      inSummary = true;
      continue;
    }

    if (line.includes('本文目录')) {
      inToc = true;
      continue;
    }

    if (inSummary) {
      if (!line || line === '---') {
        inSummary = false;
        continue;
      }
      summary = summary ? `${summary}\n${line}` : line;
      continue;
    }

    if (inToc) {
      if (!line || line === '---') {
        inToc = false;
        continue;
      }
      const match = line.match(/^[一二三四五六七八九十]+、(.+)/);
      if (match) toc.push(match[1].trim());
      continue;
    }

    if (line.startsWith('## ')) {
      flushParagraph();
      if (currentSection) sections.push(currentSection);
      currentSection = { title: line.replace(/^##\s+/, '').trim(), blocks: [] };
      continue;
    }

    if (!currentSection) {
      continue;
    }

    if (!line) {
      flushParagraph();
      continue;
    }

    const imageMatch = line.match(/^!\[(.*?)\]\((.*?)\)/);
    if (imageMatch) {
      flushParagraph();
      currentSection.blocks.push({ type: 'image', alt: imageMatch[1], src: imageMatch[2] });
      continue;
    }

    if (line.startsWith('> ')) {
      flushParagraph();
      currentSection.blocks.push({ type: 'blockquote', text: line.replace(/^>\s+/, '').trim() });
      continue;
    }

    if (line.startsWith('- ')) {
      flushParagraph();
      const items = [line.replace(/^-\s+/, '').trim()];
      while (i + 1 < lines.length && lines[i + 1].trim().startsWith('- ')) {
        i += 1;
        items.push(lines[i].trim().replace(/^-\s+/, '').trim());
      }
      currentSection.blocks.push({ type: 'list', items });
      continue;
    }

    paragraphBuffer.push(line);
  }

  flushParagraph();
  if (currentSection) sections.push(currentSection);

  return { title, summary, toc, sections };
}
```

**Step 4: Run test to verify it passes**

Run: `node --test tools/long-image/parser.test.js`
Expected: PASS (2 tests).

**Step 5: Commit**

```bash
git add tools/long-image/parser.js tools/long-image/parser.test.js
git commit -m "feat: parse toc, sections, and content blocks"
```

---

### Task 3: Add HTML renderer with theme + structure

**Files:**
- Create: `tools/long-image/renderer.js`
- Create: `tools/long-image/renderer.test.js`

**Step 1: Write the failing test**

```js
// tools/long-image/renderer.test.js
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
```

**Step 2: Run test to verify it fails**

Run: `node --test tools/long-image/renderer.test.js`
Expected: FAIL (module not found).

**Step 3: Write minimal implementation**

```js
// tools/long-image/renderer.js
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
```

**Step 4: Run test to verify it passes**

Run: `node --test tools/long-image/renderer.test.js`
Expected: PASS (1 test).

**Step 5: Commit**

```bash
git add tools/long-image/renderer.js tools/long-image/renderer.test.js
git commit -m "feat: add HTML renderer and editorial theme"
```

---

### Task 4: Build CLI to output HTML and optional PNG

**Files:**
- Create: `tools/long-image/build-long-image.js`
- Create: `tools/long-image/package.json`
- Create: `tools/long-image/build-long-image.test.js`

**Step 1: Write the failing test**

```js
// tools/long-image/build-long-image.test.js
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
```

**Step 2: Run test to verify it fails**

Run: `node --test tools/long-image/build-long-image.test.js`
Expected: FAIL (module not found).

**Step 3: Write minimal implementation**

```js
// tools/long-image/build-long-image.js
const fs = require('node:fs');
const path = require('node:path');
const { parseArticle } = require('./parser');
const { renderHtml } = require('./renderer');

function writeHtmlOutput(article, outputDir, filename) {
  fs.mkdirSync(outputDir, { recursive: true });
  const html = renderHtml(article, { coverImage: article.coverImage });
  const outPath = path.join(outputDir, filename);
  fs.writeFileSync(outPath, html, 'utf8');
  return outPath;
}

async function renderPng(htmlPath, pngPath) {
  const puppeteer = require('puppeteer');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1800 });
  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
  await page.waitForTimeout(500);
  const height = await page.evaluate(() => document.body.scrollHeight);
  await page.setViewport({ width: 1080, height });
  await page.screenshot({ path: pngPath, fullPage: true });
  await browser.close();
}

if (require.main === module) {
  const mdPath = process.argv[2] || path.resolve('社论/1.31.md');
  const outputDir = path.resolve('output');
  const htmlName = '1.31.html';
  const pngName = '1.31-long.png';

  const markdown = fs.readFileSync(mdPath, 'utf8');
  const article = parseArticle(markdown);
  article.coverImage = path.resolve('社论/微信图片_20260131225357_463_46.jpg');

  const htmlPath = writeHtmlOutput(article, outputDir, htmlName);
  if (!process.argv.includes('--no-png')) {
    renderPng(htmlPath, path.join(outputDir, pngName)).catch((err) => {
      console.error(err);
      process.exit(1);
    });
  }
}

module.exports = { writeHtmlOutput };
```

```json
// tools/long-image/package.json
{
  "name": "long-image-tool",
  "private": true,
  "type": "commonjs",
  "dependencies": {
    "puppeteer": "^22.0.0"
  }
}
```

**Step 4: Run test to verify it passes**

Run: `node --test tools/long-image/build-long-image.test.js`
Expected: PASS (1 test).

**Step 5: Commit**

```bash
git add tools/long-image/build-long-image.js tools/long-image/build-long-image.test.js tools/long-image/package.json
git commit -m "feat: add CLI to write HTML and screenshot PNG"
```

---

### Task 5: Manual verification

**Step 1: Install dependencies**

Run: `cd tools/long-image && npm install`
Expected: Puppeteer installed.

**Step 2: Generate PNG**

Run: `node tools/long-image/build-long-image.js`
Expected: `output/1.31.html` and `output/1.31-long.png` created.

**Step 3: Visual check**

- Open `output/1.31-long.png` and confirm typography, spacing, and images render correctly.

**Step 4: Commit (optional, if any file changes are needed after review)**

```bash
git add tools/long-image
 git commit -m "chore: adjust long image layout after review"
```
