# Add API Route: $ARGUMENTS

Create a new API route following KOPRO conventions.

## Phase 1: Analysis (Parallel)

### Agent 1: Existing Patterns
- Review existing API routes in `src/app/api/`
- Note authentication patterns
- Check error handling conventions
- Understand response formats

### Agent 2: Data Requirements
- Check Prisma schema
- Identify needed queries
- Plan data transformations
- Consider pagination if list endpoint

### Agent 3: Security Check
- Determine auth requirements
- Check role-based access
- Identify validation needs

## Phase 2: Implementation

### Route Structure
```typescript
// src/app/api/[path]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Request validation schema
const RequestSchema = z.object({
  // Define fields
})

export async function GET/POST/PUT/DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Auth check
    const user = await requireAuth()

    // 2. Validate input
    const body = await request.json()
    const data = RequestSchema.parse(body)

    // 3. Business logic

    // 4. Return response
    return NextResponse.json({ data })
  } catch (error) {
    // Error handling
  }
}
```

### Checklist
1. [ ] Create route file
2. [ ] Add Zod validation schema
3. [ ] Implement auth check
4. [ ] Add business logic
5. [ ] Handle errors properly
6. [ ] Return consistent response format

## Response Formats

### Success
```json
{ "data": {...} }
// or
{ "data": [...], "pagination": {...} }
```

### Error
```json
{ "error": "Error message" }
```

## Output

Provide:
- Route path and methods
- Request/response examples
- How to test the endpoint
