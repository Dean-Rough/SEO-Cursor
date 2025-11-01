# Cast-Iron Type System

**Font:** Degular Display (Adobe Fonts)
**Total Styles:** 5
**Letter Spacing:** -0.01em (consistent across all styles)
**Case:** Sentence case (no all caps)

---

## The 5 Type Styles

### TYPE 1: Display Heading
**Usage:** `<h1>` only
**Font:** Degular Display Black (900)
**Size:** 48px
**Line Height:** 1.1
**Letter Spacing:** -0.01em
**Transform:** None (sentence case)

**Example:**
```html
<h1>SEO Wizard</h1>
```

**Output:**
```
SEO Wizard  (48px, black weight)
```

---

### TYPE 2: Section Heading
**Usage:** `<h2>`, `<h3>`
**Font:** Degular Display Bold (700)
**Size:** 24px
**Line Height:** 1.3
**Letter Spacing:** -0.01em
**Transform:** None (sentence case)

**Example:**
```html
<h2>Business name</h2>
<h3>Strategy output</h3>
```

**Output:**
```
Business name  (24px, bold weight)
Strategy output  (24px, bold weight)
```

---

### TYPE 3: Body Text
**Usage:** `<p>`, `<li>`, `<blockquote>`, `<td>`, `<th>`
**Font:** Degular Display Regular (400)
**Size:** 18px
**Line Height:** 1.6
**Letter Spacing:** -0.01em
**Transform:** None

**Example:**
```html
<p>This is body text that provides information.</p>
<li>List item with readable text</li>
```

**Output:**
```
This is body text that provides information.  (18px, regular weight)
• List item with readable text  (18px, regular weight)
```

---

### TYPE 4: Buttons & CTAs
**Usage:** `<button>`, `[role="button"]`, `.btn`
**Font:** Degular Display Bold (700)
**Size:** 18px
**Line Height:** 1.2
**Letter Spacing:** -0.01em
**Transform:** None (sentence case)

**Example:**
```html
<button>Generate strategy</button>
```

**Output:**
```
[ Generate strategy ]  (18px, bold weight)
```

---

### TYPE 5: Inputs & Labels
**Usage:** `<input>`, `<textarea>`, `<select>`, `<label>`
**Font:** Degular Display Regular (400)
**Size:** 16px
**Line Height:** 1.5
**Letter Spacing:** -0.01em
**Transform:** None

**Example:**
```html
<label>Website</label>
<input type="text" placeholder="https://yoursite.com" />
```

**Output:**
```
Website  (16px, regular weight)
[https://yoursite.com]  (16px, regular weight, input field)
```

---

## Utility Override

### Small Text (Use Sparingly)
**Usage:** `<small>`, `.text-sm`, `.text-xs`
**Font:** Degular Display Regular (400)
**Size:** 14px
**Line Height:** 1.5
**Letter Spacing:** -0.01em

**Example:**
```html
<small>Inputs auto-save locally, reset clears everything</small>
```

**Output:**
```
Inputs auto-save locally, reset clears everything  (14px, regular weight)
```

---

## Type Scale Visual

```
┌─────────────────────────────────────────────────────┐
│ Display Heading (h1)                          48px  │
├─────────────────────────────────────────────────────┤
│ Section Heading (h2/h3)               24px          │
├─────────────────────────────────────────────────────┤
│ Body Text (p/li)                      18px          │
├─────────────────────────────────────────────────────┤
│ Buttons (button)                      18px          │
├─────────────────────────────────────────────────────┤
│ Inputs (input/label)                  16px          │
├─────────────────────────────────────────────────────┤
│ Small Text (small)                    14px          │
└─────────────────────────────────────────────────────┘
```

---

## Rules

### ✅ DO
- Use sentence case for everything
- Maintain -0.01em letter spacing
- Stick to the 5 type styles
- Use h1 only once per page
- Use TYPE 3 (18px) for most content
- Use small text (14px) sparingly

### ❌ DON'T
- Use all caps anywhere
- Create custom font sizes
- Mix letter spacing values
- Override font weights outside the system
- Use h1 for subheadings

---

## Implementation

The entire system is defined in `src/app/globals.css`:

```css
/* TYPE 1: Display Heading */
h1 { font-size: 48px; font-weight: 900; }

/* TYPE 2: Section Heading */
h2, h3 { font-size: 24px; font-weight: 700; }

/* TYPE 3: Body Text */
p, li { font-size: 18px; font-weight: 400; }

/* TYPE 4: Buttons */
button { font-size: 18px; font-weight: 700; }

/* TYPE 5: Inputs */
input, label { font-size: 16px; font-weight: 400; }
```

All styles share:
- `font-family: "degular-display", sans-serif`
- `letter-spacing: -0.01em`
- `text-transform: none`

---

## Migration Guide

If you see text that doesn't match the system:

1. **Too small?** → Probably using Tailwind utility classes like `text-sm`
   - Remove the class, let base styles apply

2. **All caps?** → Check for `uppercase` classes or inline styles
   - Remove `text-uppercase` or `uppercase` classes

3. **Wrong size?** → Check for inline `style` attributes or Tailwind size classes
   - Remove `text-xl`, `text-2xl`, etc.
   - Use semantic HTML instead (h1, h2, p, etc.)

4. **Weird spacing?** → Check for custom `letter-spacing`
   - Remove any custom letter-spacing
   - Let `-0.01em` apply globally

---

## Examples in Context

### Form Field
```html
<div>
  <label>Business name</label>     <!-- TYPE 5: 16px -->
  <input type="text" />            <!-- TYPE 5: 16px -->
</div>
```

### Card Header
```html
<div>
  <h2>Keyword energy</h2>          <!-- TYPE 2: 24px -->
  <p>83%</p>                       <!-- TYPE 3: 18px -->
</div>
```

### Button Group
```html
<button>Generate strategy</button>    <!-- TYPE 4: 18px -->
<button>Reset</button>               <!-- TYPE 4: 18px -->
```

### Page Title
```html
<h1>SEO Wizard</h1>                <!-- TYPE 1: 48px -->
<p>Personal complete...</p>         <!-- TYPE 3: 18px -->
```

---

**Last Updated:** 2025-10-31
**Version:** 1.0
**Status:** ✅ Cast-iron, locked in
