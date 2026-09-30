import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'scripts/**/*.test.ts', 'worker/test/**/*.test.ts'],
    environment: 'node',
  },
});
