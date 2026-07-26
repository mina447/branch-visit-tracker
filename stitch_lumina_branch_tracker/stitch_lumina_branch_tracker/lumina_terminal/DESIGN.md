---
name: Lumina Terminal
colors:
  surface: '#0b1326'
  surface-dim: '#0b1326'
  surface-bright: '#31394d'
  surface-container-lowest: '#060e20'
  surface-container-low: '#131b2e'
  surface-container: '#171f33'
  surface-container-high: '#222a3d'
  surface-container-highest: '#2d3449'
  on-surface: '#dae2fd'
  on-surface-variant: '#bcc9cd'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#869397'
  outline-variant: '#3d494c'
  surface-tint: '#4cd7f6'
  primary: '#4cd7f6'
  on-primary: '#003640'
  primary-container: '#06b6d4'
  on-primary-container: '#00424f'
  inverse-primary: '#00687a'
  secondary: '#d0bcff'
  on-secondary: '#3c0091'
  secondary-container: '#571bc1'
  on-secondary-container: '#c4abff'
  tertiary: '#4edea3'
  on-tertiary: '#003824'
  tertiary-container: '#1bbd85'
  on-tertiary-container: '#00452e'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#acedff'
  primary-fixed-dim: '#4cd7f6'
  on-primary-fixed: '#001f26'
  on-primary-fixed-variant: '#004e5c'
  secondary-fixed: '#e9ddff'
  secondary-fixed-dim: '#d0bcff'
  on-secondary-fixed: '#23005c'
  on-secondary-fixed-variant: '#5516be'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
typography:
  display-lg:
    fontFamily: Cairo
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Cairo
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-sm:
    fontFamily: Cairo
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Cairo
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Cairo
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  data-mono:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.01em
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-padding: 24px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 40px
---

## Brand & Style

The design system is engineered for a high-performance Branch Visit Tracker, blending a developer-centric aesthetic with premium, glassmorphic surfaces. The brand personality is precise, technical, and sophisticated, targeting high-stakes operational monitoring. 

The visual style utilizes **Glassmorphism** to create a sense of depth and hierarchy within a dark environment. UI elements appear as semi-transparent panes floating over a dynamic background of organic gradient blobs. This "layered terminal" approach ensures that data-heavy screens remain legible while maintaining a futuristic, high-end feel.

**Key Visual Principles:**
- **Transparency:** Use 40% opacity on container backgrounds to allow background gradients to peak through.
- **Atmospheric Depth:** Rely on 80px Gaussian blurs for background accents to provide a sense of infinite space.
- **Precision:** Contrast the soft glass surfaces with sharp, high-contrast typography and neon-accented telemetry.

## Colors

The palette is anchored in a **Deep Slate** foundation, providing a low-fatigue environment for long-duration monitoring. 

- **Primary (Cyber Blue):** Used for interactive elements, primary actions, and active tracking states.
- **Secondary (Royal Purple):** Utilized for analytical data points, secondary logic branches, and depth-shading.
- **Tertiary (Emerald Green):** Dedicated strictly to success states, completed check-ins, and positive telemetry.
- **Glass Borders:** All containers must use a 1px semi-transparent border (`rgba(255, 255, 255, 0.1)`) to define edges against the dark background.

## Typography

This design system employs a dual-font strategy to balance regional accessibility with technical precision. 

- **Cairo:** The primary typeface for all Arabic and English prose. Its geometric structure complements the glassmorphic UI.
- **Inter:** Reserved for numerical data, timestamps, and telemetry labels. This ensures maximum legibility for rapidly changing metrics.

**Usage Rules:**
- Use `data-mono` for all visit counts, IDs, and coordinates.
- Titles should utilize tight letter-spacing to maintain a "dense" premium look.
- All labels for graphs and progress rings must use `label-caps` for a professional, institutional feel.

## Layout & Spacing

The layout follows a **fluid grid** model with a "Dashboard-first" philosophy. Content is organized into modular glass panes that reflow based on screen real estate.

- **Desktop:** 12-column grid with 24px gutters. Sidebars are fixed at 280px.
- **Tablet:** 8-column grid with 16px gutters.
- **Mobile:** Single column with 16px side margins. Glass containers stack vertically with 12px gaps.

Spacing follows a strict 8px linear scale. Internal padding for cards and modals should never fall below 24px to maintain the "premium" airy feel despite the high data density.

## Elevation & Depth

Depth is achieved through **optical stacking** rather than traditional drop shadows.

- **Base Layer:** Deep Slate (#0f172a) with blurred gradient "blobs" (Primary/Secondary colors) at 10% opacity.
- **Glass Layer:** Background blur of 12px and 40% opacity surface fill. This layer represents the main interface containers.
- **Floating Layer:** Modals and tooltips use a higher blur (20px) and a brighter border (20% opacity) to signify higher z-index.
- **Neon Glow:** Active states (focused inputs, active progress rings) utilize an outer `0px 0px 12px` glow using the Primary or Tertiary hex colors to simulate light emission.

## Shapes

The design system uses a pronounced roundedness to soften the technical nature of the data. 

- **Containers & Cards:** 24px corner radius (`rounded-xl`).
- **Buttons & Inputs:** 16px corner radius (`rounded-lg`).
- **Small Elements (Chips/Badges):** Fully rounded (Pill-shaped) for distinct separation from structural blocks.
- **Progress Elements:** All circular telemetry should use "round" stroke caps for a smoother visual flow.

## Components

### Buttons
- **Primary:** Gradient fill (Cyber Blue to Royal Purple), white text, 16px radius.
- **Ghost:** 1px glass border, primary color text.
- **Interaction:** On hover, the background blur increases from 12px to 20px.

### Inputs & Focus States
- Fields are dark, semi-transparent panes.
- **Focus:** A 2px neon glow in Cyber Blue (#06b6d4) with 50% outer spread.

### Telemetry & Progress
- **Circular Progress:** Use 8px stroke widths with rounded ends.
- **Status Indicators:** Small 8px circles with a "pulse" animation (expanding ring) for live branch tracking.

### Cards
- Standard cards use the 24px radius, 12px backdrop-blur, and 1px border. 
- Header areas of cards should have a subtle 5% white highlight at the very top edge to catch the "light."

### Data Lists
- Alternating row highlights are not used; instead, use thin 1px horizontal dividers in `border_subtle`.
- Numerical data columns always use the `Inter` font.