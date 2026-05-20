# Track 4: Smart AI Categorization

## Phase 1: AI Logic [checkpoint: 0b6bf5c]
- [x] Task: Categorization Service 0b6bf5c
    - [x] Implement Feature: Add `categorizeTransaction` to `AnalysisService` 0b6bf5c
    - [x] Write Tests: Ensure various merchants are categorized correctly (e.g., "Uber" -> "Transport") 0b6bf5c

## Phase 2: API Integration [checkpoint: 0b6bf5c]
- [x] Task: Auto-categorize on Create 0b6bf5c
    - [x] Implement Feature: Update `POST /api/transactions` to use the AI service if category is missing 0b6bf5c
    - [x] Write Tests: Verify API behavior with and without provided categories 0b6bf5c
