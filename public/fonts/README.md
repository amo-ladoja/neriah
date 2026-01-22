# Custom Fonts

Place your custom font files here.

## Setup Instructions

1. Add your font files (e.g., .woff, .woff2, .ttf)
2. Update `app/globals.css` to include @font-face declarations
3. Update `tailwind.config.ts` to reference the font family

Example in `globals.css`:

```css
@font-face {
  font-family: 'YourCustomFont';
  src: url('/fonts/your-font.woff2') format('woff2'),
       url('/fonts/your-font.woff') format('woff');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
```

Example in `tailwind.config.ts`:

```typescript
fontFamily: {
  sans: ['YourCustomFont', 'system-ui', 'sans-serif'],
},
```

Current configuration uses a CSS variable `var(--font-custom)` as a placeholder.
