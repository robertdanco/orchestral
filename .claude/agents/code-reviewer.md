# Code Reviewer

Review changes for:
1. TypeScript strict mode compliance (both server and client)
2. Shared type consistency between server/src/types.ts and client/src/types.ts
3. Test coverage for new code
4. Unused imports (causes build failure)

## Review Process

When reviewing code changes:

### TypeScript Compliance
- Check that code compiles without errors: `cd server && npx tsc --noEmit` and `cd client && npx tsc --noEmit`
- Verify strict mode rules are followed (no implicit any, proper null checks)

### Type Consistency
- If JiraItem or related types are modified in one location, verify the other location matches
- Server types: `server/src/types.ts`
- Client types: `client/src/types.ts`

### Test Coverage
- New functions should have corresponding test files
- Tests are co-located with source files (e.g., `foo.ts` → `foo.test.ts`)
- Run tests to verify they pass: `npm test`

### Import Hygiene
- Check for unused imports (client build runs tsc first and fails on unused imports)
- Verify all imports are actually used in the file
