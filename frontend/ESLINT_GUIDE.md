# Production-Level ESLint Configuration Guide

## Overview

This project uses a production-level ESLint configuration that balances code quality with development productivity. The configuration converts strict errors to warnings and provides clear guidance on how to handle unused variables.

## Key Features

### 1. **Smart Unused Variable Handling**
- **Pattern**: Variables prefixed with `_` are ignored
- **Examples**:
  ```typescript
  // ✅ Good - Intentionally unused
  const [_unused, used] = someArray;
  const { _temp, important } = someObject;
  
  // ❌ Bad - Will show warning
  const [unused, used] = someArray;
  ```

### 2. **Environment-Specific Rules**
- **Development**: More lenient, warnings only
- **Production**: Stricter, treats warnings as errors in CI/CD

### 3. **File-Type Specific Rules**
- **Components**: Standard unused var rules
- **Test Files**: Disabled unused var checking
- **API Routes**: More lenient with `any` types

## Configuration Files

### ESLint Config (`eslint.config.mjs`)
```javascript
{
  rules: {
    "@typescript-eslint/no-unused-vars": [
      "warn", // Warning instead of error
      {
        "argsIgnorePattern": "^_",      // Ignore args starting with _
        "varsIgnorePattern": "^_",      // Ignore vars starting with _
        "caughtErrorsIgnorePattern": "^_", // Ignore catch errors starting with _
        "destructuredArrayIgnorePattern": "^_", // Ignore destructured elements starting with _
        "ignoreRestSiblings": true,    // Ignore rest siblings in destructuring ex:-const { _name=SiddikVadla, age, ...rest } = user;
        "args": "after-used",          // Only check args after the last used one ex:- function handleClick(event, index) //Without this: ❌ “index is defined but never used.”


        "vars": "all",                 // ✅ This ensures you don’t leave dead or useless variables anywhere.
        "caughtErrors": "all"          // catch(err){}❌ It’ll warn you — “err is declared but not used.”
      }
    ]
  }
}
```

### TypeScript Config (`tsconfig.json`)
```json
{
  "compilerOptions": {
    "noUnusedLocals": false,      // You might prefer ESLint to handle unused variables (since it gives better autofix options and can ignore patterns like _var).Disabling it in TypeScript avoids duplicate warnings (TypeScript + ESLint both complaining).
    "noUnusedParameters": false,   // Let ESLint handle this
    "exactOptionalPropertyTypes": false // if it is true -> const u2: User = { name: undefined }; // ❌ error (because treats `undefined` ≠ “missing”)

  }
}
```


## Available Scripts

### Development
```bash
npm run lint:dev          # Development linting (warnings only)
npm run lint:fix          # Auto-fix linting issues
npm run fix-unused        # Auto-fix unused variables with _ prefix
npm run lint:fix-all      # Fix unused vars + auto-fix linting
```

### Production
```bash
npm run lint:prod         # Production linting (stricter)
npm run lint:check        # Zero warnings allowed (CI/CD)
```

## Common Patterns

### 1. **Unused Imports**
```typescript
// Before (warning)
import { useState, useEffect } from 'react';

// After (no warning)
import { useState, _useEffect } from 'react';
// or remove if truly unused
import { useState } from 'react';
```

### 2. **Unused Function Parameters**
```typescript
// Before (warning)
function handleClick(event) {
  // event not used
}

// After (no warning)
function handleClick(_event) {
  // _event indicates intentionally unused
}
```

### 3. **Unused Destructured Variables**
```typescript
// Before (warning)
const { name, age, email } = user;
// Only using name and age

// After (no warning)
const { name, age, _email } = user;
```

### 4. **Unused Catch Errors**
```typescript
// Before (warning)
try {
  // some code
} catch (error) {
  // error not used
}

// After (no warning)
try {
  // some code
} catch (_error) {
  // _error indicates intentionally unused
}
```

### 5. **Unused Array Destructuring**
```typescript
// Before (warning)
const [first, second, third] = array;
// Only using first and second

// After (no warning)
const [first, second, _third] = array;
```

## Best Practices

### 1. **When to Use `_` Prefix**
- ✅ Variables that are required by API but not used
- ✅ Destructured values you don't need
- ✅ Function parameters required by interface
- ✅ Catch errors you don't need to handle

### 2. **When NOT to Use `_` Prefix**
- ❌ Variables you might use later (remove them instead)
- ❌ Imports you plan to use (remove unused imports)
- ❌ Variables that should be used (fix the logic instead)

### 3. **Code Review Guidelines**
- Focus on logic errors, not unused variable warnings
- Ensure `_` prefixed variables are truly intentional
- Verify that removing unused code doesn't break functionality

## IDE Integration

### VS Code Settings
Add to `.vscode/settings.json`:
```json
{
  "eslint.validate": ["javascript", "typescript", "javascriptreact", "typescriptreact"],
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.workingDirectories": ["frontend"]
}
```

### Auto-fix on Save
The configuration supports auto-fixing on save. Enable it in your IDE settings.

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Lint Code
  run: |
    cd frontend
    npm run lint:check  # Fails on any warnings
```

### Pre-commit Hooks
```bash
# Install husky
npm install --save-dev husky

# Add pre-commit hook
npx husky add .husky/pre-commit "cd frontend && npm run lint:check"
```

## Troubleshooting

### Common Issues

1. **"Variable is used but still shows warning"**
   - Check if the variable is used in a different scope
   - Verify the variable name matches exactly
   - Ensure the variable is not shadowed

2. **"Import is used but shows warning"**
   - Check if the import is used in JSX (React components)
   - Verify the import path is correct
   - Ensure the import is not re-exported

3. **"Configuration not working"**
   - Clear ESLint cache: `npx eslint --cache-location .eslintcache --clear-cache`
   - Restart your IDE
   - Check if multiple config files are conflicting

### Performance Tips

1. **Use `.eslintignore`** for large directories
2. **Enable caching** in CI/CD
3. **Run linting in parallel** for large codebases
4. **Use `--max-warnings 0`** only in production builds
5. for **Unsplash URLs** use "unoptimized" prop bcoz, unsplash have already optimized CDNs

## Migration Guide

### From Strict to Production-Level

1. **Update ESLint config** to use warnings instead of errors
2. **Add `_` prefixes** to intentionally unused variables
3. **Remove truly unused** imports and variables
4. **Update CI/CD** to use `lint:check` for zero warnings

### Gradual Migration

1. **Phase 1**: Convert errors to warnings
2. **Phase 2**: Fix obvious unused variables
3. **Phase 3**: Add `_` prefixes to intentional unused vars
4. **Phase 4**: Enable zero warnings in production

This configuration provides a balance between code quality and development productivity, making it suitable for production applications while maintaining developer experience.
