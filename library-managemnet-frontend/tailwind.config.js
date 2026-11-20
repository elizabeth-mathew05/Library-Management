export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0f172a',
        paper: '#f8fafc',
        brand: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a'
        }
      },
      fontFamily: {
        display: ['Georgia', 'Times New Roman', 'serif'],
        body: ['Segoe UI', 'Tahoma', 'sans-serif']
      }
    }
  },
  plugins: []
};
