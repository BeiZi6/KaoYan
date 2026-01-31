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
  const defaultChrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const executablePath =
    process.env.PUPPETEER_EXECUTABLE_PATH || (fs.existsSync(defaultChrome) ? defaultChrome : undefined);
  const browser = await puppeteer.launch({
    headless: 'new',
    ...(executablePath ? { executablePath } : {}),
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1800 });
  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
  await new Promise((resolve) => setTimeout(resolve, 500));
  const height = await page.evaluate(() => document.body.scrollHeight);
  await page.setViewport({ width: 1080, height });
  await page.screenshot({ path: pngPath, fullPage: true });
  await browser.close();
}

if (require.main === module) {
  const mdPath = path.resolve(process.argv[2] || '社论/1.31.md');
  const outputDir = path.resolve('output');
  const htmlName = '1.31.html';
  const pngName = '1.31-long.png';

  const markdown = fs.readFileSync(mdPath, 'utf8');
  const article = parseArticle(markdown);
  const coverImageName = '微信图片_20260131225357_463_46.jpg';
  const coverFromEnv = process.env.COVER_IMAGE;
  const coverFromMdDir = path.resolve(path.dirname(mdPath), coverImageName);
  article.coverImage = coverFromEnv || coverFromMdDir;

  const htmlPath = writeHtmlOutput(article, outputDir, htmlName);
  if (!process.argv.includes('--no-png')) {
    renderPng(htmlPath, path.join(outputDir, pngName)).catch((err) => {
      console.error(err);
      process.exit(1);
    });
  }
}

module.exports = { writeHtmlOutput };
