export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0f766e',
          700: '#115e59',
          900: '#134e4a'
        }
      },
      fontFamily: {
        display: ['Georgia', 'serif'],
        body: ['Segoe UI', 'sans-serif']
      }
    }
  },
  plugins: []
};
