# RecipeBook Testing Guide

## Overview

This project includes a comprehensive test suite covering unit tests and end-to-end (E2E) tests. This guide explains how to run the tests, what they cover, and how to add more tests following test-driven development (TDD) principles.

## Test Structure

```
e2e/
├── auth.test.ts          # Authentication (login/signup)
├── recipes.test.ts       # Recipe CRUD operations
├── tags.test.ts          # Tags and filtering
└── demo.test.ts          # Example Playwright test

src/
└── lib/
    └── validation/
        └── recipe.test.ts # Form validation unit tests
```

## Running Tests

### Unit Tests (Vitest)

Run all unit tests:

```bash
pnpm run test:unit
```

Run unit tests in watch mode (automatically re-run on file changes):

```bash
pnpm run test:unit -- --watch
```

Run specific test file:

```bash
pnpm run test:unit -- src/lib/validation/recipe.test.ts
```

### E2E Tests (Playwright)

Run all E2E tests:

```bash
pnpm run test:e2e
```

Run E2E tests in headed mode (see browser):

```bash
pnpm run test:e2e -- --headed
```

Run specific E2E test file:

```bash
pnpm run test:e2e -- e2e/auth.test.ts
```

Run tests in debug mode:

```bash
pnpm run test:e2e -- --debug
```

### All Tests

Run all tests (unit + E2E):

```bash
pnpm run test
```

## Test Coverage

### Unit Tests - Form Validation

**File:** `src/lib/validation/recipe.test.ts`

Tests validation functions for recipe forms:

- ✅ Title validation (required, max length)
- ✅ Ingredients validation (required, max length)
- ✅ Instructions validation (required, max length)
- ✅ Image URL validation (optional, format check)
- ✅ Rating validation (1-5 scale, optional)
- ✅ Description validation (max length, optional)

**Example test:**

```typescript
test('should reject rating above 5', () => {
	const result = validateRating(5.5);
	expect(result.valid).toBe(false);
	expect(result.error).toContain('between 1 and 5');
});
```

### E2E Tests - Authentication

**File:** `e2e/auth.test.ts`

Tests user authentication flows:

- ✅ Sign up with new account
- ✅ Sign up validation (invalid email, short password)
- ✅ Redirect logged-in users away from signup
- ✅ Login with valid credentials
- ✅ Login error handling
- ✅ Redirect to login for protected routes
- ✅ Display user email in navbar when logged in

**Example test:**

```typescript
test('should sign up a new user', async ({ page }) => {
	await page.goto('/signup');

	const email = `test${Date.now()}@example.com`;
	await page.fill('input[name="email"]', email);
	await page.fill('input[name="password"]', 'TestPassword123!');

	await page.click('button[type="submit"]');

	await expect(page).toHaveURL(/\/confirm-email/);
});
```

### E2E Tests - Recipe CRUD

**File:** `e2e/recipes.test.ts`

Tests recipe creation, reading, and operations:

- ✅ Display recipes page when logged in
- ✅ Navigate to create recipe form
- ✅ Create a complete recipe with all fields
- ✅ Validation: missing title
- ✅ Validation: missing ingredients
- ✅ Validation: missing instructions
- ✅ Validation: invalid image URL
- ✅ Validation: rating out of range
- ✅ Cancel recipe creation
- ✅ View recipe details after creation

**Key test data:**

```typescript
const recipeTitle = `Test Recipe ${Date.now()}`;
const recipeDescription = 'A delicious test recipe';
const ingredients = '2 cups flour\n1 cup sugar\n3 eggs';
const instructions = 'Mix ingredients\nBake at 350F';
```

### E2E Tests - Tags & Filtering

**File:** `e2e/tags.test.ts`

Tests tag management and filtering:

- ✅ Display popular tags on create form
- ✅ Add tags to recipes
- ✅ Navigate to tag pages from recipes
- ✅ Filter recipes by tag
- ✅ Handle comma-separated tags
- ✅ Trim whitespace from tags
- ✅ Display tag count on tag page

**Example test:**

```typescript
test('should add tags to a recipe', async ({ page }) => {
	await page.goto('/recipes/new');

	await page.fill('input[name="title"]', 'Tagged Recipe');
	await page.fill('input[name="tags"]', 'Dessert, Quick, Vegetarian');

	// Submit and verify tags appear
	await expect(page.locator('text=Dessert')).toBeVisible();
});
```

## Setting Up Test Environment

### For E2E Tests

E2E tests need a test user in your Supabase database. Set environment variables:

```bash
# Create a .env.test file (don't commit this!)
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=password123
```

Then in your test file:

```typescript
const testEmail = process.env.TEST_USER_EMAIL || 'test@example.com';
const testPassword = process.env.TEST_USER_PASSWORD || 'password123';
```

### For Unit Tests

Unit tests run in jsdom environment (simulated browser), so no server setup needed.

## Test-Driven Development (TDD) Workflow

### Step 1: Write the Test (Red)

Write a test that describes what you want to build:

```typescript
test('should validate email format', () => {
	const result = validateEmail('invalid-email');
	expect(result.valid).toBe(false);
	expect(result.error).toContain('email');
});
```

### Step 2: Run and Watch It Fail

```bash
pnpm run test:unit -- --watch
```

You should see the test fail because the function doesn't exist yet.

### Step 3: Write Minimal Code (Green)

Write just enough code to make the test pass:

```typescript
export function validateEmail(email: string) {
	if (!email.includes('@')) {
		return { valid: false, error: 'Invalid email format' };
	}
	return { valid: true };
}
```

### Step 4: Run Tests Again

Tests should now pass. Watch for any other tests that break.

### Step 5: Refactor (Refactor)

Improve the code without changing what it does:

```typescript
export function validateEmail(email: string): ValidationResult {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

	if (!emailRegex.test(email)) {
		return { valid: false, error: 'Invalid email format' };
	}
	return { valid: true };
}
```

### Step 6: Write More Tests

Continue the cycle with more test cases and edge cases.

## Best Practices

### Unit Tests

- ✅ Test one thing per test
- ✅ Use descriptive test names
- ✅ Test edge cases (empty input, max length, etc.)
- ✅ Mock external dependencies
- ✅ Keep tests fast

### E2E Tests

- ✅ Test complete user workflows
- ✅ Use `test.beforeEach()` for setup (like login)
- ✅ Wait for elements to be visible before interacting
- ✅ Use unique identifiers (timestamps, UUIDs) to avoid conflicts
- ✅ Clean up test data if needed

### General

- ✅ Test behavior, not implementation
- ✅ Avoid testing library code you didn't write
- ✅ Keep tests independent (one test shouldn't affect another)
- ✅ Use meaningful assertions (not just `.toBeTruthy()`)

## Common Playwright APIs

### Navigation

```typescript
await page.goto('/recipes/new');
await expect(page).toHaveURL(/recipes\/new/);
```

### Form Filling

```typescript
await page.fill('input[name="title"]', 'My Recipe');
await page.fill('textarea[name="description"]', 'Delicious!');
```

### Clicking

```typescript
await page.click('button:has-text("Submit")');
```

### Waiting

```typescript
await page.waitForURL(/recipes\/\d+/);
await page.waitForSelector('text=Success');
```

### Assertions

```typescript
await expect(page.locator('text=Error')).toBeVisible();
await expect(page.locator('input[name="email"]')).toBeFocused();
await expect(page).toHaveTitle('RecipeBook');
```

## Debugging Tests

### View the browser while running

```bash
pnpm run test:e2e -- --headed
```

### Pause on each test

```bash
pnpm run test:e2e -- --debug
```

### Pause at specific point in test

```typescript
await page.pause(); // Opens the Playwright Inspector
```

### Use inspector to select elements

Run tests in debug mode, use the inspector to find the right selectors.

## CI/CD Integration

Add this to your GitHub Actions or similar:

```yaml
- name: Run unit tests
  run: pnpm run test:unit -- --run

- name: Run E2E tests
  run: pnpm run test:e2e
```

## Next Steps

1. **Run the existing tests**: `pnpm run test`
2. **Pick a feature**: Choose something you want to build
3. **Write a test first**: Describe what should happen
4. **Make it pass**: Write the minimum code needed
5. **Refactor**: Improve the code
6. **Repeat**: Add more test cases

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library Best Practices](https://testing-library.com/docs/)
- [Test-Driven Development](https://en.wikipedia.org/wiki/Test-driven_development)

## Questions?

Refer to:

- Existing tests in `e2e/` and `src/lib/validation/`
- Playwright Inspector: `pnpm run test:e2e -- --debug`
- Test output messages when tests fail
