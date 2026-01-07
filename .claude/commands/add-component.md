# Add Component: $ARGUMENTS

Create a new React component following KOPRO conventions.

## Phase 1: Analysis (Parallel)

### Agent 1: Similar Components
- Search for similar existing components
- Review component patterns used
- Check UI library components available

### Agent 2: Requirements
- Understand component purpose
- List required props
- Identify state needs
- Plan accessibility features

## Phase 2: Implementation

### Component Structure
```typescript
// For client components
'use client'

import { cn } from '@/lib/utils'

interface ComponentNameProps {
  // Props with TypeScript types
  className?: string
}

export function ComponentName({ className, ...props }: ComponentNameProps) {
  return (
    <div className={cn('base-classes', className)}>
      {/* Content */}
    </div>
  )
}
```

### Checklist
1. [ ] Determine if client or server component
2. [ ] Define TypeScript interface for props
3. [ ] Use cn() for className merging
4. [ ] Add proper accessibility attributes
5. [ ] Handle loading/error states if needed
6. [ ] Export from appropriate index

### Component Types

#### UI Components (`src/components/ui/`)
- Reusable, generic components
- No business logic
- Highly customizable via props

#### Feature Components (`src/components/[feature]/`)
- Business logic included
- Specific to a feature
- May use UI components

#### Layout Components (`src/components/layout/`)
- Page structure components
- Navigation, headers, footers

## Output

Provide:
- Component file path
- Props interface
- Usage example
- Any dependencies added
