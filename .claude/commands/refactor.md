# Refactor: $ARGUMENTS

Perform a safe and systematic refactoring of the specified code area.

## Phase 1: Analysis (Parallel)

### Agent 1: Current State Analysis
- Map out the current implementation
- List all files involved
- Document current behavior
- Identify pain points

### Agent 2: Usage Analysis
- Find all usages of the code to refactor
- Identify dependencies
- Check imports and exports
- Map the impact radius

### Agent 3: Test Coverage
- Check existing test coverage
- Identify critical paths without tests
- Note any integration points

## Phase 2: Planning

Based on analysis:
1. Define the target state
2. List all changes needed
3. Identify risks
4. Plan rollback strategy
5. Decide on incremental vs big-bang approach

## Phase 3: Preparation

Before refactoring:
1. Ensure tests pass
2. Create snapshot of current behavior
3. Document current behavior if not tested

## Phase 4: Execution (Incremental)

Perform refactoring in small, reversible steps:
1. Make one change
2. Verify functionality preserved
3. Commit
4. Repeat

## Phase 5: Verification (Parallel)

### Test Agent
- Run all tests
- Verify no regressions
- Check type safety

### Diff Agent
- Review all changes made
- Ensure no unintended modifications
- Verify code quality improved

## Output

Provide:
- Summary of changes
- Files modified
- Improvements achieved
- Any follow-up refactoring suggested
- Performance impact (if measurable)
