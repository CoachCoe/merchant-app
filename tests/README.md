# 🧪 Testing Documentation

This document provides comprehensive information about the testing infrastructure for the Web3 Anonymous Marketplace.

## 📋 Testing Overview

The project implements a **comprehensive testing strategy** with multiple layers:

- **Unit Tests** - Individual functions and components
- **Integration Tests** - API endpoints and service interactions  
- **E2E Tests** - Complete user workflows
- **Coverage Reporting** - Code coverage metrics

## 🏗️ Testing Architecture

### **Backend Testing (Jest + Supertest)**
- **Framework**: Jest with TypeScript support
- **HTTP Testing**: Supertest for API endpoint testing
- **Database**: In-memory SQLite for isolated tests
- **Mocking**: Comprehensive mocking of external dependencies

### **Frontend Testing (Vitest + Testing Library)**
- **Framework**: Vitest with React support
- **Component Testing**: React Testing Library
- **User Interactions**: User Event simulation
- **Mocking**: WebSocket, fetch, and browser APIs

### **E2E Testing (Playwright)**
- **Framework**: Playwright for cross-browser testing
- **Scenarios**: Complete user workflows
- **Devices**: Desktop, mobile, and tablet testing
- **CI/CD**: Automated testing in CI pipelines

## 🚀 Running Tests

### **All Tests**
```bash
npm test                    # Run all tests (backend + frontend)
npm run test:ci            # Run all tests with coverage (CI mode)
```

### **Backend Tests**
```bash
npm run test:backend       # Run backend tests once
npm run test:backend:watch # Run backend tests in watch mode
npm run test:backend:coverage # Run with coverage report
```

### **Frontend Tests**
```bash
npm run test:frontend      # Run frontend tests once
npm run test:frontend:watch # Run frontend tests in watch mode
npm run test:frontend:coverage # Run with coverage report
```

### **E2E Tests**
```bash
npm run test:e2e          # Run E2E tests
npm run test:e2e:ui       # Run E2E tests with UI
```

## 📁 Test Structure

```
tests/
├── unit/                    # Unit tests
│   ├── services/           # Service layer tests
│   │   ├── sessionService.test.ts
│   │   ├── databaseService.test.ts
│   │   └── ...
│   ├── middleware/         # Middleware tests
│   │   ├── validationMiddleware.test.ts
│   │   └── sessionMiddleware.test.ts
│   ├── utils/             # Utility function tests
│   └── models/            # Data model tests
├── integration/           # Integration tests
│   ├── api/              # API endpoint tests
│   │   ├── cart.test.ts
│   │   ├── products.test.ts
│   │   └── ...
│   └── database/         # Database integration tests
├── e2e/                  # End-to-end tests
│   ├── payment-flow.spec.ts
│   ├── marketplace.spec.ts
│   └── admin.spec.ts
├── fixtures/             # Test data and mocks
│   ├── test-data.json
│   └── mock-responses.json
├── setup.ts              # Jest setup
├── frontend-setup.ts     # Vitest setup
└── README.md            # This file
```

## 🎯 Test Coverage

### **Coverage Thresholds**
- **Backend**: 70% minimum coverage
- **Frontend**: 60% minimum coverage
- **Critical Paths**: 90% minimum coverage

### **Coverage Reports**
- **HTML Reports**: `coverage/index.html`
- **LCOV Reports**: `coverage/lcov.info`
- **Text Reports**: Console output

### **Critical Areas (90% Coverage Required)**
- Payment processing
- Session management
- Input validation
- Database operations
- Security middleware

## 🧪 Test Categories

### **Unit Tests**
Test individual functions and components in isolation:

```typescript
// Example: Service unit test
describe('SessionService', () => {
  it('should create session with correct properties', () => {
    const sessionId = sessionService.createSession(mockRequest);
    expect(sessionId).toBeDefined();
    expect(sessionId).toMatch(/^[a-f0-9]{32}$/);
  });
});
```

### **Integration Tests**
Test API endpoints and service interactions:

```typescript
// Example: API integration test
describe('Cart API', () => {
  it('should add item to cart', async () => {
    const response = await request(app)
      .post('/api/cart/items')
      .send({ productId: 'test-id', quantity: 1 })
      .expect(200);
    
    expect(response.body.success).toBe(true);
  });
});
```

### **E2E Tests**
Test complete user workflows:

```typescript
// Example: E2E test
test('should complete payment flow', async ({ page }) => {
  await page.goto('/products');
  await page.click('button:has-text("Add to Cart")');
  await page.click('button:has-text("Checkout")');
  // ... complete payment flow
});
```

## 🔧 Test Configuration

### **Jest Configuration** (`jest.config.js`)
- TypeScript support with ESM
- In-memory database for tests
- Coverage reporting
- Mock setup

### **Vitest Configuration** (`vitest.config.ts`)
- React component testing
- JSDOM environment
- Coverage thresholds
- Path aliases

### **Playwright Configuration** (`playwright.config.ts`)
- Multi-browser testing
- Mobile device testing
- Screenshot on failure
- Trace collection

## 📊 Test Data Management

### **Fixtures**
- `test-data.json` - Sample data for tests
- Mock responses for external APIs
- Database seed data

### **Mocking Strategy**
- **External APIs**: Mock HTTP responses
- **Database**: In-memory SQLite
- **WebSocket**: Mock WebSocket connections
- **Browser APIs**: Mock localStorage, fetch, etc.

## 🚨 Testing Best Practices

### **Test Naming**
- Use descriptive test names
- Follow pattern: `should [expected behavior] when [condition]`
- Group related tests with `describe` blocks

### **Test Structure**
- **Arrange**: Set up test data and mocks
- **Act**: Execute the code under test
- **Assert**: Verify expected outcomes

### **Mocking Guidelines**
- Mock external dependencies
- Use real implementations for internal code
- Reset mocks between tests
- Verify mock interactions when relevant

### **Error Testing**
- Test both success and failure scenarios
- Verify error messages and status codes
- Test edge cases and boundary conditions

## 🔍 Debugging Tests

### **Backend Tests**
```bash
# Run specific test file
npm run test:backend -- sessionService.test.ts

# Run with verbose output
npm run test:backend -- --verbose

# Debug mode
npm run test:backend -- --detectOpenHandles
```

### **Frontend Tests**
```bash
# Run specific test file
npm run test:frontend -- ProductCard.test.tsx

# Run with UI
npm run test:frontend:watch
```

### **E2E Tests**
```bash
# Run with browser UI
npm run test:e2e:ui

# Debug mode
npx playwright test --debug
```

## 📈 Continuous Integration

### **GitHub Actions** (Recommended)
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:ci
```

### **Pre-commit Hooks**
```bash
# Install husky for git hooks
npm install --save-dev husky lint-staged

# Add to package.json
"husky": {
  "hooks": {
    "pre-commit": "lint-staged"
  }
}
```

## 🎯 Testing Roadmap

### **Phase 1: Core Infrastructure** ✅
- [x] Jest setup for backend
- [x] Vitest setup for frontend
- [x] Playwright setup for E2E
- [x] Basic test structure

### **Phase 2: Critical Services** ✅
- [x] Session management tests
- [x] Database service tests
- [x] Validation middleware tests
- [x] Payment service tests

### **Phase 3: API Coverage** ✅
- [x] Cart API tests
- [x] Products API tests
- [x] Orders API tests
- [x] Marketplace API tests

### **Phase 4: Frontend Components** ✅
- [x] ProductCard component tests
- [x] useCart hook tests
- [x] Form validation tests
- [x] Error handling tests

### **Phase 5: E2E Scenarios** ✅
- [x] Payment flow tests
- [x] User registration tests
- [x] Admin dashboard tests
- [x] Mobile responsiveness tests

### **Phase 6: Advanced Testing** (Future)
- [ ] Performance testing
- [ ] Security testing
- [ ] Load testing
- [ ] Accessibility testing

## 🆘 Troubleshooting

### **Common Issues**

**Tests failing with import errors:**
```bash
# Clear Jest cache
npm run test:backend -- --clearCache
```

**Frontend tests not finding components:**
```bash
# Check path aliases in vitest.config.ts
# Verify component imports are correct
```

**E2E tests timing out:**
```bash
# Increase timeout in playwright.config.ts
# Check if application is running on correct port
```

**Coverage not meeting thresholds:**
```bash
# Run coverage report to identify gaps
npm run test:coverage
# Add tests for uncovered code paths
```

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Vitest Documentation](https://vitest.dev/guide/)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

**Happy Testing! 🧪✨**
