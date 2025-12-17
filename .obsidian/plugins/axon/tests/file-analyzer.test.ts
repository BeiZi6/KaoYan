/**
 * Axon Sensation - FileAnalyzer Property Tests
 * 使用 fast-check 进行属性测试
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// 由于 FileAnalyzer 依赖 Obsidian API，我们测试其纯函数部分
// 创建独立的测试函数

/**
 * 提取标题信息 (纯函数版本用于测试)
 */
function extractHeadings(content: string): { level: number; text: string; position: number }[] {
  const headings: { level: number; text: string; position: number }[] = [];
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    
    if (match) {
      headings.push({
        level: match[1].length,
        text: match[2].trim(),
        position: i + 1
      });
    }
  }
  
  return headings;
}

/**
 * 统计字数 (纯函数版本用于测试)
 */
function countWords(content: string): number {
  const contentWithoutFrontmatter = content.replace(/^---[\s\S]*?---\n?/, '');
  
  const cleanContent = contentWithoutFrontmatter
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]+`/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
    .replace(/\[\[([^\]|]+)(\|[^\]]+)?\]\]/g, '$1')
    .replace(/[#*_~>`]/g, '')
    .replace(/\n+/g, ' ')
    .trim();
  
  if (!cleanContent) return 0;
  
  const words = cleanContent.split(/\s+/).filter(word => word.length > 0);
  return words.length;
}

/**
 * 提取链接 (纯函数版本用于测试)
 */
function extractLinks(content: string): { internal: string[]; external: string[]; internalCount: number; externalCount: number } {
  const internal: string[] = [];
  const external: string[] = [];
  
  const wikiLinkRegex = /\[\[([^\]|]+)(\|[^\]]+)?\]\]/g;
  let match;
  while ((match = wikiLinkRegex.exec(content)) !== null) {
    internal.push(match[1]);
  }
  
  const urlRegex = /https?:\/\/[^\s\)>\]]+/g;
  while ((match = urlRegex.exec(content)) !== null) {
    external.push(match[0]);
  }
  
  return {
    internal,
    external,
    internalCount: internal.length,
    externalCount: external.length
  };
}

describe('FileAnalyzer', () => {
  /**
   * **Feature: axon-sensation, Property 2: Heading Extraction Accuracy**
   * *For any* Markdown content containing headings (H1-H6), the extracted headings 
   * array should contain exactly the headings present in the content.
   * **Validates: Requirements 2.1**
   */
  describe('Property 2: Heading Extraction Accuracy', () => {
    it('should extract all headings with correct levels', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              level: fc.integer({ min: 1, max: 6 }),
              text: fc.string({ minLength: 1, maxLength: 50 }).filter(s => !s.includes('\n') && s.trim().length > 0)
            }),
            { minLength: 0, maxLength: 10 }
          ),
          (headingSpecs) => {
            // 生成 markdown 内容
            const content = headingSpecs
              .map(h => '#'.repeat(h.level) + ' ' + h.text)
              .join('\n');
            
            const extracted = extractHeadings(content);
            
            // 验证提取的标题数量正确
            expect(extracted.length).toBe(headingSpecs.length);
            
            // 验证每个标题的级别和文本
            for (let i = 0; i < headingSpecs.length; i++) {
              expect(extracted[i].level).toBe(headingSpecs[i].level);
              expect(extracted[i].text).toBe(headingSpecs[i].text.trim());
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle empty content', () => {
      const result = extractHeadings('');
      expect(result).toEqual([]);
    });

    it('should not extract invalid headings', () => {
      const content = '#no space\n##also no space\nregular text';
      const result = extractHeadings(content);
      expect(result).toEqual([]);
    });
  });


  /**
   * **Feature: axon-sensation, Property 3: Word Count Consistency**
   * *For any* text content, the word count function should return a consistent count.
   * **Validates: Requirements 2.2**
   */
  describe('Property 3: Word Count Consistency', () => {
    it('should count words consistently', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 20 }).filter(s => /\S/.test(s)), { minLength: 0, maxLength: 50 }),
          (words) => {
            const content = words.join(' ');
            const count = countWords(content);
            
            // 字数应该是非负数
            expect(count).toBeGreaterThanOrEqual(0);
            
            // 对于非空内容，字数应该大于0
            if (words.length > 0 && words.some(w => w.trim().length > 0)) {
              expect(count).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return 0 for empty content', () => {
      expect(countWords('')).toBe(0);
      expect(countWords('   ')).toBe(0);
      expect(countWords('\n\n\n')).toBe(0);
    });

    it('should exclude frontmatter from count', () => {
      const contentWithFrontmatter = '---\ntitle: Test\n---\nHello world';
      const contentWithoutFrontmatter = 'Hello world';
      
      expect(countWords(contentWithFrontmatter)).toBe(countWords(contentWithoutFrontmatter));
    });
  });

  /**
   * **Feature: axon-sensation, Property 4: Link Extraction Completeness**
   * *For any* Markdown content, the link extraction should identify all wiki-style 
   * and external links.
   * **Validates: Requirements 2.3, 2.4**
   */
  describe('Property 4: Link Extraction Completeness', () => {
    it('should extract all wiki links', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.string({ minLength: 1, maxLength: 30 }).filter(s => !s.includes('[') && !s.includes(']') && !s.includes('|') && s.trim().length > 0),
            { minLength: 0, maxLength: 10 }
          ),
          (linkNames) => {
            const content = linkNames.map(name => `[[${name}]]`).join(' ');
            const result = extractLinks(content);
            
            expect(result.internalCount).toBe(linkNames.length);
            expect(result.internal.length).toBe(linkNames.length);
            
            linkNames.forEach(name => {
              expect(result.internal).toContain(name);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should extract external URLs', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              protocol: fc.constantFrom('http', 'https'),
              domain: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-z0-9]+$/.test(s))
            }),
            { minLength: 0, maxLength: 5 }
          ),
          (urlSpecs) => {
            const urls = urlSpecs.map(u => `${u.protocol}://${u.domain}.com`);
            const content = urls.join(' ');
            const result = extractLinks(content);
            
            expect(result.externalCount).toBe(urls.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle mixed content', () => {
      const content = '[[internal link]] and https://example.com and [[another]]';
      const result = extractLinks(content);
      
      expect(result.internalCount).toBe(2);
      expect(result.externalCount).toBe(1);
    });
  });

  /**
   * **Feature: axon-sensation, Property 5: Frontmatter Parsing Round-Trip**
   * *For any* valid YAML frontmatter block, parsing should preserve key-value pairs.
   * **Validates: Requirements 2.5, 5.2**
   */
  describe('Property 5: Frontmatter Parsing', () => {
    // 注意：完整的 frontmatter 解析依赖 Obsidian MetadataCache
    // 这里测试 frontmatter 检测逻辑
    
    it('should detect frontmatter presence', () => {
      const hasFrontmatter = (content: string): boolean => {
        return /^---\n[\s\S]*?\n---/.test(content);
      };
      
      fc.assert(
        fc.property(
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 30 }).filter(s => !s.includes('\n')),
            date: fc.date().map(d => d.toISOString().split('T')[0])
          }),
          (fm) => {
            const content = `---\ntitle: ${fm.title}\ndate: ${fm.date}\n---\nContent here`;
            expect(hasFrontmatter(content)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not detect frontmatter in regular content', () => {
      const hasFrontmatter = (content: string): boolean => {
        return /^---\n[\s\S]*?\n---/.test(content);
      };
      
      expect(hasFrontmatter('Regular content without frontmatter')).toBe(false);
      expect(hasFrontmatter('--- not at start')).toBe(false);
    });
  });
});
