module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        df: {
          bg: '#10151b',        // Changed to match sidebar
          sidebar: '#10151b',   // Darker sidebar
          card: '#1a222b',      // Stat cards and panels
          cardhover: '#1e2833', // Hover states
          border: '#2a3441',    // Subtle borders
          text: '#8a94a6',      // Muted text
          textlight: '#ffffff', // Bright text
          accent: '#18e1b1',    // The neon teal/green
          purple: '#9d7cff',
          pink: '#ff7790',
          yellow: '#b3e642',
          blue: '#3b82f6',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
