# Testing Guide

This document outlines the comprehensive testing strategy for ContentMagic, covering unit tests, integration tests, end-to-end tests, accessibility testing, and performance testing.

## Test Structure

```
├── backend/src/test/           # Backend tests
│   ├── setup.ts               # Test configuration
│   ├── *.test.ts              # Unit tests
│   ├── integration/           # Integration tests
│   └── performance.test.ts    # Performance tests
├── frontend/src/test/         # Frontend tests
│   ├── setup.ts               # Test configuration
│   ├── *.test.tsx             # Unit tests
│   ├── accessibility.test.tsx # Accessibility tests
│   └── hooks/                 # Hook tests
├── e2e/                       # End-to-end tests
│   ├── auth.spec.ts           # Authentication flows
│   ├── content-generation.spec.ts
│   └── content-library.spec.ts
└── playwright.config.ts       # E2E test configuration
```

## Running Tests

### All Tests
```bash
npm run test:all          # Run all tests (unit + integration + e2e)
npm run test             # Run unit and integration tests only
```

### Backend Tests
```bash
cd backend
npm test                 # Run all backend tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage report
npm run test:integration # Run integration tests only
npm run test:performance # Run performance tests only
npm run test:ui          # Run tests with Vitest UI
```

### Frontend Tests
```bash
cd frontend
npm run test:run         # Run all frontend tests
npm test                 # Run tests in watch mode
npm run test:coverage    # Run tests with coverage report
npm run test:a11y        # Run accessibility tests only
```

### End-to-End Tests
```bash
npm run test:e2e         # Run E2E tests headless
npm run test:e2e:ui      # Run E2E tests with UI
npx playwright test      # Run Playwright tests directly
npx playwright test --debug  # Debug E2E tests
```

## Test Categories

### 1. Unit Tests

**Backend Unit Tests:**
- API endpoint handlers
- Service layer functions
- Database operations (mocked)
- Authentication logic
- Error handling
- Validation functions

**Frontend Unit Tests:**
- React components
- Custom hooks
- Utility functions
- Form validation
- State management

**Example:**
```typescript
// backend/src/test/auth.service.test.ts
describe('AuthService', () => {
  it('should hash passwords correctly', async () => {
    const password = 'testpassword';
    const hashed = await hashPassword(password);
    expect(hashed).not.toBe(password);
    expect(await verifyPassword(password, hashed)).toBe(true);
  });
});
```

### 2. Integration Tests

**Backend Integration Tests:**
- Complete API workflows
- Database interactions
- External service integrations
- Authentication flows
- Error propagation

**Frontend Integration Tests:**
- Component interactions
- API communication
- State updates
- User workflows

**Example:**
```typescript
// backend/src/test/integration/user-flows.test.ts
describe('User Registration Flow', () => {
  it('should register, login, and access protected routes', async () => {
    // Register user
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'password123' });
    
    expect(registerResponse.status).toBe(201);
    
    // Login and access protected route
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });
    
    expect(loginResponse.status).toBe(200);
  });
});
```

### 3. End-to-End Tests

**E2E Test Coverage:**
- User authentication flows
- Content generation workflows
- Content library management
- Scheduling functionality
- Analytics dashboard
- Subscription management
- Mobile responsiveness
- Cross-browser compatibility

**Example:**
```typescript
// e2e/auth.spec.ts
test('should complete login flow', async ({ page }) => {
  await page.goto('/');
  await page.fill('[placeholder="Email"]', 'test@example.com');
  await page.fill('[placeholder="Password"]', 'password123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard');
});
```

### 4. Accessibility Tests

**Accessibility Coverage:**
- WCAG 2.1 compliance
- Keyboard navigation
- Screen reader compatibility
- Color contrast
- ARIA labels and roles
- Focus management

**Example:**
```typescript
// frontend/src/test/accessibility.test.tsx
it('should be accessible', async () => {
  const { container } = render(<LoginForm />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### 5. Performance Tests

**Performance Test Coverage:**
- AI service response times
- Concurrent request handling
- Memory usage monitoring
- Database query performance
- Frontend rendering performance

**Example:**
```typescript
// backend/src/test/performance.test.ts
it('should handle concurrent AI requests efficiently', async () => {
  const requests = Array.from({ length: 10 }, () => 
    aiService.generateCaption({ prompt: 'test' })
  );
  
  const startTime = performance.now();
  await Promise.all(requests);
  const duration = performance.now() - startTime;
  
  expect(duration).toBeLessThan(5000);
});
```

## Test Configuration

### Backend Test Setup
- **Framework:** Vitest
- **Database:** Mocked with in-memory operations
- **HTTP Testing:** Supertest
- **Coverage:** c8
- **Mocking:** Vitest mocks

### Frontend Test Setup
- **Framework:** Vitest + React Testing Library
- **Environment:** jsdom
- **Accessibility:** jest-axe
- **Coverage:** v8
- **Mocking:** Vitest mocks

### E2E Test Setup
- **Framework:** Playwright
- **Browsers:** Chromium, Firefox, WebKit
- **Mobile:** iPhone 12, Pixel 5
- **Parallel:** Full parallelization
- **Retries:** 2 retries on CI

## Coverage Requirements

### Minimum Coverage Thresholds
- **Lines:** 80%
- **Functions:** 80%
- **Branches:** 80%
- **Statements:** 80%

### Coverage Reports
- **Format:** Text, JSON, HTML
- **Location:** `coverage/` directory
- **CI Integration:** Codecov

## Continuous Integration

### GitHub Actions Workflow
- **Triggers:** Push to main/develop, Pull requests
- **Jobs:**
  - Backend tests (with PostgreSQL service)
  - Frontend tests
  - E2E tests (with full stack)
  - Performance tests
  - Security audits

### Test Environment
- **Node.js:** 20.x
- **Database:** PostgreSQL 15
- **Cache:** npm cache
- **Artifacts:** Test reports, coverage reports

## Best Practices

### Writing Tests
1. **Descriptive Names:** Use clear, descriptive test names
2. **Arrange-Act-Assert:** Follow AAA pattern
3. **Single Responsibility:** One assertion per test when possible
4. **Mock External Dependencies:** Mock APIs, databases, external services
5. **Test Edge Cases:** Include error conditions and boundary cases

### Test Data
1. **Isolated:** Each test should be independent
2. **Predictable:** Use consistent test data
3. **Cleanup:** Clean up after tests
4. **Factories:** Use test data factories for complex objects

### Performance
1. **Parallel Execution:** Run tests in parallel when possible
2. **Selective Testing:** Use test patterns for focused testing
3. **Mock Heavy Operations:** Mock expensive operations in unit tests
4. **Timeout Management:** Set appropriate timeouts

## Debugging Tests

### Backend Tests
```bash
# Debug specific test
npm test -- --reporter=verbose auth.service.test.ts

# Debug with Node inspector
node --inspect-brk node_modules/.bin/vitest auth.service.test.ts
```

### Frontend Tests
```bash
# Debug specific component test
npm test -- LoginForm.test.tsx

# Run with UI for debugging
npm run test:ui
```

### E2E Tests
```bash
# Debug mode with browser
npx playwright test --debug

# Headed mode
npx playwright test --headed

# Specific test
npx playwright test auth.spec.ts
```

## Test Maintenance

### Regular Tasks
1. **Update Dependencies:** Keep testing frameworks updated
2. **Review Coverage:** Monitor coverage trends
3. **Refactor Tests:** Keep tests maintainable
4. **Performance Monitoring:** Track test execution times
5. **Flaky Test Management:** Identify and fix unstable tests

### Metrics to Monitor
- Test execution time
- Coverage percentage
- Flaky test rate
- CI success rate
- Test maintenance overhead

## Troubleshooting

### Common Issues
1. **Database Connection Errors:** Check test database setup
2. **Timeout Issues:** Increase timeout for slow operations
3. **Mock Issues:** Verify mock implementations
4. **Flaky E2E Tests:** Add proper waits and assertions
5. **Coverage Issues:** Check excluded files and thresholds

### Getting Help
- Check test logs for detailed error messages
- Use debug mode for step-by-step execution
- Review test setup and configuration
- Consult framework documentation
- Ask team members for assistance