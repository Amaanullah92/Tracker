# Kinetic Dark — Design System

> Source: Google Stitch project `Tracker Mobile Design System`  
> Fonts: Hanken Grotesk (headings/body) + JetBrains Mono (labels/monospace)

---

## Brand & Style

A habit and gym tracker built on a **Kinetic Dark** aesthetic — combining the focus of a high-performance training environment with the streamlined utility of a personal productivity tool. Mobile-first, dark-mode-only, designed for high-speed interaction, often under physical stress (workouts).

Modern/SaaS-influenced, card-based layout. Deep background energized by high-vibrancy accents. Every touch target optimized for one-handed use (min 44px).

---

## Color Palette

### Surface & Background

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-bg` | `#0A0A0A` | Page background ("near-black", OLED-optimized) |
| `--color-bg-secondary` | `#131313` | Secondary background / surface-dim |
| `--color-surface` | `#1E1E1E` | Card backgrounds |
| `--color-surface-elevated` | `#2A2A2A` | Inputs, nested controls, "Add Set" row |
| `--color-surface-bright` | `#393939` | Bright surface variant |

### Text

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-text-primary` | `#F9FAFB` | Primary body text |
| `--color-text-secondary` | `#9CA3AF` | Secondary/muted text |
| `--color-on-surface` | `#e5e2e1` | Text on surface cards |
| `--color-on-surface-variant` | `#c7c4d8` | Text on surface (lower emphasis) |

### Accent / Brand

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-primary` | `#c3c0ff` | Active nav, primary text highlights |
| `--color-primary-container` | `#4f46e5` | Button fills, "Save", "Start" |
| `--color-on-primary` | `#1d00a5` | Text on primary fills |
| `--color-secondary` | `#4edea3` | Success states, checkmarks, completed streaks |
| `--color-secondary-container` | `#00a572` | Secondary button fills |
| `--color-tertiary` | `#ffb95f` | Highlights, warnings, timer displays |
| `--color-tertiary-container` | `#885500` | Tertiary button fills |
| `--color-destructive` | `#EF4444` | Delete actions, broken streaks |
| `--color-error` | `#ffb4ab` | Error backgrounds / toasts |
| `--color-error-container` | `#93000a` | Error container fill |

### Borders & Dividers

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-border` | `#464555` | Card borders, input borders |
| `--color-outline` | `#918fa1` | Subtle dividers, disabled state outlines |

---

## Typography

| Token | Font | Size | Weight | Line Ht | Letter Spacing | Usage |
|-------|------|------|--------|---------|----------------|-------|
| `headline-lg` | Hanken Grotesk | 28px | 700 | 34px | -0.02em | Page titles |
| `headline-lg-mobile` | Hanken Grotesk | 24px | 700 | 30px | — | Mobile page titles |
| `headline-md` | Hanken Grotesk | 20px | 600 | 26px | — | Section headings |
| `body-lg` | Hanken Grotesk | 16px | 400 | 24px | — | Body text |
| `body-sm` | Hanken Grotesk | 14px | 400 | 20px | — | Small body / captions |
| `label-caps` | JetBrains Mono | 12px | 600 | 16px | 0.05em | Uppercase labels (SET, KG, REPS) |
| `stat-lg` | Hanken Grotesk | 32px | 800 | 40px | -0.03em | Large stat numbers |

CSS variables:
- `--font-sans`: `"Hanken Grotesk", system-ui, sans-serif`
- `--font-mono`: `"JetBrains Mono", ui-monospace, monospace`

---

## Shapes & Roundness

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 0.25rem (4px) | Small badges |
| `--radius` | 0.5rem (8px) | Buttons, inputs, default |
| `--radius-md` | 0.75rem (12px) | — |
| `--radius-lg` | 1rem (16px) | Cards |
| `--radius-xl` | 1.5rem (24px) | Modals, dialogs |
| `--radius-full` | 9999px | Pills, streak badges |

---

## Spacing

| Token | Value | Usage |
|-------|-------|-------|
| `--space-base` | 4px | Base grid unit |
| `--space-margin-x` | 16px | Horizontal page margins |
| `--space-gutter` | 12px | Gap between cards |
| `--space-card-padding` | 16px | Internal card padding |
| `--space-touch-target` | 44px | Minimum interactive element height |

---

## Elevation

Depth achieved through **tonal layering** rather than shadows:

1. `#0A0A0A` — Page floor (background)
2. `#1E1E1E` — Card surface
3. `#2A2A2A` — Surface-elevated (inputs, add-set row)
4. `#393939` — Surface-bright (active/interactive)

Shadows used sparingly — only on FABs and bottom nav bar (`rgba(0,0,0,0.4)` with 12px blur).

---

## Component Specs

### Bottom Tab Bar
- Height: 64px
- Active tab: `--color-primary` icon + 4px dot indicator below label
- Inactive tab: `--color-text-secondary` icon/label
- Icon line weight: 2px

### Buttons
- **Primary**: Solid `--color-primary-container` (#4f46e5), text `--color-on-primary` (#1d00a5), bold
- **Secondary/Outline**: 1px solid `--color-primary`, transparent bg
- **Success**: Solid `--color-secondary-container`, text near-black
- **Destructive**: Ghost/text style in `--color-destructive`
- Border radius: `--radius` (8px)

### Toggle Cards (Habits)
- Habit name + streak on the left, toggle on the right
- Card surface: `--color-surface` (#1E1E1E)
- N/A state: 40% opacity + grayscale

### Exercise Table (Workout)
- Labels (SET, KG, REPS): `label-caps` style (JetBrains Mono, uppercase)
- "Add Set" row: `--color-surface-elevated` (#2A2A2A) background
- Superset grouping: 1px dashed `--color-primary` border

### Inputs
- Numeric: Large centered text with ± stepper buttons flanking
- Border radius: `--radius` (8px)
- Background: `--color-surface-elevated` (#2A2A2A)
