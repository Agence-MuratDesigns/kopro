# Fix Bug: $ARGUMENTS

Systematically diagnose and fix the reported bug using parallel investigation agents.

## Phase 1: Investigation (Parallel)

### Agent 1: Error Analysis
- Search for error messages in logs
- Find stack traces
- Identify the failing component/route
- Check browser console errors (if frontend)

### Agent 2: Code Trace
- Locate the affected code path
- Trace the data flow
- Find related functions and dependencies
- Check recent changes to affected files (`git log`)

### Agent 3: Reproduction
- Understand the reproduction steps
- Identify the conditions that trigger the bug
- Check if it's environment-specific
- Verify with test data

### Agent 4: Similar Issues
- Search for similar bugs in codebase comments
- Look for related TODO/FIXME comments
- Check if pattern exists elsewhere

## Phase 2: Root Cause Analysis

Based on investigation:
1. Identify the exact root cause
2. Explain why the bug occurs
3. List all affected areas
4. Propose fix strategies

## Phase 3: Implementation

1. Write the fix
2. Ensure no regressions
3. Add defensive coding where needed
4. Update types if necessary

## Phase 4: Verification (Parallel)

### Test Agent
- Verify the fix resolves the issue
- Run related tests
- Check edge cases

### Regression Agent
- Ensure no new bugs introduced
- Check related functionality still works

## Output

Provide:
- Root cause explanation
- Files modified
- Fix description
- Testing performed
- Any follow-up recommendations
