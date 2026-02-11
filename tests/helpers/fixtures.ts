import { test as base } from '@playwright/test';
import { login } from './auth.helper';

/** Authenticated test fixture — auto-logs in before each test */
export const test = base.extend<{ authenticatedPage: void }>({
  authenticatedPage: [
    async ({ page }, use) => {
      await login(page);
      await use();
    },
    { auto: true },
  ],
});

export { expect } from '@playwright/test';
