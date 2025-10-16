# 🧪 AURA-X Vitest Test Runner

## Quick Start

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run Tests with UI
```bash
npm run test:ui
```

## Test Categories

### 1. 🎨 UI Components Library
**File**: `src/test/categories/ui-components.test.tsx`
```bash
npm test -- src/test/categories/ui-components.test.tsx
```

### 2. 🎤 Voice Synthesis Studio
**File**: `src/test/categories/voice-synthesis.test.tsx`
```bash
npm test -- src/test/categories/voice-synthesis.test.tsx
```

### 3. 🔌 Plugin Development
**File**: `src/test/categories/plugin-development.test.tsx`
```bash
npm test -- src/test/categories/plugin-development.test.tsx
```

### 4. 🧠 Consciousness Studio
**File**: `src/test/categories/consciousness-studio.test.tsx`
```bash
npm test -- src/test/categories/consciousness-studio.test.tsx
```

### 5. ⚛️ Quantum Intelligence
**File**: `src/test/categories/quantum-intelligence.test.tsx`
```bash
npm test -- src/test/categories/quantum-intelligence.test.tsx
```

### 6. 🌈 Holographic DAW
**File**: `src/test/categories/holographic-daw.test.tsx`
```bash
npm test -- src/test/categories/holographic-daw.test.tsx
```

### 7. ⛓️ Blockchain Studio
**File**: `src/test/categories/blockchain-studio.test.tsx`
```bash
npm test -- src/test/categories/blockchain-studio.test.tsx
```

### 8. 🌍 Global Collaboration
**File**: `src/test/categories/global-collaboration.test.tsx`
```bash
npm test -- src/test/categories/global-collaboration.test.tsx
```

### 9. 🌉 AuraBridge Integration
**File**: `src/test/categories/aurabridge-integration.test.tsx`
```bash
npm test -- src/test/categories/aurabridge-integration.test.tsx
```

### 10. 🗂️ State Management
**File**: `src/test/categories/state-management.test.tsx`
```bash
npm test -- src/test/categories/state-management.test.tsx
```

### 11. ⚙️ Utilities & Services
**File**: `src/test/categories/utilities-services.test.tsx`
```bash
npm test -- src/test/categories/utilities-services.test.tsx
```

### 12. 🎼 AI Music Generation
**File**: `src/test/categories/ai-music-generation.test.tsx`
```bash
npm test -- src/test/categories/ai-music-generation.test.tsx
```

### 13. 🔊 Audio Engine
**File**: `src/test/categories/audio-engine.test.tsx`
```bash
npm test -- src/test/categories/audio-engine.test.tsx
```

### 14. 👥 Social Features
**File**: `src/test/categories/social-features.test.tsx`
```bash
npm test -- src/test/categories/social-features.test.tsx
```

## Component Tests

### Button Component
```bash
npm test -- src/components/ui/__tests__/Button.test.tsx
```

### Error Boundary
```bash
npm test -- src/components/__tests__/ErrorBoundary.test.tsx
```

## Hook Tests

### useToast Hook
```bash
npm test -- src/hooks/__tests__/useToast.test.ts
```

## Integration Tests

### Edge Functions
```bash
npm test -- src/test/integration/EdgeFunctions.test.ts
```

## Test Patterns

### Running Multiple Categories
```bash
npm test -- src/test/categories/ui-components.test.tsx src/test/categories/audio-engine.test.tsx
```

### Running Tests with Specific Pattern
```bash
npm test -- --grep "Audio Processing"
```

### Running Tests in Parallel
```bash
npm test -- --threads
```

## Coverage Reports

### Generate Coverage Report
```bash
npm run test:coverage
```

Coverage reports will be generated in the `coverage` directory.

### View HTML Coverage Report
```bash
open coverage/index.html
```

## Debugging Tests

### Run Tests in Debug Mode
```bash
npm test -- --no-coverage --reporter=verbose
```

### Run Specific Test Suite
```bash
npm test -- --grep "Consciousness Studio"
```

## Continuous Integration

### Pre-commit Hook
```bash
npm test -- --run
```

### CI Pipeline
```yaml
- name: Run Tests
  run: npm test -- --run --coverage
```

## Test Statistics

- **Total Test Files**: 14+ category test files
- **Total Tests**: 150+ individual tests
- **Coverage Target**: 80%+
- **Test Types**: Unit, Integration, Component

## Troubleshooting

### Tests Not Running
1. Ensure all dependencies are installed: `npm install`
2. Check Node.js version: `node --version` (requires 18+)
3. Clear cache: `npm run test -- --clearCache`

### Slow Tests
1. Use watch mode for development: `npm run test:watch`
2. Run specific test files instead of all tests
3. Use `--threads` flag for parallel execution

### Import Errors
1. Check `vitest.config.ts` for path aliases
2. Verify all imports use correct paths
3. Ensure `@/` alias is configured correctly

## Best Practices

1. **Write Descriptive Test Names**: Use clear, descriptive names for test cases
2. **Group Related Tests**: Use `describe` blocks to organize tests
3. **Test One Thing**: Each test should verify a single behavior
4. **Use Meaningful Assertions**: Use appropriate matchers for clarity
5. **Clean Up**: Ensure tests don't leave side effects

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [AURA-X Testing Guide](./TESTING_GUIDE.md)
