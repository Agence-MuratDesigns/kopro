# Code Review: $ARGUMENTS

Perform a comprehensive code review of the specified files or recent changes. Use parallel agents for efficiency.

## Scope

If no specific files provided, review the most recent changes using `git diff`.

## Parallel Review Agents

Launch all these agents simultaneously:

### Agent 1: Code Quality
Review for:
- TypeScript best practices
- Consistent naming conventions
- Code duplication
- Function complexity
- Proper error handling
- Dead code

### Agent 2: Security
Check for:
- SQL injection vulnerabilities
- XSS vulnerabilities
- Authentication bypasses
- Sensitive data exposure
- Insecure dependencies
- Proper authorization checks

### Agent 3: Performance
Analyze:
- Database query efficiency
- Unnecessary re-renders (React)
- Bundle size impact
- Memory leaks
- N+1 query problems
- Missing indexes

### Agent 4: Architecture
Verify:
- Adherence to project patterns
- Proper separation of concerns
- API design consistency
- Component structure
- Type definitions

### Agent 5: Accessibility (if UI changes)
Check:
- ARIA attributes
- Keyboard navigation
- Color contrast
- Screen reader compatibility
- Focus management

## Output Format

Provide a structured review with:

### Summary
- Overall assessment (Approved / Changes Requested / Needs Discussion)
- Key findings count by severity

### Critical Issues
Issues that must be fixed before merge.

### Warnings
Issues that should be addressed but aren't blockers.

### Suggestions
Improvements that would be nice to have.

### Positive Feedback
Good patterns or improvements noticed.
