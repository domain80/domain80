/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  plugins: [
    require('@tailwindcss/typography'),
    require('daisyui'),
  ],
  daisyui: {
    themes: false, // Disable DaisyUI themes to use our custom theme
    base: false, // Disable DaisyUI base styles
    styled: true, // Use DaisyUI styled components
    utils: true, // Use DaisyUI utility classes
  },
};
