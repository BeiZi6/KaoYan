# Requirements Document

## Introduction

本文档定义了 Axon MCP (Model Context Protocol) 功能的需求规格。该功能将使 Axon 从"仅限当前活动文件"的模式升级为能够自主读写整个 Obsidian Vault 中任何文件的智能代理。通过实现工具使用 (Tool Use) 机制，DeepSeek AI 可以调用预定义的函数来执行文件操作，实现类似 Claude Code/Cursor 的自主代理能力。

## Glossary

- **Axon**: 集成在 Obsidian 中的 AI 助手插件
- **MCP (Model Context Protocol)**: 模型上下文协议，允许 AI 调用外部工具的通信标准
- **ToolManager**: 工具管理器，封装所有可供 AI 调用的 Obsidian API 操作
- **Tool Call**: AI 发起的工具调用请求，包含工具名称和参数
- **Tool Output**: 工具执行后返回的结果
- **Execution Loop**: 执行循环，解析 AI 响应并自动执行工具调用的处理流程
- **Agent Mode**: 代理模式，表示 AI 具有访问整个 Vault 的权限
- **Vault**: Obsidian 的文件库，包含用户所有笔记和文件
- **JSON Schema**: 用于定义工具参数结构的 JSON 格式规范
- **Tool Block**: AI 响应中被 \`\`\`json:tool 包裹的工具调用代码块

## Requirements

### Requirement 1

**User Story:** As a user, I want Axon to read any note in my Vault by path, so that I can ask questions about notes that are not currently open.

#### Acceptance Criteria

1. WHEN a user requests information from a specific note path THEN the ToolManager SHALL read the file content and return it to the AI context
2. WHEN the specified path does not include file extension THEN the ToolManager SHALL automatically append `.md` extension
3. WHEN the specified path contains ambiguous matches THEN the ToolManager SHALL attempt fuzzy matching and return the best match
4. IF the specified file does not exist THEN the ToolManager SHALL return an error message indicating the file was not found
5. WHEN reading a file succeeds THEN the ToolManager SHALL return the complete Markdown content as a string

### Requirement 2

**User Story:** As a user, I want Axon to create or update notes anywhere in my Vault, so that I can automate note creation through natural language commands.

#### Acceptance Criteria

1. WHEN a user instructs Axon to create a note THEN the ToolManager SHALL create a new file at the specified path with the provided content
2. WHEN the target file already exists and mode is "overwrite" THEN the ToolManager SHALL replace the entire file content
3. WHEN the target file already exists and mode is "append" THEN the ToolManager SHALL add the new content to the end of the file
4. WHEN the parent folder does not exist THEN the ToolManager SHALL create the necessary folder structure automatically
5. IF the file path is invalid THEN the ToolManager SHALL return an error message with details
6. WHEN file creation or modification succeeds THEN the ToolManager SHALL return a success confirmation message

### Requirement 3

**User Story:** As a user, I want Axon to list files in any folder, so that the AI can explore my Vault structure and find relevant notes.

#### Acceptance Criteria

1. WHEN a user asks about folder contents THEN the ToolManager SHALL return a list of file and folder names in the specified directory
2. WHEN listing the root folder THEN the ToolManager SHALL accept empty string or "/" as the path parameter
3. IF the specified folder does not exist THEN the ToolManager SHALL return an error message indicating the folder was not found
4. WHEN listing succeeds THEN the ToolManager SHALL return file names with their types (file or folder) indicated

### Requirement 4

**User Story:** As a user, I want the AI to use a structured JSON format for tool calls, so that tool invocations are reliable and parseable.

#### Acceptance Criteria

1. WHEN the AI needs to execute a tool THEN the AI SHALL output a code block wrapped with \`\`\`json:tool markers
2. WHEN outputting a tool call THEN the AI SHALL include "tool" field with the tool name and "params" field with parameters
3. WHEN the System Prompt is sent THEN the System Prompt SHALL include complete JSON Schema definitions for all available tools
4. WHEN the System Prompt is sent THEN the System Prompt SHALL include clear instructions on when and how to use tools
5. WHEN serializing tool call parameters THEN the ToolManager SHALL validate parameters against the defined JSON Schema

### Requirement 5

**User Story:** As a user, I want Axon to automatically execute tool calls and show results, so that I don't need to manually trigger file operations.

#### Acceptance Criteria

1. WHEN the AI response contains a json:tool block THEN the Execution Loop SHALL parse the JSON and extract tool name and parameters
2. WHEN a valid tool call is detected THEN the Execution Loop SHALL invoke the corresponding ToolManager function automatically
3. WHEN tool execution completes successfully THEN the UI SHALL display a Tool Output card with success message and result
4. IF tool execution fails THEN the UI SHALL display a Tool Output card with error details
5. WHEN multiple tool calls exist in one response THEN the Execution Loop SHALL execute them sequentially in order
6. WHEN tool execution completes THEN the Execution Loop SHALL feed the result back to the AI for continued conversation

### Requirement 6

**User Story:** As a user, I want visual feedback indicating Agent Mode is active, so that I know Axon has full Vault access.

#### Acceptance Criteria

1. WHEN the Axon view is opened THEN the UI SHALL display an "Agent Mode Active" indicator above the input panel
2. WHEN a tool is being executed THEN the UI SHALL show a loading state on the Tool Output card
3. WHEN displaying Tool Output THEN the UI SHALL use distinct styling (gray background, monospace font) to differentiate from regular messages

### Requirement 7

**User Story:** As a user, I want the tool system to handle edge cases gracefully, so that errors don't crash the plugin or corrupt my notes.

#### Acceptance Criteria

1. IF the AI returns malformed JSON in a tool block THEN the Execution Loop SHALL display a parse error and continue conversation
2. IF the AI calls an undefined tool THEN the Execution Loop SHALL return an error message to the AI context
3. WHEN tool parameters are missing required fields THEN the ToolManager SHALL return a validation error
4. WHEN file operations encounter permission errors THEN the ToolManager SHALL return a descriptive error message
5. WHEN the AI response contains both text and tool blocks THEN the Execution Loop SHALL display text first, then execute tools

