/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Nunito"', 'ui-rounded', '"Segoe UI"', 'system-ui', 'sans-serif'],
        chinese: ['"Noto Serif SC"', '"Microsoft YaHei"', '"PingFang SC"', 'serif'],
      },
      colors: {
        linen: {
          50: '#FFFDF9',
          100: '#FBF7F0',
          200: '#F5EDE1',
          300: '#EBE0CF',
          400: '#DECDB8',
        },
        peach: {
          50: '#FFF4EE',
          100: '#FDE7DA',
          200: '#F9D1BA',
          300: '#F2B493',
          400: '#E5926B',
          500: '#D97855',
          600: '#C46240',
          700: '#9F4A2D',
          800: '#7D3A23',
        },
        sage: {
          50: '#F3F8F3',
          100: '#E3EFE4',
          200: '#C9DFCB',
          300: '#A5C7A9',
          400: '#7CA883',
          500: '#5D8C68',
          600: '#497454',
          700: '#385B41',
          800: '#2A4431',
        },
        honey: {
          50: '#FEF9EB',
          100: '#FCF0D2',
          200: '#F7DFA8',
          500: '#C98A32',
          700: '#85581A',
        },
        berry: {
          50: '#FDF2F0',
          100: '#F9E0DC',
          200: '#F2C1BA',
          500: '#C95E59',
          700: '#8D3633',
        },
        cocoa: {
          400: '#A19084',
          500: '#837266',
          600: '#69594E',
          700: '#4F4239',
          800: '#3B302A',
          900: '#2B221D',
        },
      },
      borderRadius: {
        cozy: '24px',
        bento: '28px',
        clay: '32px',
      },
      boxShadow: {
        clay: '0 14px 32px -12px rgba(112, 86, 62, 0.14), 0 4px 12px -4px rgba(112, 86, 62, 0.06), inset 0 2px 3px rgba(255, 255, 255, 0.9), inset 0 -3px 6px rgba(186, 158, 128, 0.15)',
        'clay-sm': '0 8px 20px -8px rgba(112, 86, 62, 0.12), 0 2px 6px -2px rgba(112, 86, 62, 0.05), inset 0 1.5px 2px rgba(255, 255, 255, 0.85), inset 0 -2px 4px rgba(186, 158, 128, 0.13)',
        'clay-hover': '0 20px 38px -12px rgba(112, 86, 62, 0.18), 0 6px 14px -4px rgba(112, 86, 62, 0.08), inset 0 2px 4px rgba(255, 255, 255, 0.95), inset 0 -3px 6px rgba(186, 158, 128, 0.16)',
        'clay-inset': 'inset 0 2px 6px rgba(120, 92, 68, 0.09), inset 0 -1px 2px rgba(255, 255, 255, 0.7)',
        'clay-peach': '0 12px 24px -8px rgba(217, 120, 85, 0.38), inset 0 2px 3px rgba(255, 236, 224, 0.55), inset 0 -3px 6px rgba(145, 58, 28, 0.22)',
        'clay-sage': '0 12px 24px -8px rgba(93, 140, 104, 0.36), inset 0 2px 3px rgba(230, 247, 234, 0.5), inset 0 -3px 6px rgba(42, 74, 50, 0.22)',
        'clay-dark': '0 12px 24px -8px rgba(59, 48, 42, 0.34), inset 0 2px 3px rgba(255, 255, 255, 0.18), inset 0 -3px 6px rgba(20, 14, 10, 0.35)',
      },
    },
  },
  plugins: [],
};
