# Track 4: Smart AI Categorization

## Phase 1: AI Logic
- [ ] Task: Categorization Service
    - [ ] Implement Feature: Add `categorizeTransaction` to `AnalysisService`
    - [ ] Write Tests: Ensure various merchants are categorized correctly (e.g., "Uber" -> "Transport")

## Phase 2: API Integration
- [ ] Task: Auto-categorize on Create
    - [ ] Implement Feature: Update `POST /api/transactions` to use the AI service if category is missing
    - [ ] Write Tests: Verify API behavior with and without provided categories
