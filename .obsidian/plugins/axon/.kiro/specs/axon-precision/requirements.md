# Requirements Document

## Introduction

本文档定义了 Axon 插件第四阶段"手术刀般的精准度"功能的需求。该阶段的目标是让 Axon 具备选区感知能力，能够根据用户是否选中文本来动态改变行为，实现精准的文本重构和润色功能。

## Glossary

- **Axon**: Obsidian 侧边栏 AI Agent 插件
- **Selection**: 编辑器中用户选中的文本区域
- **Selection_Awareness**: 选区感知能力，检测并响应用户的文本选择
- **Replace_Selection**: 用 AI 回复替换编辑器中选中的文本
- **Context_Mode**: 上下文模式，分为选区模式和全文模式
- **Smart_Context**: 智能上下文，根据选区状态动态调整发送给 AI 的内容

## Requirements

### Requirement 1

**User Story:** As a user, I want Axon to detect when I have selected text in the editor, so that it can focus on just that portion of my note.

#### Acceptance Criteria

1. WHEN the user has text selected in the active Markdown editor THEN the Axon_System SHALL detect the selection and enter Selection Mode
2. WHEN no text is selected (cursor only) THEN the Axon_System SHALL remain in Full Note Mode
3. WHEN in Selection Mode THEN the Axon_System SHALL display a "🔍 Focused on Selection" indicator above the input
4. WHEN in Full Note Mode THEN the Axon_System SHALL display a "📄 Full Note Context" indicator above the input
5. WHEN the selection changes THEN the Axon_System SHALL update the context mode indicator in real-time

### Requirement 2

**User Story:** As a user, I want Axon to use only my selected text as context when I have a selection, so that AI responses are focused on that specific content.

#### Acceptance Criteria

1. WHEN in Selection Mode THEN the Axon_System SHALL use only the selected text as context for the AI request
2. WHEN constructing the request in Selection Mode THEN the Axon_System SHALL format the context as "Selected Text:\n\n${selection}\n\nUser Instruction: ${userInput}"
3. WHEN in Full Note Mode THEN the Axon_System SHALL continue using the full note content as context
4. WHEN the selection is empty but Selection Mode was detected THEN the Axon_System SHALL fall back to Full Note Mode

### Requirement 3

**User Story:** As a user, I want a "Replace Selection" button on AI responses when I had text selected, so that I can easily replace my selected text with the AI's suggestion.

#### Acceptance Criteria

1. WHEN AI responds in Selection Mode THEN the Axon_System SHALL display a "🔄 Replace Selection" button prominently
2. WHEN AI responds in Selection Mode THEN the Axon_System SHALL also display the "📥 Append" button as a secondary option
3. WHEN AI responds in Full Note Mode THEN the Axon_System SHALL display only "📥 Append" and "📄 Save Note" buttons
4. WHEN the user clicks "Replace Selection" THEN the Axon_System SHALL replace the selected text in the editor with the AI response

### Requirement 4

**User Story:** As a user, I want the replace operation to be safe, so that I don't accidentally lose content if my selection changed.

#### Acceptance Criteria

1. WHEN the user clicks "Replace Selection" and the original selection is no longer valid THEN the Axon_System SHALL display an error message "选区已丢失，无法替换"
2. WHEN the user clicks "Replace Selection" and no editor is active THEN the Axon_System SHALL display an error message "请先打开一个笔记文件"
3. WHEN the replace operation succeeds THEN the Axon_System SHALL display a success notification "✅ 已替换选中内容"
4. THE Axon_System SHALL store the original selection text to verify it hasn't changed before replacing

### Requirement 5

**User Story:** As a user, I want the context indicator to update automatically, so that I always know what context Axon will use.

#### Acceptance Criteria

1. WHEN the user switches between files THEN the Axon_System SHALL update the context indicator
2. WHEN the user changes their selection THEN the Axon_System SHALL update the context indicator within 200 milliseconds
3. WHEN no file is open THEN the Axon_System SHALL display "⚠️ No file open" indicator
