# Automated Testing Suite

This directory contains automated tests for the Amapiano DAW platform.

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests in UI mode
npm run test:ui
```

## Test Structure

```
src/
├── components/__tests__/     # Component tests
├── pages/__tests__/          # Page tests
├── hooks/__tests__/          # Hook tests
├── test/
│   ├── setup.ts             # Test configuration
│   ├── integration/         # Integration tests
│   └── README.md            # This file
```

## Test Categories

### Unit Tests
- **Components**: Test individual React components
- **Hooks**: Test custom React hooks
- **Utilities**: Test helper functions

### Integration Tests
- **Edge Functions**: Test Supabase function calls
- **API Integration**: Test external API interactions
- **Database**: Test database queries (mocked)

## Writing Tests

### Component Test Example
```typescript
import { render, screen } from '@testing-library/react';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### Hook Test Example
```typescript
import { renderHook } from '@testing-library/react';
import { useMyHook } from '../useMyHook';

describe('useMyHook', () => {
  it('returns expected value', () => {
    const { result } = renderHook(() => useMyHook());
    expect(result.current.value).toBe(true);
  });
});
```

## Coverage Goals

- **Statements**: > 70%
- **Branches**: > 60%
- **Functions**: > 70%
- **Lines**: > 70%

## Key Test Areas

### Critical Components
✅ ErrorBoundary - Error handling UI
✅ Button - UI component variants
✅ Toast - Notification system

### Critical Pages
✅ Index - Landing page
⏳ DAW - Digital Audio Workstation
⏳ Social Feed - Social features
⏳ AURA-X - AI platform

### Edge Functions
✅ ai-music-generation - Music generation
✅ check-subscription - Subscription status
✅ aura-conductor-orchestration - AI orchestration
⏳ neural-music-generation - Neural models
⏳ realtime-ai-assistant - AI assistant

## Continuous Integration

Tests should run on:
- Every commit
- Pull requests
- Before deployment

## Troubleshooting

### Common Issues

**Issue**: Tests timeout
**Solution**: Increase timeout in vitest.config.ts

**Issue**: Mock not working
**Solution**: Check mock path matches import path exactly

**Issue**: JSDOM errors
**Solution**: Ensure DOM APIs are properly mocked in setup.ts

## Best Practices

1. **Descriptive test names**: Use "it should..." format
2. **Arrange-Act-Assert**: Structure tests clearly
3. **Mock external dependencies**: Keep tests isolated
4. **Test user behavior**: Focus on what users do
5. **Avoid implementation details**: Test outputs, not internals

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [React Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
