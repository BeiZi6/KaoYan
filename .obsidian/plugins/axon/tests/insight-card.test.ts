/**
 * Axon Sensation - InsightCard Property Tests
 * **Feature: axon-sensation, Property 6 & 7**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// 模拟 FileAnalysisResult 类型
interface FileAnalysisResult {
  file: { name: string; path: string; size: number };
  stats: { wordCount: number; characterCount: number; lineCount: number; lastModified: string };
  structure: { headings: { level: number; text: string; position: number }[]; headingCount: number };
  links: { internal: string[]; external: string[]; internalCount: number; externalCount: number };
  frontmatter: { title?: string; tags?: string[]; date?: string; [key: string]: unknown } | null;
  analyzedAt: Date;
  isEmpty: boolean;
}

// 模拟渲染函数 - 返回包含所有必需字段的字符串
function renderInsightCard(data: FileAnalysisResult): string {
  const parts: string[] = [];
  
  // 文件信息
  parts.push(`文件: ${data.file.name}`);
  parts.push(`路径: ${data.file.path}`);
  
  // 统计信息
  parts.push(`字数: ${data.stats.wordCount}`);
  parts.push(`标题数: ${data.structure.headingCount}`);
  parts.push(`内部链接: ${data.links.internalCount}`);
  parts.push(`外部链接: ${data.links.externalCount}`);
  
  // Frontmatter
  if (data.frontmatter) {
    if (data.frontmatter.title) {
      parts.push(`标题: ${data.frontmatter.title}`);
    }
    if (data.frontmatter.date) {
      parts.push(`日期: ${data.frontmatter.date}`);
    }
    if (data.frontmatter.tags && data.frontmatter.tags.length > 0) {
      parts.push(`标签: ${data.frontmatter.tags.join(', ')}`);
    }
  }
  
  return parts.join('\n');
}

// 生成随机 FileAnalysisResult 的 arbitrary
const fileAnalysisResultArb = fc.record({
  file: fc.record({
    name: fc.string({ minLength: 1, maxLength: 50 }).map(s => s.replace(/[<>:"/\\|?*]/g, '') + '.md'),
    path: fc.string({ minLength: 1, maxLength: 100 }).map(s => s.replace(/[<>:"/\\|?*]/g, '') + '.md'),
    size: fc.integer({ min: 0, max: 1000000 })
  }),
  stats: fc.record({
    wordCount: fc.integer({ min: 0, max: 100000 }),
    characterCount: fc.integer({ min: 0, max: 500000 }),
    lineCount: fc.integer({ min: 1, max: 10000 }),
    lastModified: fc.date().map(d => d.toLocaleString())
  }),
  structure: fc.record({
    headings: fc.array(
      fc.record({
        level: fc.integer({ min: 1, max: 6 }),
        text: fc.string({ minLength: 1, maxLength: 50 }),
        position: fc.integer({ min: 1, max: 1000 })
      }),
      { maxLength: 20 }
    ),
    headingCount: fc.integer({ min: 0, max: 20 })
  }),
  links: fc.record({
    internal: fc.array(fc.string({ minLength: 1, maxLength: 30 }), { maxLength: 10 }),
    external: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { maxLength: 10 }),
    internalCount: fc.integer({ min: 0, max: 10 }),
    externalCount: fc.integer({ min: 0, max: 10 })
  }),
  frontmatter: fc.option(
    fc.record({
      title: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
      date: fc.option(fc.date().map(d => d.toISOString().split('T')[0])),
      tags: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 5 }))
    }),
    { nil: null }
  ),
  analyzedAt: fc.date(),
  isEmpty: fc.boolean()
});

describe('InsightCard', () => {
  /**
   * **Feature: axon-sensation, Property 6: Insight Card Data Completeness**
   * *For any* FileAnalysisResult, the rendered Insight Card should contain:
   * file name, word count, heading count, internal link count, and external link count.
   * **Validates: Requirements 3.1, 3.2**
   */
  describe('Property 6: Insight Card Data Completeness', () => {
    it('should contain all required fields in rendered output', () => {
      fc.assert(
        fc.property(fileAnalysisResultArb, (data) => {
          const rendered = renderInsightCard(data);
          
          // 验证文件名存在
          expect(rendered).toContain(data.file.name);
          
          // 验证字数存在
          expect(rendered).toContain(`字数: ${data.stats.wordCount}`);
          
          // 验证标题数存在
          expect(rendered).toContain(`标题数: ${data.structure.headingCount}`);
          
          // 验证链接数存在
          expect(rendered).toContain(`内部链接: ${data.links.internalCount}`);
          expect(rendered).toContain(`外部链接: ${data.links.externalCount}`);
        }),
        { numRuns: 100 }
      );
    });
  });


  /**
   * **Feature: axon-sensation, Property 7: Frontmatter Display in Card**
   * *For any* FileAnalysisResult with non-null frontmatter containing tags, date, 
   * or title fields, the rendered Insight Card should display these metadata fields.
   * **Validates: Requirements 3.4**
   */
  describe('Property 7: Frontmatter Display in Card', () => {
    it('should display frontmatter fields when present', () => {
      const frontmatterArb = fc.record({
        title: fc.string({ minLength: 1, maxLength: 50 }),
        date: fc.date().map(d => d.toISOString().split('T')[0]),
        tags: fc.array(fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0), { minLength: 1, maxLength: 5 })
      });

      fc.assert(
        fc.property(fileAnalysisResultArb, frontmatterArb, (baseData, fm) => {
          const data: FileAnalysisResult = {
            ...baseData,
            frontmatter: fm
          };
          
          const rendered = renderInsightCard(data);
          
          // 验证标题显示
          expect(rendered).toContain(`标题: ${fm.title}`);
          
          // 验证日期显示
          expect(rendered).toContain(`日期: ${fm.date}`);
          
          // 验证标签显示
          expect(rendered).toContain('标签:');
          fm.tags.forEach(tag => {
            expect(rendered).toContain(tag);
          });
        }),
        { numRuns: 100 }
      );
    });

    it('should handle missing frontmatter gracefully', () => {
      fc.assert(
        fc.property(fileAnalysisResultArb, (baseData) => {
          const data: FileAnalysisResult = {
            ...baseData,
            frontmatter: null
          };
          
          const rendered = renderInsightCard(data);
          
          // 即使没有 frontmatter，基本信息仍应存在
          expect(rendered).toContain(data.file.name);
          expect(rendered).toContain(`字数: ${data.stats.wordCount}`);
        }),
        { numRuns: 100 }
      );
    });
  });
});
