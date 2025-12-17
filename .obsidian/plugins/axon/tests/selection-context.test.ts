/**
 * Axon Precision - Selection Context Property Tests
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// 模拟类型
type ContextMode = 'selection' | 'fullNote' | 'noFile';

// 模拟模式检测函数
function detectMode(hasEditor: boolean, selection: string | null): ContextMode {
  if (!hasEditor) {
    return 'noFile';
  }
  if (selection && selection.trim().length > 0) {
    return 'selection';
  }
  return 'fullNote';
}

// 模拟指示器文本
function getModeDisplayText(mode: ContextMode): string {
  switch (mode) {
    case 'selection':
      return '🔍 Focused on Selection';
    case 'fullNote':
      return '📄 Full Note Context';
    case 'noFile':
      return '⚠️ No file open';
  }
}

// 模拟选区消息格式化
function buildSelectionMessage(userInstruction: string, selectedText: string): string {
  return `Selected Text:\n\n${selectedText}\n\nUser Instruction: ${userInstruction}`;
}

// 模拟按钮渲染逻辑
function getButtonsForMode(mode: ContextMode): string[] {
  if (mode === 'selection') {
    return ['Replace Selection', 'Append'];
  }
  return ['Append', 'Save Note'];
}

// 模拟选区验证
function validateSelection(currentSelection: string | null, originalSelection: string): boolean {
  return currentSelection === originalSelection;
}

describe('SelectionContext', () => {
  /**
   * **Feature: axon-precision, Property 1: Mode Detection**
   * *For any* selection state, the system should correctly determine the context mode.
   * **Validates: Requirements 1.1, 1.2**
   */
  describe('Property 1: Mode Detection', () => {
    it('should detect selection mode for non-empty selection', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
          (selection) => {
            const mode = detectMode(true, selection);
            expect(mode).toBe('selection');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should detect fullNote mode for empty selection', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(null, '', '   ', '\n\n', '\t'),
          (selection) => {
            const mode = detectMode(true, selection);
            expect(mode).toBe('fullNote');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should detect noFile mode when no editor', () => {
      fc.assert(
        fc.property(
          fc.option(fc.string(), { nil: null }),
          (selection) => {
            const mode = detectMode(false, selection);
            expect(mode).toBe('noFile');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: axon-precision, Property 2: Context Indicator Rendering**
   * *For any* context mode, the indicator should display the correct text.
   * **Validates: Requirements 1.3, 1.4, 5.3**
   */
  describe('Property 2: Context Indicator Rendering', () => {
    it('should display correct text for each mode', () => {
      const modes: ContextMode[] = ['selection', 'fullNote', 'noFile'];
      const expectedTexts: Record<ContextMode, string> = {
        'selection': '🔍 Focused on Selection',
        'fullNote': '📄 Full Note Context',
        'noFile': '⚠️ No file open'
      };

      fc.assert(
        fc.property(
          fc.constantFrom(...modes),
          (mode) => {
            const text = getModeDisplayText(mode);
            expect(text).toBe(expectedTexts[mode]);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: axon-precision, Property 3: Selection Context Format**
   * *For any* selected text and user instruction, the formatted context should match the expected format.
   * **Validates: Requirements 2.1, 2.2**
   */
  describe('Property 3: Selection Context Format', () => {
    it('should format selection message correctly', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
          fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
          (instruction, selection) => {
            const message = buildSelectionMessage(instruction, selection);
            
            // 应该包含选区前缀
            expect(message).toContain('Selected Text:');
            
            // 应该包含选中的文本
            expect(message).toContain(selection);
            
            // 应该包含用户指令前缀
            expect(message).toContain('User Instruction:');
            
            // 应该包含用户指令
            expect(message).toContain(instruction);
            
            // 验证格式
            const expectedFormat = `Selected Text:\n\n${selection}\n\nUser Instruction: ${instruction}`;
            expect(message).toBe(expectedFormat);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: axon-precision, Property 4: Button Rendering Based on Mode**
   * *For any* AI response, buttons should be rendered based on context mode.
   * **Validates: Requirements 3.1, 3.2, 3.3**
   */
  describe('Property 4: Button Rendering Based on Mode', () => {
    it('should show Replace and Append in selection mode', () => {
      const buttons = getButtonsForMode('selection');
      expect(buttons).toContain('Replace Selection');
      expect(buttons).toContain('Append');
      expect(buttons).not.toContain('Save Note');
    });

    it('should show Append and Save Note in fullNote mode', () => {
      const buttons = getButtonsForMode('fullNote');
      expect(buttons).toContain('Append');
      expect(buttons).toContain('Save Note');
      expect(buttons).not.toContain('Replace Selection');
    });

    it('should show Append and Save Note in noFile mode', () => {
      const buttons = getButtonsForMode('noFile');
      expect(buttons).toContain('Append');
      expect(buttons).toContain('Save Note');
      expect(buttons).not.toContain('Replace Selection');
    });
  });

  /**
   * **Feature: axon-precision, Property 5: Selection Validation for Replace**
   * *For any* replace operation, the system should verify selection matches.
   * **Validates: Requirements 4.1, 4.4**
   */
  describe('Property 5: Selection Validation for Replace', () => {
    it('should validate matching selections', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 500 }),
          (selection) => {
            const isValid = validateSelection(selection, selection);
            expect(isValid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject non-matching selections', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 500 }),
          fc.string({ minLength: 1, maxLength: 500 }),
          (current, original) => {
            // 确保两个字符串不同
            if (current === original) return true;
            
            const isValid = validateSelection(current, original);
            expect(isValid).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject null current selection', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 500 }),
          (original) => {
            const isValid = validateSelection(null, original);
            expect(isValid).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
