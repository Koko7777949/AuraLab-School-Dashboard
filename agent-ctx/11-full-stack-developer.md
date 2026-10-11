---
Task ID: 11
Agent: Full Stack Developer
Task: Add page transition animations and improve the main page layout

Work Log:
- Read worklog.md, page.tsx, globals.css, store.ts, types.ts, and layout.tsx to understand project context
- Analyzed existing CSS animations in globals.css (animate-fade-in-up, section-transition, etc.)

### 1. Section Transition Animation
- Wrapped SectionRenderer in a `<div key={activeSection}>` to trigger re-mount on section change
- Applied `animate-section-fade-in-up` class for 250ms fade-in + 8px translate-up with ease-out timing
- Key prop ensures React unmounts/remounts the container, re-triggering the CSS animation

### 2. Footer Enhancement
- Replaced simple `border-t` separator with a gradient line using linear-gradient (transparent → amber 25% → amber 40% → amber 25% → transparent)
- Added three-column desktop layout: copyright (with amber accent dot), quick links nav, version
- Quick links: "سياسة الخصوصية", "الشروط والأحكام", "المساعدة" — all disabled with "(قريباً)" tooltip
- Mobile layout: stacked centered layout with smaller text sizes and reduced opacity
- Amber accent dot (2x2 rounded-full) placed before "© 2025 AuraLab"

### 3. Layout Improvements
- Main content area already had `flex-1` and `min-h-screen` on parent — structure preserved
- `pt-20` retained on `<main>` to account for fixed header height
- Added `scroll-behavior: smooth` to `html` in globals.css for smooth scrolling

### 4. Loading State
- Created `LoadingOverlay` component with glass-card-elevated styling
- Features:
  - Full-screen overlay at z-[9999] with background #121218
  - Amber logo dot (6x6) with two concentric pulse rings (staggered at 0.5s delay)
  - Brand name "AuraLab" + Arabic subtitle "جارٍ تحميل لوحة التحكم..."
  - Fades out with `animate-loading-fade-out` (300ms) after 600ms display time
  - Controlled by `isStoreReady` state (set after 50ms mount delay)
- Added 3 new CSS animation keyframes + classes to globals.css:
  - `loading-pulse-ring`: scale 0.8→1.4→0.8 with opacity fade (1.5s infinite)
  - `loading-pulse-dot`: subtle scale 1→1.1→1 with opacity (1.5s infinite)
  - `loading-fade-out`: opacity 1→0 with pointer-events transition (300ms)

### 5. CSS Additions to globals.css
- Section 13: `animate-section-fade-in-up` (250ms ease-out, translateY 8px)
- Section 14: Loading overlay animations (pulse-ring, pulse-dot, fade-out)
- Added `scroll-behavior: smooth` to `html` rule

### Verification
- ESLint: 0 errors, 0 warnings ✓
- Dev server: Ready, no compilation errors ✓
- All existing functionality preserved (sidebar, header, section routing)

Files Modified:
- `/home/z/my-project/src/app/page.tsx` — Complete rewrite with all 4 improvements
- `/home/z/my-project/src/app/globals.css` — Added sections 13-14 (animations) + smooth scroll
