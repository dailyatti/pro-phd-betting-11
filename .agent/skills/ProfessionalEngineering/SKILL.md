---
name: Professional Engineering
description: Enforces professional software engineering standards including strict typing, modularity, and testing.
---

# Professional Engineering Standards

This skill enforces high-quality engineering practices for all code modifications. When this skill is active or relevant, adherence to these standards is mandatory.

## 1. Type Safety & Documentation
- **Strict JSDoc**: All functions must have complete JSDoc headers defining `@param` and `@returns`.
- **Custom Types**: Complex objects must be defined via `@typedef` in a dedicated `types.js` or at the top of the file.
- **No 'any'**: Avoid loose typing. Use specific shapes or unions.

## 2. Modularity & Architecture
- **Single Responsibility**: Functions should do one thing. If a function exceeds 50 lines, consider breaking it down.
- **Strategy Pattern**: For complex branching logic (like parsing different formats), use the Strategy or Factory pattern instead of long `if/else` chains.
- **Separation of Concerns**: Keep business logic (engine), data parsing (parsers), and I/O (components) separate.

## 3. Error Handling
- **No Silent Failures**: Never swallow errors. Catch them and either re-throw or return a structured error/warning object.
- **Validation**: Validate inputs at module boundaries.

## 4. Testing
- **Regression Testing**: Always run existing tests before and after changes.
- **New Tests**: correct bugs or features must be accompanied by a reproduction test case.

## 5. Code Style
- **Descriptive Naming**: Variables should describe their content (`homeTeamOdds` vs `h`).
- **Clean Imports**: Group imports logically.
