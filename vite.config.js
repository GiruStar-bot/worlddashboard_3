import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite configuration for the Worlddashboard project.  This file configures
// the React plugin and specifies the development server port.  The plugin
// handles the JSX transformation and other React-specific optimisations.

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
});