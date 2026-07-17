import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    wranglerConfigPath: './wrangler.jsonc',
    dbName: 'startup-os-db',
  },
});
