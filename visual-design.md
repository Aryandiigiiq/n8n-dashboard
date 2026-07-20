# DigiIQ Web Application: Visual Design System

This document provides a comprehensive, pixel-perfect specification of the visual design system of the **DigiIQ Website**. It details every design token, style, component, layout structure, color, gradient, animation, and responsive breakpoint. By following this guide, another developer can reproduce the exact visual appearance of the DigiIQ website down to the individual pixel.

---

## Table of Contents
1. [Design Tokens & Scales](#1-design-tokens--scales)
2. [Color System Spec](#2-color-system-spec)
3. [Typography Spec](#3-typography-spec)
4. [Gradients Spec](#4-gradients-spec)
5. [Global Layout & Page Spec](#5-global-layout--page-spec)
6. [Navigation Spec](#6-navigation-spec)
7. [Reusable Components Spec](#7-reusable-components-spec)
8. [Buttons & Inputs Spec](#8-buttons--inputs-spec)
9. [Motion & Animation Spec](#9-motion--animation-spec)
10. [Media & Image Mask Spec](#10-media--image-mask-spec)
11. [Design Recreation Guide](#11-design-recreation-guide)

---

## 1. Design Tokens & Scales

Defined globally inside [tokens.css](file:///c:/Users/aryan/OneDrive/Desktop/DIGIiq/WORK/digiiq/digiiq-website/src/styles/tokens.css) under the `:root` scope, these tokens govern every dimension, space, border, and timing rule on the website.

### Spacing Scale
The spacing scale is built to establish visual rhythm. It uses absolute pixel spacing for smaller utility gaps, and fluid spacing for section layouts.

| CSS Variable | Value | Purpose |
| :--- | :--- | :--- |
| `--space-1` | `4px` | Tiny micro-alignments, minor borders |
| `--space-2` | `8px` | Small gaps, label-to-input spacing, icon padding |
| `--space-3` | `14px` | Default gap between metadata, avatar list items, grid margins |
| `--space-4` | `20px` | Layout gaps, button row spaces, list element margins |
| `--space-5` | `28px` | Card internal padding, outer margin for labels |
| `--space-6` | `40px` | Outer block gaps, grid column gaps, large panel padding |
| `--space-7` | `64px` | Massive spacing, section title gaps, offset paddings |
| `--space-8` | `96px` | Extreme layout gaps, bottom page paddings |
| `--space-section` | `clamp(72px, 9vw, 128px)` | Fluid padding applied vertically to sections |
| `--gutter` | `clamp(20px, 4vw, 80px)` | Fluid horizontal gutters on container wrappers |
| `--page-max` | `1280px` | Maximum layout width for desktop page containers |

### Radius Scale
The corner roundness uses custom tokens to maintain a high-end, premium aesthetic. Buttons and cards feature soft, tailored corners.

| CSS Variable | Value | Purpose |
| :--- | :--- | :--- |
| `--radius-sm` | `5px` | Extremely minor inputs or badge elements |
| `--radius-md` | `13px` | Standard buttons (secondary/outline) and testimonial cards |
| `--radius-btn` | `16px` | Gradient buttons and standard form interactive items |
| `--radius-card` | `18px` | Use Case cards, career cards, video showcase cards |
| `--radius-lg` | `25px` | Solutions Accordion panels, Blog hero images, Case Study cards |
| `--radius-pill` | `30px` | Pill buttons, outline button default states |
| `--radius-footer` | `36px` | Rounded footer top-outer corners |

### Shadow Scale
Shadows use low-opacity dark blues (`--color-navy`) to prevent muddy, generic black shadows.

| CSS Variable | Value | Target Usage |
| :--- | :--- | :--- |
| `--shadow-card` | `0 4px 18px rgba(7, 14, 29, 0.1)` | White cards (testimonials, careers, blogs) |
| `--shadow-glass` | `0 4px 18px rgba(0, 0, 0, 0.28)` | Fixed navigation header, floating controls |
| `--shadow-btn-hover` | `0 10px 24px rgba(8, 114, 252, 0.35)`| Primary buttons on hover states |

### Z-Index Scale
Depth layers are kept clean and simple:

| CSS Variable | Value | Usage |
| :--- | :--- | :--- |
| `--z-nav` | `50` | Fixed navigation bar and drop-down structures |
| `--z-modal` | `80` | Full-screen video modal overlays and dialog portals |

---

## 2. Color System Spec

DigiIQ utilizes a sleek, dark-themed navy palette combined with high-contrast elements for public surfaces, and dynamically switches styling depending on the section's background theme.

### Color Palette

| Name | HEX | RGB | HSL | Variable | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Navy Dark** | `#070e1d` | `7, 14, 29` | `219, 61%, 7%` | `--color-navy` | Main layout dark background |
| **Navy Deep** | `#0a1426` | `10, 20, 38` | `219, 58%, 9%` | `--color-navy-2` | Dark container backgrounds, card slots |
| **Primary Blue** | `#0872fc` | `8, 114, 252` | `214, 97%, 51%` | `--color-primary` | Accent color, text links, button gradients |
| **Deep Blue** | `#11489d` | `17, 72, 157` | `216, 80%, 34%` | `--color-primary-deep`| Dark button gradient end, glowing spots |
| **Accent Blue** | `#3083ef` | `48, 131, 239` | `214, 86%, 56%` | `--color-accent` | Category tag lines, eyebrows, light borders |
| **Pure White** | `#ffffff` | `255, 255, 255`| `0, 0%, 100%` | `--color-white` | Light section backgrounds, high-contrast text |

### Text Colors

| Selector Variable | HSL/RGB/HEX value | Applied On | Opacity |
| :--- | :--- | :--- | :--- |
| `--text-heading` | `#1a1a2e` | Main titles on light surfaces | `1.0` |
| `--text-body` | `#6b7280` | Body paragraphs on light surfaces | `1.0` |
| `--text-meta` | `#9ca3af` | Secondary details, dates, captions | `1.0` |
| `--text-on-dark` | `#ffffff` | Titles and headings on dark surfaces | `1.0` |
| `--text-on-dark-body`| `rgba(255, 255, 255, 0.84)`| Main copy paragraphs on dark surfaces | `0.84` |
| `--text-on-dark-muted`| `rgba(255, 255, 255, 0.48)`| Subtitles, indicators, secondary texts | `0.48` |
| `--text-on-dark-soft`| `rgba(233, 235, 248, 0.56)`| Paragraph block descriptions on dark areas| `0.56` |

### Border & Divider Colors

| CSS Variable | Color / Opacity | Purpose |
| :--- | :--- | :--- |
| `--border-hairline` | `rgba(142, 152, 168, 0.5)` | Thin lines for dividers and job list layouts |
| `--border-card` | `rgba(142, 152, 168, 0.77)` | Default card border for light templates |
| `--border-card-light`| `rgba(102, 110, 122, 0.35)`| Soft border for accordion panels, input outlines |
| `--border-on-dark` | `rgba(255, 255, 255, 0.18)` | Subtle border around media blocks inside dark backgrounds |
| `--divider-light` | `#f3f4f6` | Clean borders inside light cards and list blocks |
| `--line-light` | `rgba(7, 14, 29, 0.06)` | Light gridlines background overlays |
| `--line-dark` | `rgba(255, 255, 255, 0.07)`| Dark gridlines background overlays |

### Glassmorphic Colors
These styles are loaded for navigation panels and floating interface blocks.

| CSS Variable | Color / Filter | Purpose |
| :--- | :--- | :--- |
| `--glass-bg` | `rgba(255, 253, 253, 0.62)` | Light-themed header glass block |
| `--glass-bg-ondark` | `rgba(16, 26, 48, 0.45)` | Dark-themed header glass block |
| `--glass-border` | `rgba(0, 0, 0, 0.09)` | Light-themed glass border line |
| `--glass-border-ondark`| `rgba(255, 255, 255, 0.12)`| Dark-themed glass border line |
| `--glass-blur` | `16px` | Backdrop filter blur radius |
| `--glass-saturate` | `1.5` | Color saturation multiplier |
| `--glass-filter` | `blur(16px) saturate(1.5)`| Ready-made backdrop filter value |

### UI Status & Hover Colors

| Action | Target Item | Output Color | Effect |
| :--- | :--- | :--- | :--- |
| **Focus outline** | `:focus-visible` | `3px solid var(--color-primary)` | Outline offset of `2px` |
| **Active button shadow**| `.gradient:hover` | `var(--shadow-btn-hover)` | Intense blue shadow drop |
| **Interactive card transform**| `.card:hover` | `translateY(-4px)` | Elevation shift |
| **Form error** | `.error` | `#c0362c` | Crimson red text |
| **Star Rating** | `.stars` | `#f0b429` | Golden-yellow glyph color |

---

## 3. Typography Spec

The typeface uses custom font definitions loaded inside [layout.tsx](file:///c:/Users/aryan/OneDrive/Desktop/DIGIiq/WORK/digiiq/digiiq-website/src/app/(frontend)/layout.tsx).

- **Display (Headings & Eyebrows):** `Inter`, fallback to `'Helvetica Neue', Arial, sans-serif`. Registered under `--font-display`.
- **Text (Copy & Labels):** `Montserrat`, fallback to `'Helvetica Neue', Arial, sans-serif`. Registered under `--font-text`.

### Fluid Typography Scales
Fluid font sizes adapt dynamically to the screen viewport via standard CSS `clamp` equations.

| Scale Variable | Equation | Mobile Size (approx) | Desktop Size (approx) |
| :--- | :--- | :--- | :--- |
| `--text--1` | `clamp(0.78rem, 0.76rem + 0.09vw, 0.84rem)` | `12.5px` | `13.5px` |
| `--text-0` | `clamp(0.95rem, 0.91rem + 0.18vw, 1.075rem)`| `15.2px` | `17.2px` |
| `--text-1` | `clamp(1.05rem, 0.99rem + 0.27vw, 1.24rem)` | `16.8px` | `19.8px` |
| `--text-2` | `clamp(1.12rem, 1.06rem + 0.28vw, 1.32rem)` | `18.0px` | `21.1px` |
| `--text-3` | `clamp(1.25rem, 1.16rem + 0.45vw, 1.56rem)` | `20.0px` | `25.0px` |
| `--text-4` | `clamp(1.9rem, 1.59rem + 1.57vw, 3rem)` | `30.4px` | `48.0px` |
| `--text-5` | `clamp(2.5rem, 2.01rem + 2.43vw, 4.2rem)` | `40.0px` | `67.2px` |
| `--text-6` | `clamp(3.4rem, 2.66rem + 3.71vw, 6rem)` | `54.4px` | `96.0px` |

### Typography Application Spec

```css
/* Eyebrow Style */
.eyebrow {
  font-family: var(--font-display);
  font-size: var(--text--1);
  font-weight: 500;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--color-accent);
}

/* Page Heading 1 */
h1 {
  font-family: var(--font-display);
  font-size: var(--text-5);
  font-weight: 700;
  line-height: 1.08;
  letter-spacing: -0.02em;
  text-wrap: balance;
}

/* Section Heading 2 */
h2 {
  font-family: var(--font-display);
  font-size: var(--text-4);
  font-weight: 600;
  line-height: 1.12;
  text-wrap: balance;
}

/* Sub-headings 3 */
h3 {
  font-family: var(--font-display);
  font-size: var(--text-3);
  font-weight: 600;
  text-wrap: balance;
}

/* Body / Lede Copy */
.lede {
  font-family: var(--font-text);
  font-size: var(--text-2);
  line-height: 1.5;
  color: var(--text-body);
}

/* Meta Text / Captions */
.meta {
  font-family: var(--font-text);
  font-size: var(--text--1);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--text-meta);
}
```

---

## 4. Gradients Spec

Gradients give the user interface a rich, modern glossmorphic overlay.

### Gradient Map
- **Button Background:** `--gradient-button`
  - **Direction:** `90deg` (horizontal)
  - **Stops:** `#0872fc` (0%) to `#11489d` (100%)
  - **CSS Value:** `linear-gradient(90deg, #0872fc, #11489d)`
  - **Usage:** Standard primary button backgrounds, default avatars.
- **Headline Text Highlights:** `--gradient-text`
  - **Direction:** `180deg` (vertical top-to-bottom)
  - **Stops:** `#4da3ff` (0%) to `#0872fc` (100%)
  - **CSS Value:** `linear-gradient(180deg, #4da3ff, #0872fc)`
  - **Usage:** Custom highlight spans inside primary page `h1` titles.
- **Quote Mark Icon/Glyph:** `--gradient-quote`
  - **Direction:** `90deg` (horizontal)
  - **Stops:** `#c084fc` (0%) to `#f87171` (100%)
  - **CSS Value:** `linear-gradient(90deg, #c084fc, #f87171)`
  - **Usage:** The large double quotes (`&rdquo;`) displayed at the footer of testimonials.

---

## 5. Global Layout & Page Spec

### Main Wrap & Containment
All pages use a centered structural wrapper (`.wrap`) to align content limits.

- **Standard Wrapper Width:** Max-width `1280px` (`var(--page-max)`).
- **Narrow Wrapper Width:** Max-width `760px` (used for prose layouts, legal content, single details, and career applications).
- **Horizontal Paddings:** `0 var(--gutter)` where `--gutter` is `clamp(20px, 4vw, 80px)`.
- **Top Margin spacing:** Main pages utilize a padding offset to account for the floating navigation header:
  `padding: clamp(96px, 12vw, 160px) 0 var(--space-section);`
- **Breakpoints (Media Queries):**
  - **Desktop / Wide:** Width > `1200px`
  - **Small Desktop / Laptop:** Width `900px` to `1200px`
  - **Tablet:** Width `640px` to `900px`
  - **Mobile:** Width < `640px`

### Layout Grid Spec
DigiIQ utilizes CSS grid layouts for listing surfaces.

1. **Standard 3-Column Card Grid** (Case Studies, Blogs, Use Cases):
   - **Properties:**
     ```css
     display: grid;
     grid-template-columns: repeat(3, 1fr);
     gap: clamp(20px, 2.4vw, 32px);
     ```
   - **Tablet Breakpoint (`max-width: 900px`):** Drops to `grid-template-columns: 1fr 1fr;`.
   - **Mobile Breakpoint (`max-width: 600px`):** Drops to `grid-template-columns: 1fr;`.
2. **Case Study Grid Component:**
   - Alternate layout rules. Features a span class `.wide`:
     ```css
     .cell.wide { grid-column: span 2; }
     ```
   - Wide cell is applied using an index multiplier `i % 3 === 0` to create an asymmetrical visual pattern.
   - **Tablet Breakpoint (`max-width: 1024px`):** Wide cell still spans 2.
   - **Mobile Breakpoint (`max-width: 640px`):** Wide cell is overridden to `grid-column: auto;` to fit single-column layouts.

---

## 6. Navigation Spec

### Floating Navigation Header ([Header.tsx](file:///c:/Users/aryan/OneDrive/Desktop/DIGIiq/WORK/digiiq/digiiq-website/src/components/layout/Header.tsx))
Floating, glassmorphic navbar anchored at the top of the viewport.

- **Placement Structure:** Fixed wrapper at `top: 14px`, `left: 0`, `right: 0`, `z-index: 50`. Centered container with `padding: 0 16px`.
- **Container Sizing:** `width: min(1180px, 100%)` with a border radius of `23px`.
- **Background Styling (Dark theme default):** Background is `rgba(16, 26, 48, 0.45)` with `backdrop-filter: blur(16px) saturate(1.5)`. Border is `1px solid rgba(255, 255, 255, 0.12)`.
- **Interactive Light/Dark Adaptation:**
  - A scroll script runs `document.elementFromPoint(innerWidth / 2, 90)` at runtime.
  - If the header is floating over a light section (not containing `[data-theme-dark]` or `footer`), it adds the `.onLight` class.
  - **`.onLight` styles:** Background changes to `rgba(255, 253, 253, 0.62)`, border changes to `rgba(0, 0, 0, 0.09)`, text color changes to `#1a1a2e`. Logo image filter switches from `brightness(0) invert(1)` to `brightness(0)`.
- **Desktop Dropdown Subpanels:**
  - Placed at `top: calc(100% + 16px)` and translated slightly downward: `transform: translate(-50%, 8px)`.
  - Min-width of `250px`, padding of `10px`, border radius `16px`.
  - Background is `rgba(10, 17, 33, 0.88)` with a dark glass border and drop shadow `0 12px 32px rgba(0, 0, 0, 0.35)`.
  - Triggers on hover. On open, translates to `translate(-50%, 0)` with opacity shifting from `0` to `1`.
- **Mobile Menu (`max-width: 900px`):**
  - Desktop links are hidden. A two-bar burger menu trigger (`width: 40px`, `height: 40px`, `radius: 12px`) is displayed.
  - Span bars transition top positions to `19px` and rotate `45deg` / `-45deg` to create an 'X' close indicator.
  - The menu panel (`.mnav`) displays below the header at `margin-top: 8px`.
  - Max-height transitions from `0` to `min(560px, calc(100dvh - 100px))`, with opacity shifting from `0` to `1`. Background is solid `rgba(10, 17, 33, 0.92)` with no backdrop blur for touch performance.

### Site Footer ([Footer.tsx](file:///c:/Users/aryan/OneDrive/Desktop/DIGIiq/WORK/digiiq/digiiq-website/src/components/layout/Footer.tsx))
- **Structure:** Dark navy background with custom border lines `1px solid rgba(255, 255, 255, 0.14)`.
- **Layout Grid:** `grid-template-columns: repeat(4, 1fr)` for column links, changing to `1fr 1fr` on tablet, and `1fr` on mobile.
- **Top Corner Rounding:** `border-radius: var(--radius-footer)` (36px) applied to outer parent containers.
- **Hover Transitions:** Links switch colors from `rgba(255, 255, 255, 0.85)` to `#ffffff` with a clean text-underline-offset transition of `5px`.

---

## 7. Reusable Components Spec

### Solutions Accordion ([Accordion.tsx](file:///c:/Users/aryan/OneDrive/Desktop/DIGIiq/WORK/digiiq/digiiq-website/src/blocks/SolutionsAccordion/Accordion.tsx))
An interactive accordion page section that resizes containers horizontally on desktop and stack vertically on mobile.

- **Desktop View (`width > 900px`):**
  - Accordion block `.acc` is set to `display: flex`, height `clamp(420px, 44vw, 580px)`.
  - Panels have `flex: 1` width, overflow hidden, background `#070e1d`.
  - Transition rule: `flex 0.65s cubic-bezier(0.22, 1, 0.36, 1)`.
  - Active panels expand dynamically to `flex: 3.1`.
  - Inactive panels display vertical title strings (`writing-mode: vertical-rl; rotate: 180deg`) centered near the bottom edge.
  - Active panel reveals absolute-positioned details container (`inset: auto 0 0 0`, padding `30px 32px`), transitioning in with a delay of `0.28s`.
- **Tablet / Mobile View (`width <= 900px`):**
  - Panel wrapper shifts to `flex-direction: column`.
  - Inactive panels have a static height of `78px` (`76px` below `560px`).
  - Active panels expand to `min-height: clamp(330px, 88vw, 380px)`.
  - Index and Title are placed horizontally near the top: `writing-mode: horizontal-tb`, `top: 22px`, `left: 84px`.
  - Active details container is offset: `inset: 86px 0 0 0`, padding `0 24px 24px`.
- **Sub-pillars inside Panel:**
  - Styled as tags: padding `9px 15px`, border-radius `11px`, background `rgba(255, 255, 255, 0.12)`, border `1px solid rgba(255, 255, 255, 0.22)`.
  - Hover background expands to `rgba(255, 255, 255, 0.22)` with border changing to `rgba(255, 255, 255, 0.5)`.

### Testimonial Card ([TestimonialSlider.tsx](file:///c:/Users/aryan/OneDrive/Desktop/DIGIiq/WORK/digiiq/digiiq-website/src/blocks/TestimonialSlider/Component.tsx))
Cards organized in scrolling tracks.

- **Dimensions:** Fixed horizontal card sizing of `width: min(460px, 82vw)`.
- **Card container:** Background `#ffffff`, border `1px solid rgba(102, 110, 122, 0.35)`, border-radius `13px` (`--radius-md`).
- **Card shadow:** Drops `--shadow-card` (`0 4px 18px rgba(7, 14, 29, 0.1)`).
- **Hover interaction:** Card shifts upward and right: `transform: translate(3px, -3px)`, and drop shadow deepens to `0 10px 26px rgba(7, 14, 29, 0.14)`.
- **Card Divider:** A line `1px solid #f3f4f6` spans the width of the card.
- **Avatar:** Circular avatar (`50px` x `50px`, `radius: 50%`). Fallback text placeholder features `--gradient-button` background.
- **Decorations:** Footer renders a double quote icon (`&rdquo;`) using the `--gradient-quote` linear-gradient text clip.

### Video Card ([VideoCard.tsx](file:///c:/Users/aryan/OneDrive/Desktop/DIGIiq/WORK/digiiq/digiiq-website/src/blocks/VideoShowcase/VideoCard.tsx))
A component serving video thumbnails with micro-interactive play triggers.

- **Thumb Frame:** Aspect ratio `16 / 10`, border radius `18px`, background `#070e1d`.
- **Glass Play Button overlay:**
  - Circle dimensions: `72px` x `72px`, absolute position `left: 18px`, `bottom: 18px`.
  - Background is translucent white `rgba(255, 255, 255, 0.18)` with `backdrop-filter: blur(7px) saturate(1.3)`.
  - Center white core: `::before` pseudo-element with `44px` x `44px` dimension, border radius `50%`.
  - Center Play Arrow: `::after` pseudo-element creating a triangle shape (`border-left: 15px solid var(--color-navy)`, transparent top/bottom).
  - Hover: Thumb hover scales the glass circle: `transform: scale(1.08)`.

### Skeleton Loader ([Skeleton.tsx](file:///c:/Users/aryan/OneDrive/Desktop/DIGIiq/WORK/digiiq/digiiq-website/src/components/ui/Skeleton.tsx))
- **Design:** Displays a diagonal repeating pattern with animated shimmer overlays.
- **Background gradient:**
  ```css
  background: repeating-linear-gradient(
    45deg,
    rgba(142, 152, 168, 0.14) 0 12px,
    rgba(142, 152, 168, 0.07) 12px 24px
  ), #e9ebf0;
  ```
- **Animation:** `shimmer 1.6s var(--ease-out) infinite` moving `background-position` from `100% 0` to `-100% 0`.
- **Variants:**
  - `.bar`: height `1em`, border radius `6px`.
  - `.media`: aspect-ratio `16 / 9`, border-radius `18px`.
  - `.avatar`: circular `52px` x `52px`, `radius: 50%`.

---

## 8. Buttons & Inputs Spec

### Buttons
All buttons use the custom `.sbtn` class which supports text rolling transitions.

- **Text Roll Transition:**
  - Label text wraps inside an `.inner` span with `overflow: hidden`.
  - It contains a normal label `.lbl` and a duplicate absolute label `.dup` initialized at `transform: translateY(130%)`.
  - On hover, both elements slide up: `.lbl` translates to `translateY(-130%)` and `.dup` translates to `translateY(0)` with a duration of `0.45s` (`--duration-base`) and `--ease-out` easing.
- **Button Sizing:** Padding `13px 26px`, font weight 500, size `var(--text-0)`.

#### Button Variations

```css
/* 1. Primary Gradient */
.gradient {
  background: var(--gradient-button);
  color: var(--color-white);
  border-radius: var(--radius-btn); /* 16px */
}
.gradient:hover {
  box-shadow: var(--shadow-btn-hover); /* 0 10px 24px rgba(8, 114, 252, 0.35) */
  transform: translateY(-1px);
}

/* 2. Light Theme Button */
.light {
  background: var(--color-white);
  color: var(--color-navy);
  border-radius: var(--radius-pill); /* 30px */
}

/* 3. Dark Theme Button */
.dark {
  background: var(--color-navy);
  color: var(--color-white);
  border-radius: var(--radius-pill);
}

/* 4. Outline Button */
.outline {
  background: transparent;
  border: 1px solid rgba(207, 218, 238, 0.55);
  color: var(--color-white);
  border-radius: var(--radius-pill);
}
.outline:hover {
  border-color: rgba(207, 218, 238, 0.9);
}
```

### Form Inputs ([forms.module.css](file:///c:/Users/aryan/OneDrive/Desktop/DIGIiq/WORK/digiiq/digiiq-website/src/components/forms/forms.module.css))
Clean input columns aligned using `--radius-md` curves.

- **Wrapper:** Flex columns with a gap of `18px`, max-width `520px` (or `760px` in narrow layouts).
- **Labels:** `font-size: 0.82rem`, `font-weight: 600`, color `var(--text-heading)`, letter-spacing `0.01em`, padding bottom `7px`.
- **Inputs & Textareas:**
  - Width `100%`, background `#ffffff`, border `1px solid rgba(102, 110, 122, 0.35)`, border-radius `13px` (`--radius-md`).
  - Vertical padding: `12px 14px` (`10px 14px` for file pickers).
  - Focus state: `outline: none`, transition border-color to `var(--color-primary)` (`#0872fc`) at `0.25s` speed.
  - Textarea: `min-height: 120px` with vertical resize.
- **Submit Buttons:** Form action submits use solid `.submit` styles:
  - Background `var(--gradient-button)`, border-radius `16px`, padding `14px 28px`, font size `0.98rem`, font weight 600. On hover, triggers `--shadow-btn-hover`.

---

## 9. Motion & Animation Spec

The interface utilizes motion transitions defined by three custom easing curves:
- **Default Ease Out:** `cubic-bezier(0.22, 1, 0.36, 1)` (`--ease-out`)
- **Underline Drawing Ease:** `cubic-bezier(0.85, 0, 0, 1)` (`--ease-draw`)
- **Glass Transition Ease:** `cubic-bezier(0.165, 0.84, 0.44, 1)` (`--ease-glass`)

### Ambient / Page Scroll Motion Spec

1. **Velocity Marquee Component ([ScrollVelocityMarquee.tsx](file:///c:/Users/aryan/OneDrive/Desktop/DIGIiq/WORK/digiiq/digiiq-website/src/components/motion/ScrollVelocityMarquee.tsx)):**
   - High-performance, pointer-draggable loops driven by requestAnimationFrame.
   - Features momentum matching page scroll velocity:
     `const velFactor = Math.min(Math.abs(smoothV) / 120, 8)`
   - Hover slows down tracking velocity by 70% (`hoverFactor = 0.3`).
   - Translates on the active axis (`translate3d(${-pos}px,0,0)` on X or `translate3d(0,${-pos}px,0)` on Y).
   - Wraps around when it exceeds the half-width threshold.
2. **Ambient Glowing Nodes:**
   - Backgrounds display slow floating blurred glow bubbles (radial gradients) positioned absolutely.
   - Triggers `Drift` animation wrapper (translates `y` from `-amplitude` to `amplitude` infinitely in a mirror timeline: `repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut'`).
3. **Viewport Entry Reveal ([Reveal.tsx](file:///c:/Users/aryan/OneDrive/Desktop/DIGIiq/WORK/digiiq/digiiq-website/src/components/motion/Reveal.tsx)):**
   - Content blocks load with custom viewport entry triggers.
   - Default transition translates `y` from `26px` to `0px` and shifts opacity from `0` to `1` with a duration of `0.7s` and `--ease-out` curves. Triggers once 25% of the element is in view.
4. **Stagger Group reveal ([Stagger.tsx](file:///c:/Users/aryan/OneDrive/Desktop/DIGIiq/WORK/digiiq/digiiq-website/src/components/motion/Stagger.tsx)):**
   - Stagger group coordinates animation entries of child `StaggerItem` modules.
   - Triggers item renders with a stagger step delay of `0.1s` and parent container build-up delay of `0.05s`.

---

## 10. Media & Image Mask Spec

To match the rich aesthetics, media components are layered with opacity gradients and blending masks.

- **Marquee Track Masks:** Fade edges horizontally using CSS mask-image:
  ```css
  mask-image: linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent);
  ```
- **Hero Wall Fade-out:** Columns of vertical marquees fade toward top and bottom edges:
  ```css
  mask-image: linear-gradient(180deg, transparent 0%, #000 14%, #000 86%, transparent 100%);
  ```
- **Blueprint Grid Overlay:** The CTA background renders a custom repeating blueprint block utilizing a background SVG image. Top and bottom margins fade using a gradient mask:
  ```css
  mask-image: linear-gradient(180deg, transparent, #000 12%, #000 88%, transparent);
  ```
- **Spotlight Footer Logo ([WordmarkLight.tsx](file:///c:/Users/aryan/OneDrive/Desktop/DIGIiq/WORK/digiiq/digiiq-website/src/components/motion/WordmarkLight.tsx)):**
  - Footer displays the large brand wordmark text `DIGIIQ` which expands across the screen width.
  - Text has transparent fill clipped to show a noisy background (#1c2c4e + SVG noise pattern):
    ```css
    color: transparent;
    -webkit-text-fill-color: transparent;
    background-color: #1c2c4e;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.6'/%3E%3C/svg%3E");
    -webkit-background-clip: text;
    background-clip: text;
    ```
  - An interactive mouse tracker applies a dynamic spotlight radial-gradient mask on the wordmark container:
    ```js
    const reveal = `radial-gradient(circle 460px at ${pos.x}px ${pos.y}px, rgba(0,0,0,0.95), rgba(0,0,0,0.38) 55%, transparent 78%)`
    ```
    This reveals the logo texture beneath a soft "flashlight" beam as the user moves their mouse.

---

## 11. Design Recreation Guide

Follow these steps to replicate the visual appearance of the DigiIQ website in another project without copying any business logic.

### Step 1: Initialize Global Tokens
Create a global CSS stylesheet (e.g. `tokens.css`) and copy the variables from [Section 1](#1-design-tokens--scales), [Section 2](#2-color-system-spec), and [Section 3](#3-typography-spec) into the `:root` scope.

### Step 2: Global Resets
Implement a global reset script inside your main styling entry:
```css
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
html {
  scroll-behavior: smooth;
  -webkit-font-smoothing: antialiased;
}
body {
  font-family: var(--font-text), sans-serif;
  font-size: var(--text-0);
  line-height: 1.5;
  color: var(--text-heading);
  background: var(--color-white);
  overflow-x: hidden;
}
h1, h2, h3, h4 {
  font-family: var(--font-display), sans-serif;
  text-wrap: balance;
}
a {
  color: inherit;
}
:focus-visible {
  outline: 3px solid var(--color-primary);
  outline-offset: 2px;
}
```

### Step 3: Implement Reusable Buttons (`.sbtn`)
Construct a text sliding roll-up component based on the button specification:
- HTML Structure:
  ```html
  <a class="sbtn gradient" href="#">
    <span class="inner">
      <span class="lbl">Label Text</span>
      <span class="lbl dup" aria-hidden="true">Label Text</span>
    </span>
  </a>
  ```
- CSS styling matches [Section 8](#buttons).

### Step 4: Set up structural wrapper grids
Construct page layout wrappers based on the wrapper system:
- **Standard Width Container:** Max width `1280px` (`var(--page-max)`), margins `0 auto`, horizontal padding `var(--gutter)`.
- **Prose Content Wrapper:** Max width `760px` (`.narrow`), margins `0 auto`.
- Apply standard grids matching [Section 5](#5-global-layout--page-spec).

### Step 5: Recreate page components
- Rebuild the **Solutions Accordion** using the flex expansion rules (`flex 0.65s` transitions) and the mobile stack adjustments described in [Section 7](#solutions-accordion-accordiontsx).
- Rebuild the **Spotlight footer wordmark** using the CSS mask values described in [Section 10](#spotlight-footer-logo-wordmarklighttsx).
- Implement the glassmorphic fixed header matching [Section 6](#floating-navigation-header-headerttsx), including the auto-theme scroll detection script.

---

## 12. Page Construction Templates

When creating new pages, you should use the following layout templates to match the visual system. These use Next.js, React 19, and CSS Modules.

### 12.1 Standard Listing Page (e.g., Blog Index, Careers list, Case Studies)

Used when presenting a header (eyebrow, title, lede) followed by a grid of visual content cards.

#### TSX Structure (`page.tsx`)
```tsx
import Image from 'next/image'
import Link from 'next/link'
import styles from './styles.module.css'

export default function ListingPage() {
  const items = [
    { id: 1, title: 'Example Title', category: 'Design', excerpt: 'Excerpt snippet...', image: '/media/thumb1.jpg', slug: 'item-1' }
  ]

  return (
    <section className={styles.page}>
      {/* 1. Page Header Block */}
      <div className={`${styles.wrap} ${styles.narrow}`}>
        <p className={styles.eyebrow}>Browse Work</p>
        <h1 className={styles.title}>Outcomes, not slides</h1>
        <p className={styles.lede}>
          Explore the results and platforms we have built for our partners.
        </p>
      </div>

      {/* 2. Grid Card Block */}
      <div className={styles.wrap}>
        <div className={styles.grid}>
          {items.map((item) => (
            <Link key={item.id} className={styles.card} href={`/work/${item.slug}`}>
              {/* Card Media aspect ratio 16/10 */}
              <div className={styles.cardMedia}>
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="(max-width: 900px) 100vw, 33vw"
                  style={{ objectFit: 'cover' }}
                />
              </div>
              
              {/* Card Body spacing */}
              <div className={styles.cardBody}>
                <p className={styles.cardMeta}>{item.category}</p>
                <h2 className={styles.cardTitle}>{item.title}</h2>
                <p className={styles.cardExcerpt}>{item.excerpt}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
```

#### CSS Module (`styles.module.css`)
```css
.page {
  /* Dynamic offset top padding for the floating navigation header */
  padding: clamp(96px, 12vw, 160px) 0 var(--space-section);
}

.wrap {
  max-width: var(--page-max); /* 1280px */
  margin: 0 auto;
  padding: 0 var(--gutter); /* clamp(20px, 4vw, 80px) */
}

.narrow {
  max-width: 760px;
}

.eyebrow {
  font-family: var(--font-display), Arial, sans-serif;
  font-size: var(--text--1);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--color-accent); /* #3083ef */
  font-weight: 500;
}

.title {
  font-size: var(--text-5);
  font-weight: 650;
  line-height: 1.08;
  letter-spacing: -0.02em;
  margin-top: 16px;
}

.lede {
  font-size: var(--text-2);
  color: var(--text-body); /* #6b7280 */
  line-height: 1.5;
  margin-top: 20px;
  max-width: 44em;
}

/* 3-Column Visual Grid Layout */
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: clamp(20px, 2.4vw, 32px);
  margin-top: clamp(40px, 5vw, 64px);
}

/* Card Visual System */
.card {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-hairline); /* rgba(142, 152, 168, 0.5) */
  border-radius: var(--radius-card); /* 18px */
  overflow: hidden;
  background: var(--color-white);
  text-decoration: none;
  color: inherit;
  transition:
    transform var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-fast) var(--ease-out);
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-card); /* 0 4px 18px rgba(7, 14, 29, 0.1) */
}

.cardMedia {
  position: relative;
  aspect-ratio: 16 / 10;
  background: var(--divider-light); /* #f3f4f6 */
}

.cardBody {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: clamp(18px, 2vw, 26px);
}

.cardMeta {
  font-size: var(--text--1);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--text-meta); /* #9ca3af */
}

.cardTitle {
  font-size: var(--text-3);
  font-weight: 600;
  line-height: 1.2;
}

.cardExcerpt {
  color: var(--text-body);
  font-size: 0.95rem;
  line-height: 1.5;
}

@media (max-width: 900px) {
  .grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 600px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
```

---

### 12.2 Prose / Article Detail Page (e.g., Blog Post, Case Study Detail)

Used when rendering content columns, headings, code fragments, quotes, and full-bleed hero assets.

#### TSX Structure (`page.tsx`)
```tsx
import Image from 'next/image'
import { RichText } from '@payloadcms/richtext-lexical/react'
import styles from './styles.module.css'

export default function ArticlePage() {
  const post = {
    title: 'The Future of Headless Commerce',
    publishedAt: 'October 16, 2026',
    excerpt: 'Understanding the shift to composable architectures...',
    image: '/media/hero1.jpg',
    content: { /* Lexical JSON Content */ }
  }

  return (
    <article className={styles.page}>
      {/* 1. Narrow Article Header */}
      <div className={`${styles.wrap} ${styles.narrow}`}>
        <p className={styles.eyebrow}>Insights</p>
        <h1 className={styles.title}>{post.title}</h1>
        <p className={styles.meta}>DigiIQ Team · {post.publishedAt}</p>
        <p className={styles.lede}>{post.excerpt}</p>
      </div>

      {/* 2. Full-bleed/Standard Hero Image Container */}
      <div className={styles.wrap}>
        <div className={styles.hero}>
          <Image
            className={styles.heroImg}
            src={post.image}
            alt={post.title}
            fill
            priority
            sizes="(max-width: 1280px) 100vw, 1280px"
          />
        </div>
      </div>

      {/* 3. Narrow Rich Text Prose Body */}
      <div className={`${styles.wrap} ${styles.narrow} ${styles.prose}`}>
        <RichText data={post.content} />
      </div>
    </article>
  )
}
```

#### CSS Module (`styles.module.css`)
```css
.page {
  padding: clamp(96px, 12vw, 160px) 0 var(--space-section);
}

.wrap {
  max-width: var(--page-max);
  margin: 0 auto;
  padding: 0 var(--gutter);
}

.narrow {
  max-width: 760px; /* Limits prose line width for optimal reading legibility */
}

.eyebrow {
  font-family: var(--font-display), Arial, sans-serif;
  font-size: var(--text--1);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--color-accent);
  font-weight: 500;
}

.title {
  font-size: var(--text-5);
  font-weight: 650;
  line-height: 1.08;
  letter-spacing: -0.02em;
  margin-top: 16px;
}

.meta {
  font-size: var(--text--1);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--text-meta);
  margin-top: 20px;
}

.lede {
  font-size: var(--text-2);
  color: var(--text-body);
  line-height: 1.5;
  margin-top: 20px;
  max-width: 44em;
}

/* Hero container spacing */
.hero {
  position: relative;
  aspect-ratio: 16 / 8;
  border-radius: var(--radius-lg); /* 25px */
  overflow: hidden;
  background: var(--divider-light);
  margin: clamp(32px, 5vw, 56px) 0;
}

.heroImg {
  object-fit: cover;
}

/* Prose Typography Spec */
.prose {
  font-size: var(--text-1);
  line-height: 1.65;
  color: var(--text-heading);
}

.prose h2 {
  font-size: var(--text-3);
  font-weight: 600;
  margin: 1.6em 0 0.5em;
}

.prose h3 {
  font-size: var(--text-2);
  font-weight: 600;
  margin: 1.4em 0 0.4em;
}

.prose p {
  margin: 0 0 1em;
  color: var(--text-body);
}

.prose a {
  color: var(--color-primary);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.prose ul,
.prose ol {
  margin: 0 0 1em 1.2em;
  color: var(--text-body);
}
```

---

### 12.3 Interactive Form Page (e.g., Contact Form, Application Submission)

Used when capturing user input in clean columns inside a narrow structured layout.

#### TSX Structure (`page.tsx`)
```tsx
import styles from './styles.module.css'

export default function FormPage() {
  return (
    <section className={styles.page}>
      <div className={`${styles.wrap} ${styles.narrow}`}>
        <p className={styles.eyebrow}>Contact us</p>
        <h1 className={styles.title}>Let’s build something together</h1>
        <p className={styles.lede}>Fill in the fields below to start a project discussion.</p>
        
        {/* Form elements using unified module CSS classes */}
        <form className={styles.form}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="f-name">Name</label>
              <input className={styles.input} id="f-name" name="name" required />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="f-email">Email</label>
              <input className={styles.input} id="f-email" name="email" type="email" required />
            </div>
          </div>
          
          <div className={styles.field}>
            <label className={styles.label} htmlFor="f-message">Message</label>
            <textarea className={styles.textarea} id="f-message" name="message" required />
          </div>

          <button className={styles.submit} type="submit">
            Send Message
          </button>
        </form>
      </div>
    </section>
  )
}
```

#### CSS Module (`styles.module.css`)
```css
.page {
  padding: clamp(96px, 12vw, 160px) 0 var(--space-section);
}

.wrap {
  max-width: var(--page-max);
  margin: 0 auto;
  padding: 0 var(--gutter);
}

.narrow {
  max-width: 760px;
}

.eyebrow {
  font-family: var(--font-display), Arial, sans-serif;
  font-size: var(--text--1);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--color-accent);
  font-weight: 500;
}

.title {
  font-size: var(--text-5);
  font-weight: 650;
  line-height: 1.08;
  letter-spacing: -0.02em;
  margin-top: 16px;
}

.lede {
  font-size: var(--text-2);
  color: var(--text-body);
  line-height: 1.5;
  margin-top: 20px;
  max-width: 44em;
}

/* Form Layout Classes */
.form {
  display: flex;
  flex-direction: column;
  gap: 18px;
  max-width: 520px;
  margin-top: clamp(40px, 6vw, 72px);
}

.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.label {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-heading);
  letter-spacing: 0.01em;
}

/* Input Styles */
.input,
.textarea {
  width: 100%;
  font: inherit;
  color: var(--text-heading);
  background: var(--color-white);
  border: 1px solid var(--border-card-light); /* rgba(102, 110, 122, 0.35) */
  border-radius: var(--radius-md); /* 13px */
  padding: 12px 14px;
  transition: border-color var(--duration-fast) var(--ease-out);
}

.input:focus,
.textarea:focus {
  outline: none;
  border-color: var(--color-primary); /* #0872fc */
}

.textarea {
  min-height: 120px;
  resize: vertical;
}

/* Form Action Submit Button */
.submit {
  align-self: flex-start;
  margin-top: 4px;
  background: var(--gradient-button); /* linear-gradient(90deg, #0872fc, #11489d) */
  color: var(--color-white);
  border: 0;
  border-radius: var(--radius-btn); /* 16px */
  padding: 14px 28px;
  font-weight: 600;
  font-size: 0.98rem;
  cursor: pointer;
  transition:
    box-shadow var(--duration-fast) var(--ease-out),
    opacity var(--duration-fast) var(--ease-out);
}

.submit:hover {
  box-shadow: var(--shadow-btn-hover); /* 0 10px 24px rgba(8, 114, 252, 0.35) */
}

.submit:disabled {
  opacity: 0.6;
  cursor: default;
}

@media (max-width: 560px) {
  .row {
    grid-template-columns: 1fr;
  }
}
```

