# SEO Wizard Design System V2
## Award-Winning UI Transformation

**Inspired by:** Stripe Dashboard, Linear, Vercel, Notion, Retool
**Target Quality:** 10/10 - Production-ready SaaS
**Compliance:** WCAG 2.1 AA minimum
**Philosophy:** Modern, clean, accessible, performant

---

## 🎨 COLOR SYSTEM

### Foundation Palette

```css
:root {
  /* Primary - Indigo (Stripe-inspired) */
  --primary-50: #EEF2FF;
  --primary-100: #E0E7FF;
  --primary-500: #6366F1;
  --primary-600: #4F46E5;
  --primary-700: #4338CA;

  /* Backgrounds */
  --bg-base: #FFFFFF;
  --bg-subtle: #F9FAFB;
  --bg-muted: #F3F4F6;
  --bg-emphasis: #E5E7EB;

  /* Dark mode */
  --bg-dark-base: #0A0A0B;
  --bg-dark-subtle: #111113;
  --bg-dark-muted: #1A1A1D;
  --bg-dark-emphasis: #27272A;

  /* Text */
  --text-primary: #111827;
  --text-secondary: #6B7280;
  --text-tertiary: #9CA3AF;
  --text-inverse: #FFFFFF;

  /* Borders */
  --border-subtle: #E5E7EB;
  --border-default: #D1D5DB;
  --border-strong: #9CA3AF;

  /* Semantic */
  --success: #10B981;
  --success-bg: #D1FAE5;
  --warning: #F59E0B;
  --warning-bg: #FEF3C7;
  --error: #EF4444;
  --error-bg: #FEE2E2;
  --info: #3B82F6;
  --info-bg: #DBEAFE;
}
```

### Color Usage Rules

1. **Primary color** - Actions, links, focus states only (max 10% of UI)
2. **Gray scale** - Structure, text, backgrounds (80% of UI)
3. **Semantic colors** - Status indicators, alerts, validation (10% of UI)
4. **Never use color alone** - Always pair with icon/text/shape

### Contrast Requirements

| Use Case | Minimum Ratio | Example |
|----------|---------------|---------|
| Body text | 4.5:1 | `#111827` on `#FFFFFF` = 16.1:1 ✅ |
| Large text (18px+) | 3:1 | `#6B7280` on `#FFFFFF` = 4.6:1 ✅ |
| UI components | 3:1 | `#4F46E5` on `#FFFFFF` = 8.6:1 ✅ |
| Focus indicators | 3:1 with adjacent | 2px outline with 2px offset ✅ |

---

## ✍️ TYPOGRAPHY SYSTEM

### Font Families

```css
:root {
  /* UI Text - Outfit (already implemented) */
  --font-sans: var(--font-outfit), -apple-system, BlinkMacSystemFont, sans-serif;

  /* Code/Data - JetBrains Mono */
  --font-mono: 'JetBrains Mono', 'SF Mono', Consolas, monospace;
}
```

### Type Scale (Vercel-inspired)

```css
:root {
  /* Font Sizes */
  --text-xs: 0.75rem;      /* 12px - captions, labels */
  --text-sm: 0.875rem;     /* 14px - body text */
  --text-base: 1rem;       /* 16px - emphasized body */
  --text-lg: 1.125rem;     /* 18px - small headings */
  --text-xl: 1.25rem;      /* 20px - card titles (H3) */
  --text-2xl: 1.5rem;      /* 24px - section titles (H2) */
  --text-3xl: 2rem;        /* 32px - page title (H1) */

  /* Line Heights */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;

  /* Font Weights */
  --font-light: 300;
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;

  /* Letter Spacing */
  --tracking-tight: -0.01em;
  --tracking-normal: 0;
  --tracking-wide: 0.05em;
}
```

### Typography Hierarchy

| Element | Size | Weight | Line Height | Usage |
|---------|------|--------|-------------|-------|
| H1 | 32px | 700 | 1.2 | Page title |
| H2 | 24px | 600 | 1.3 | Section title |
| H3 | 20px | 600 | 1.4 | Card title |
| H4 | 18px | 600 | 1.4 | Subsection |
| Body | 14px | 400 | 1.5 | Main content |
| Caption | 12px | 500 | 1.4 | Meta info |
| Label | 12px | 600 | 1.4 | Form labels |

---

## 📏 SPACING SYSTEM (8pt Grid)

### Base Units

```css
:root {
  --space-0: 0;
  --space-1: 0.25rem;   /* 4px - tight internal */
  --space-2: 0.5rem;    /* 8px - base unit */
  --space-3: 0.75rem;   /* 12px - small gaps */
  --space-4: 1rem;      /* 16px - default padding */
  --space-5: 1.25rem;   /* 20px - moderate spacing */
  --space-6: 1.5rem;    /* 24px - card padding */
  --space-8: 2rem;      /* 32px - section gaps */
  --space-10: 2.5rem;   /* 40px - large sections */
  --space-12: 3rem;     /* 48px - major sections */
  --space-16: 4rem;     /* 64px - hero spacing */
}
```

### Spacing Rules

1. **Card padding**: 24px (--space-6)
2. **Card gaps**: 24px between cards
3. **Section spacing**: 48px (--space-12)
4. **Form field gaps**: 16px (--space-4)
5. **Button padding**: 8px 16px (sm), 12px 24px (md)

---

## 🎭 COMPONENT LIBRARY

### 1. Cards

```css
.card {
  background: var(--bg-base);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 24px;
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

.card:hover {
  border-color: var(--border-default);
  box-shadow:
    0 1px 3px 0 rgba(0, 0, 0, 0.1),
    0 1px 2px 0 rgba(0, 0, 0, 0.06);
  transform: translateY(-2px);
}

/* Card variants */
.card-subtle {
  background: var(--bg-subtle);
  border-color: transparent;
}

.card-emphasis {
  background: var(--primary-50);
  border-color: var(--primary-200);
}
```

### 2. Buttons

```css
/* Primary Button */
.btn-primary {
  background: var(--primary-600);
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 150ms ease;
  height: 44px; /* Touch target */
}

.btn-primary:hover {
  background: var(--primary-700);
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.btn-primary:active {
  transform: translateY(0);
}

.btn-primary:focus-visible {
  outline: 2px solid var(--primary-600);
  outline-offset: 2px;
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  color: var(--text-primary);
  border: 1px solid var(--border-default);
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  height: 44px;
}

.btn-secondary:hover {
  background: var(--bg-subtle);
  border-color: var(--border-strong);
}

/* Ghost Button */
.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
}

.btn-ghost:hover {
  background: var(--bg-muted);
  color: var(--text-primary);
}
```

### 3. Badges

```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
}

.badge-success {
  background: var(--success-bg);
  color: #047857; /* Darker green for contrast */
}

.badge-warning {
  background: var(--warning-bg);
  color: #92400E; /* Darker amber */
}

.badge-error {
  background: var(--error-bg);
  color: #991B1B; /* Darker red */
}

.badge-info {
  background: var(--info-bg);
  color: #1E40AF; /* Darker blue */
}

.badge-neutral {
  background: var(--bg-emphasis);
  color: var(--text-secondary);
}

/* Count badge (for tabs) */
.badge-count {
  background: var(--bg-emphasis);
  color: var(--text-secondary);
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  min-width: 20px;
  text-align: center;
}
```

### 4. Data Tables

```css
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.data-table thead {
  position: sticky;
  top: 0;
  background: var(--bg-base);
  z-index: 10;
}

.data-table th {
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  font-size: 12px;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 2px solid var(--border-default);
}

.data-table td {
  padding: 16px;
  border-bottom: 1px solid var(--border-subtle);
  color: var(--text-primary);
}

.data-table tbody tr {
  transition: background 150ms ease;
}

.data-table tbody tr:hover {
  background: var(--bg-subtle);
}

/* Column alignment */
.data-table .col-numeric {
  text-align: right;
  font-variant-numeric: tabular-nums;
  font-family: var(--font-mono);
}

/* Row density variants */
.table-condensed td { padding: 12px 16px; }
.table-regular td { padding: 16px; }
.table-relaxed td { padding: 20px 16px; }
```

### 5. Form Inputs

```css
.input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid var(--border-default);
  border-radius: 8px;
  font-size: 14px;
  font-family: var(--font-sans);
  color: var(--text-primary);
  background: var(--bg-base);
  transition: all 150ms ease;
  height: 44px; /* Touch target */
}

.input::placeholder {
  color: var(--text-tertiary);
}

.input:hover {
  border-color: var(--border-strong);
}

.input:focus {
  outline: 2px solid var(--primary-600);
  outline-offset: 0;
  border-color: var(--primary-600);
}

.input-error {
  border-color: var(--error);
}

.input-error:focus {
  outline-color: var(--error);
  border-color: var(--error);
}

.input-success {
  border-color: var(--success);
}

/* Label */
.label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
  letter-spacing: 0.02em;
}
```

---

## 🎬 MICRO-INTERACTIONS

### Animation Tokens

```css
:root {
  --duration-instant: 100ms;
  --duration-fast: 150ms;
  --duration-normal: 200ms;
  --duration-slow: 300ms;
  --duration-slower: 400ms;

  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Hover States

```css
/* Card lift on hover */
.card {
  transition:
    transform var(--duration-normal) var(--ease-out),
    box-shadow var(--duration-normal) var(--ease-out),
    border-color var(--duration-fast) var(--ease-out);
}

.card:hover {
  transform: translateY(-2px);
}

/* Button press feedback */
.button {
  transition:
    transform var(--duration-fast) var(--ease-out),
    background var(--duration-fast) var(--ease-out);
}

.button:active {
  transform: scale(0.98);
}

/* Link underline slide-in */
.link {
  position: relative;
  color: var(--primary-600);
  text-decoration: none;
}

.link::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: currentColor;
  transition: width var(--duration-normal) var(--ease-out);
}

.link:hover::after {
  width: 100%;
}
```

### Loading States

```css
/* Skeleton loader */
.skeleton {
  background: linear-gradient(
    90deg,
    var(--bg-muted) 0%,
    var(--bg-emphasis) 50%,
    var(--bg-muted) 100%
  );
  background-size: 200% 100%;
  animation: skeleton 1.5s ease-in-out infinite;
  border-radius: 4px;
}

@keyframes skeleton {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Spinner */
.spinner {
  border: 3px solid var(--bg-emphasis);
  border-top-color: var(--primary-600);
  border-radius: 50%;
  width: 24px;
  height: 24px;
  animation: spin 600ms linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

---

## 📱 RESPONSIVE DESIGN

### Breakpoints

```css
:root {
  --screen-sm: 640px;   /* Mobile landscape */
  --screen-md: 768px;   /* Tablet portrait */
  --screen-lg: 1024px;  /* Tablet landscape / small laptop */
  --screen-xl: 1280px;  /* Desktop */
  --screen-2xl: 1536px; /* Large desktop */
}
```

### Container

```css
.container {
  width: 100%;
  margin: 0 auto;
  padding: 0 16px;
}

@media (min-width: 640px) {
  .container { max-width: 640px; }
}

@media (min-width: 768px) {
  .container { max-width: 768px; padding: 0 24px; }
}

@media (min-width: 1024px) {
  .container { max-width: 1024px; }
}

@media (min-width: 1280px) {
  .container { max-width: 1280px; padding: 0 32px; }
}
```

### Grid System

```css
.grid {
  display: grid;
  gap: 24px;
}

/* Mobile: 1 column */
.grid { grid-template-columns: 1fr; }

/* Tablet: 2 columns */
@media (min-width: 768px) {
  .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
}

/* Desktop: 3-4 columns */
@media (min-width: 1024px) {
  .grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
  .grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
}
```

### Touch Targets

```css
/* Minimum 44x44px touch targets (iOS standard) */
.touch-target {
  min-height: 44px;
  min-width: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* Buttons */
.btn { height: 44px; }

/* Form inputs */
.input { height: 44px; }

/* Icon buttons */
.icon-button {
  width: 44px;
  height: 44px;
  padding: 0;
}
```

---

## ♿ ACCESSIBILITY

### Focus Indicators

```css
/* Global focus style (WCAG 2.2 compliant) */
*:focus-visible {
  outline: 2px solid var(--primary-600);
  outline-offset: 2px;
  border-radius: 4px;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  *:focus-visible {
    outline-width: 3px;
    outline-offset: 3px;
  }
}
```

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Screen Reader Only

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

---

## 📋 COMPONENT CHECKLIST

### Every Component Must Have:

- [ ] **Hover state** - Visual feedback (150-200ms transition)
- [ ] **Focus state** - WCAG 2.2 compliant outline (2px, 2px offset)
- [ ] **Active state** - Press feedback (scale or color change)
- [ ] **Disabled state** - 0.5 opacity, no hover, cursor not-allowed
- [ ] **Loading state** - Skeleton or spinner
- [ ] **Error state** - Red border, error message
- [ ] **Success state** - Green border, success indicator
- [ ] **Empty state** - Icon + message + action
- [ ] **Responsive behavior** - Mobile, tablet, desktop
- [ ] **Accessibility** - ARIA labels, keyboard nav, screen reader text
- [ ] **Dark mode** - Compatible with dark theme

---

## 🎯 IMPLEMENTATION PRIORITIES

### Phase 1: Fix Critical Issues (Days 1-2)
1. Fix overlapping content (z-index, positioning)
2. Implement text truncation (ellipsis, line-clamp)
3. Add consistent spacing (8pt grid)
4. Fix card alignment (grid system)

### Phase 2: Component Library (Days 3-5)
1. Build new button system (primary, secondary, ghost)
2. Create card component with hover states
3. Design badge system (success, warning, error, info)
4. Rebuild data tables with proper density

### Phase 3: Visual Polish (Days 6-7)
1. Add micro-interactions (hover, focus, active)
2. Implement loading skeletons
3. Add smooth transitions (200ms standard)
4. Enhance shadows and depth

### Phase 4: Responsive + A11y (Day 8)
1. Mobile-first responsive layouts
2. Touch target compliance (44px minimum)
3. Keyboard navigation
4. Screen reader testing

---

**Design System Owner:** SEO Wizard Team
**Last Updated:** 2025-11-01
**Version:** 2.0
**Status:** Ready for implementation ✅
