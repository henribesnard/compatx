/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0e766e',
        'primary-light': '#e6f7f5',
        'primary-dark': '#0a635d',
        secondary: '#f0f2f5',
        // Ajouter explicitement les couleurs grises si nécessaire
        gray: {
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
        // Ajouter les couleurs de chat personnalisées
        'chat-assistant': '#f0f7ff',
        'chat-user': '#f0f7f5',
      },
    },
  },
  plugins: [],
}