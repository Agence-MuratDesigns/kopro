# Implement Step: $ARGUMENTS

Implement one of the 8 workflow steps for KOPRO. Refer to CLAUDE.md for specifications.

## Step Codes
- `CLIENT_CREATION` - Étape 1: Admin crée le compte client
- `MPR_IDENTIFIER` - Étape 2: Saisie identifiant MaPrimeRénov'
- `MANDATE_SIGNATURE` - Étape 3: Signature du mandat
- `WORK_SELECTION` - Étape 4: Sélection des travaux
- `QUOTE_DEPOSIT` - Étape 5: Dépôt du devis
- `WORK_AUTHORIZATION` - Étape 6: Autorisation début travaux
- `INVOICE_DEPOSIT` - Étape 7: Dépôt de la facture
- `FINAL_RECAP` - Étape 8: Récapitulatif et clôture

## Phase 1: Specification Review (Parallel)

### Agent 1: Read CLAUDE.md
- Find the detailed spec for this step
- List all requirements
- Identify actors (Client/Admin/Both)
- Note validation rules

### Agent 2: Analyze Existing Code
- Check if step page exists
- Find related components
- Check API routes
- Review database schema

### Agent 3: Check Dependencies
- Find step template in seed data
- Check step status handling
- Review notification triggers

## Phase 2: Implementation Plan

Create implementation checklist:
1. Page component for client view
2. Page component for admin view (if needed)
3. API route(s)
4. Form validation with Zod
5. Status transitions
6. Notifications

## Phase 3: Implementation

### Client-side (if applicable)
1. Create step page at `/dossier/[id]/etape/[code]`
2. Build form or display component
3. Handle submission
4. Show success/error feedback

### Admin-side (if applicable)
1. Create admin interface at `/admin/dossiers/[id]/...`
2. Build validation UI
3. Handle approval/rejection
4. Update step status

### API
1. Create route handlers
2. Validate inputs with Zod
3. Update database
4. Trigger notifications
5. Handle step transitions

## Phase 4: Testing

1. Test client flow
2. Test admin flow
3. Test validation
4. Test error cases
5. Test notifications

## Output

Provide:
- Files created/modified
- How to test this step
- Any edge cases to consider
- Integration with other steps
