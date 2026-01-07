# Implement New Feature: $ARGUMENTS

You are implementing a new feature for the KOPRO application. Follow this structured approach using parallel sub-agents.

## Phase 1: Analysis (Parallel)

Launch these agents in parallel:

### Agent 1: Codebase Analysis
Analyze the existing codebase to understand:
- Current architecture and patterns used
- Similar features already implemented
- Database schema relevant to this feature
- API route conventions
- Component structure

### Agent 2: Specification Review
Read CLAUDE.md and find:
- Specifications related to this feature
- Required API endpoints
- Data models needed
- UI/UX requirements
- Validation rules

### Agent 3: Dependency Check
Check for:
- Required npm packages
- Existing utilities that can be reused
- Types and interfaces to extend
- Shared components available

## Phase 2: Planning

Based on analysis results, create a detailed implementation plan:
1. Database changes (if any)
2. API routes to create/modify
3. Components to build
4. Types to define
5. Tests to write

## Phase 3: Implementation (Sequential)

Execute the plan step by step:
1. Update Prisma schema if needed
2. Create/update types
3. Implement API routes
4. Build UI components
5. Connect everything
6. Test the feature

## Phase 4: Review (Parallel)

Launch review agents in parallel:

### Code Quality Agent
- Check TypeScript types
- Verify error handling
- Ensure consistent patterns

### Security Agent
- Check for vulnerabilities
- Verify authentication/authorization
- Validate input sanitization

## Output

Provide a summary of:
- Files created/modified
- How to test the feature
- Any TODOs or follow-up items
