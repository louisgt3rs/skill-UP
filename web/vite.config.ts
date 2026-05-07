import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.SUPABASE_URL': JSON.stringify(
      process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
    ),
    'process.env.SUPABASE_ANON_KEY': JSON.stringify(
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''
    ),
    'process.env.DISCORD_CLIENT_ID': JSON.stringify(
      process.env.DISCORD_CLIENT_ID || ''
    ),
  },
});
