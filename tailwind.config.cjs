// Tailwind CSS configuration for the Worlddashboard project.
// This configuration defines the files Tailwind should scan for class usage,
// extends the default theme with project specific colours and fonts, and
// enables dark mode styling.  By centralising design tokens here we can
// easily tweak the look and feel of the dashboard without touching
// component code.

module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#06b6d4', // neon cyan accent
        secondary: '#8b5cf6', // electric purple accent
        danger: '#ef4444', // warning red
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};