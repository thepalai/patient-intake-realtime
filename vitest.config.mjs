import { defineConfig } from 'vitest/config';

// The tests import app code the way the app does, as '@/lib/…'. Next.js reads
// that shortcut from jsconfig.json, but Vitest doesn't, so it is repeated here:
// '@' is the folder this file is in, the project root.
export default defineConfig({
  resolve: {
    alias: { '@': import.meta.dirname },
  },
});
