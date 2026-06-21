# Design System & Palette Specification - Saathi

This specification documents color tokens, typography scales, spacing scales, and border-radius models engineered specifically for visually impaired accessibility.

---

## 1. Design Goals
1. **Professional & Trustworthy:** Clean structures that feel reliable.
2. **Calm & Focused:** Low cognitive load, zero neon or vibrantly distracting elements.
3. **Accessible First:** Exceeding WCAG 2.2 AA, targeting AAA wherever possible.

---

## 2. Color Palette Tokens

We define three core theme palettes tailored for accessibility modes.

### 2.1 Standard Palette (Calm & Elegant Theme)
Designed for Assisted Mode.
- `--bg-primary`: `hsl(215, 25%, 12%)` (Deep Charcoal Blue)
- `--bg-secondary`: `hsl(215, 20%, 18%)` (Darker grey-blue)
- `--text-primary`: `hsl(0, 0%, 98%)` (Warm White)
- `--text-secondary`: `hsl(215, 15%, 75%)` (Muted Steel Blue)
- `--accent`: `hsl(210, 100%, 65%)` (Accessible Sky Blue - Contrast 5.2:1 against bg-primary)
- `--accent-hover`: `hsl(210, 100%, 75%)`
- `--focus-ring`: `hsl(45, 100%, 50%)` (Bright Yellow Focus Indicator)

### 2.2 High Contrast Mode: Dark (Black & Yellow Theme)
Designed for Low-Vision users.
- `--bg-primary`: `#000000` (Pure Black)
- `--bg-secondary`: `#121212` (Flat Charcoal)
- `--text-primary`: `#FFFF00` (Pure Yellow - Contrast 19.5:1)
- `--text-secondary`: `#FFFFFF` (Pure White - Contrast 21:1)
- `--accent`: `#FFFF00` (Pure Yellow)
- `--focus-ring`: `#FFFF00` (Double border, pure yellow)

### 2.3 High Contrast Mode: Light (White & Black Theme)
- `--bg-primary`: `#FFFFFF` (Pure White)
- `--bg-secondary`: `#F3F4F6` (Light grey)
- `--text-primary`: `#000000` (Pure Black - Contrast 21:1)
- `--text-secondary`: `#1F2937` (Dark Charcoal - Contrast 16:1)
- `--accent`: `#0000FF` (Pure Navy Blue - Contrast 8.5:1)
- `--focus-ring`: `#000000` (Pure Black)

---

## 3. Typography Architecture

We use **Atkinson Hyperlegible** as our primary typeface, sourced from Google Fonts, to maximize legibility. If the network is unavailable, the application falls back to **Inter** or standard sans-serif.

### 3.1 Type Scale Configuration
- **Standard Scale:**
  - `font-size-base`: `1.125rem` (18px)
  - `font-size-md`: `1.25rem` (20px)
  - `font-size-lg`: `1.5rem` (24px)
  - `font-size-xl`: `1.875rem` (30px)
  - `font-size-xxl`: `2.25rem` (36px)
- **Low-Vision / Extra Large Scale (200% Zoom Safe):**
  - `font-size-base`: `2.25rem` (36px)
  - `font-size-md`: `2.5rem` (40px)
  - `font-size-lg`: `3rem` (48px)
  - `font-size-xl`: `3.75rem` (60px)
  - `font-size-xxl`: `4.5rem` (72px)

---

## 4. Spacing Scale

Our spacing scale is strictly defined in relative `rem` values to scale proportionally with font size.

- **Base Factor:** `8px` (0.5rem)
- **Token Scale:**
  - `space-1`: `0.25rem` (4px)
  - `space-2`: `0.5rem` (8px)
  - `space-3`: `0.75rem` (12px)
  - `space-4`: `1.0rem` (16px)
  - `space-6`: `1.5rem` (24px)
  - `space-8`: `2.0rem` (32px)
  - `space-12`: `3.0rem` (48px)
  - `space-16`: `4.0rem` (64px)

---

## 5. Border Radius & Components

- **Border Radius:**
  - `--radius-small`: `8px` (0.5rem)
  - `--radius-medium`: `12px` (0.75rem)
  - `--radius-large`: `16px` (1.0rem)
- **Buttons (Interactive targets):**
  - Minimum clickable height: `48px`
  - Minimum clickable width: `48px`
  - Padding: `0.75rem 1.5rem` (vertical/horizontal)

---

## 6. Focus Indicators Rules
- **Rule 1:** Focus rings must always be visible when using keyboard navigation. Do not use `:focus { outline: none; }` unless replacing it with a high-contrast focus ring.
- **Rule 2:** The focus indicator must be a minimum of `3px` thick and stand out significantly from the background (contrast ratio >= 4.5:1).
- **Rule 3:** Maintain focus visual integrity. For custom checkboxes and radio buttons, wrap focus styles on the parent card to visually assist low-vision users.
