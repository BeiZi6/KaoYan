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

module.exports = { parseArticle };
