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
