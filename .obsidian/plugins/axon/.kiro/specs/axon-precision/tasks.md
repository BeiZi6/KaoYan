# Implementation Plan

- [x] 1. Create SelectionContext module
  - [x] 1.1 Define SelectionState interface in types.ts
    - Add mode, selectedText, originalSelection fields
    - Add contextMode to ConversationData
    - _Requirements: 1.1, 1.2_
  - [x] 1.2 Create SelectionContext class
    - Implement mode detection logic
    - Implement getContextForAI method
    - Implement hasValidSelection method
    - _Requirements: 1.1, 1.2, 2.1_
  - [x] 1.3 Write property test for mode detection
    - **Property 1: Mode Detection**
    - **Validates: Requirements 1.1, 1.2**

- [x] 2. Implement context formatting for Selection Mode
  - [x] 2.1 Update DeepSeekService to accept context mode
    - Add buildSelectionMessage method
    - Format: "Selected Text:\n\n${selection}\n\nUser Instruction: ${userInput}"
    - _Requirements: 2.1, 2.2_
  - [x] 2.2 Write property test for selection context format
    - **Property 3: Selection Context Format**
    - **Validates: Requirements 2.1, 2.2**

- [x] 3. Create ContextIndicator UI component
  - [x] 3.1 Create ContextIndicator class
    - Display mode-specific text and icon
    - Support real-time updates
    - _Requirements: 1.3, 1.4, 5.3_
  - [x] 3.2 Integrate ContextIndicator into InputPanel
    - Add indicator above textarea
    - Wire up to selection state
    - _Requirements: 1.3, 1.4_
  - [x] 3.3 Write property test for indicator rendering
    - **Property 2: Context Indicator Rendering**
    - **Validates: Requirements 1.3, 1.4, 5.3**

- [x] 4. Extend FileOperations with replace functionality
  - [x] 4.1 Add getCurrentSelection method
    - Get selection from active MarkdownView editor
    - Return null if no selection
    - _Requirements: 1.1_
  - [x] 4.2 Add replaceSelection method
    - Validate original selection matches current
    - Use editor.replaceSelection API
    - Show success/error notifications
    - _Requirements: 3.4, 4.1, 4.3_
  - [x] 4.3 Write property test for selection validation
    - **Property 5: Selection Validation for Replace**
    - **Validates: Requirements 4.1, 4.4**

- [x] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Update ActionableCard for dynamic buttons
  - [x] 6.1 Add contextMode prop to ActionableCard
    - Accept 'selection' or 'fullNote' mode
    - Store originalSelection for validation
    - _Requirements: 3.1, 3.2, 3.3_
  - [x] 6.2 Implement conditional button rendering
    - Selection Mode: Replace + Append buttons
    - Full Note Mode: Append + Save Note buttons
    - _Requirements: 3.1, 3.2, 3.3_
  - [x] 6.3 Add Replace Selection button handler
    - Call FileOperations.replaceSelection
    - Handle errors gracefully
    - _Requirements: 3.4, 4.1_
  - [x] 6.4 Write property test for button rendering
    - **Property 4: Button Rendering Based on Mode**
    - **Validates: Requirements 3.1, 3.2, 3.3**

- [x] 7. Integrate selection awareness into AxonView
  - [x] 7.1 Add SelectionContext to AxonView
    - Initialize in constructor
    - Set up selection change listener
    - _Requirements: 1.1, 1.5_
  - [x] 7.2 Update message handler for selection mode
    - Check selection state before sending
    - Pass contextMode to ActionableCard
    - Store originalSelection in conversation data
    - _Requirements: 2.1, 2.2, 4.4_
  - [x] 7.3 Wire up ContextIndicator updates
    - Update on selection change
    - Update on file change
    - _Requirements: 1.5, 5.1, 5.2_

- [x] 8. Update styles for new components
  - Add CSS for ContextIndicator
  - Add CSS for Replace Selection button (prominent style)
  - Add CSS for selection mode visual feedback
  - _Requirements: 1.3, 1.4, 3.1_

- [x] 9. Update manifest version
  - Update version to 1.2.0
  - _Requirements: N/A_

- [x] 10. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
