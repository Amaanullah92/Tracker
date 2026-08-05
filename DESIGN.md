# Ember — Design System

> Warm graphite + ember. A personal habit & gym tracker that feels like a
> well-used training space: warm dark surfaces, one vivid ember accent, and
> athletic condensed typography. Mobile-first, dark-only, 44px touch targets.

---

## Brand

**Ember** — every day relights your streak. The signature element is the
**ember wick**: a row of 7 small bars on each habit card showing the last
7 days (lit = done, dim = missed, today gently pulsing).

Fonts: **Barlow Condensed** (display/stats) + **Archivo** (body) +
**IBM Plex Mono** (data labels, SET/KG/REPS, timers).

---

## Color Palette

### Surfaces (warm charcoal, tonal layering)

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-bg` | `#141210` | Page background |
| `--color-bg-secondary` | `#1a1713` | Subtle layers, hover scrims |
| `--color-surface` | `#1f1b16` | Card backgrounds |
| `--color-surface-variant` | `#241f18` | Icon tiles, field editors |
| `--color-surface-elevated` | `#272118` | Inputs, add-set rows |
| `--color-surface-bright` | `#352c21` | Active/interactive surfaces |

### Text

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-text-primary` | `#f5f0e8` | Primary body text |
| `--color-text-secondary` | `#a79e91` | Muted text |
| `--color-text-tertiary` | `#857b6b` | Lowest-emphasis labels |
| `--color-on-surface` | `#ede6da` | Text on cards |
| `--color-on-surface-variant` | `#b9b0a1` | Lower emphasis on cards |

### Accent — Ember

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-primary` | `#ff6b35` | Fills, active nav, highlights |
| `--color-on-primary` | `#1a0d06` | Text on ember fills (near-black) |
| `--color-primary-container` | `#e8591e` | Deep-ember button fills |
| `--color-on-primary-container` | `#ffe9de` | Text on container fills |
| `--color-primary-fixed` | `#ff8a5c` | Hover states |

### Semantic

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-secondary` | `#7bd88f` | Success, checkmarks, done wicks |
| `--color-tertiary` | `#ffc24b` | Rest timers, warnings |
| `--color-destructive` | `#ff5c5c` | Delete actions |
| `--color-error` | `#ffb4ab` | Error text/toasts |
| `--color-error-container` | `#93000a` | Error fills |
| `--color-border` | `#3b3329` | Card/input borders |
| `--color-outline` | `#6e6557` | Subtle dividers, disabled |

### Contrast notes

- Primary ember fills carry **near-black text** (`--color-on-primary`) to
  hold 4.5:1 contrast — never white-on-ember.
- Body text `#f5f0e8` on `#141210` ≈ 14:1; muted `#a79e91` ≈ 6.5:1.

---

## Typography

| Token | Font | Size | Weight | Usage |
|-------|------|------|--------|-------|
| `display` | Barlow Condensed | 36px | 700 | Page titles |
| `headline-lg` | Barlow Condensed | 28px | 700 | Section heroes |
| `headline` | Barlow Condensed | 20px | 600 | Card titles |
| `body` | Archivo | 16px | 400 | Body text |
| `sm` | Archivo | 14px | 400 | Captions |
| `label` | IBM Plex Mono | 12px | 600 | Uppercase labels (SET, KG, REPS) |
| `stat` | Barlow Condensed | 32px | 700 | Big numbers (streaks, weight) |
| `tiny` | Archivo | 11px | 500 | Micro-labels |

CSS variables: `--font-sans` (Archivo), `--font-display` (Barlow Condensed),
`--font-mono` (IBM Plex Mono). Loaded via `next/font`.

---

## Shapes & Spacing

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-lg` | 12px | Cards |
| `--radius` | 8px | Buttons, inputs |
| `--radius-full` | 9999px | Badges, switches, wicks |
| `--spacing-margin-x` | 16px | Page horizontal margins |
| `--spacing-gutter` | 12px | Gap between cards |
| `--spacing-card-padding` | 16px | Card padding |
| `--spacing-touch` | 44px | Minimum touch target |

Elevation is tonal layering (surface → elevated → bright), plus one
directional shadow for the fixed bottom bars.

---

## Components

### Bottom Tab Bar
- 64px, fixed, 1px top border, safe-area inset bottom
- Active tab: ember icon + label + 4px ember dot; inactive: muted gray
- Sync status: compact dot at the right edge (amber pulsing = syncing,
  red = conflicts/failed, gray = offline)

### Buttons
- **Primary**: solid `--color-primary` fill, `--color-on-primary` bold text,
  8px radius, ≥44px tall, `active:scale-[0.98]`
- **Secondary**: `--color-surface-bright` fill, borderless
- **Outline**: 1px `--color-border`, transparent bg
- **Ghost/destructive**: text-only in `--color-destructive`

### Habit Cards
- Surface card, 1px border, 12px radius
- Name (Barlow 600) + ember-wick streak row on the right
- Schema-driven fields render below (switch / stepper / segmented / chips)

### Set Table (Workout)
- Column headers SET / KG / REPS in `label` mono caps
- Set rows in tabular mono numerals
- Add row: `--color-surface-elevated` background, weight/reps steppers
- Supersets: 1px dashed ember border panel

### Rest Timer
- Amber (`--color-tertiary`) mono digits, ±15s buttons, play/pause, skip
- All controls ≥44px touch targets

### Sheets
- Bottom sheets slide up 240ms (ease-emphasized), backdrop `rgba(0,0,0,0.6)`,
  max-w-lg centered, rounded top 16px — used for add-exercise, new-session,
  and habit/template forms

---

## Motion

- Micro-interactions 150–300ms, `cubic-bezier(0.2, 0, 0, 1)`
- Press feedback: `scale(0.98)` on tappable cards/buttons
- Wicks: today's bar gently pulses (ember glow), reduced-motion disabled
- Skeleton loading per screen (no bare spinners)

## Accessibility

- Visible focus ring (2px ember, offset) via `.ring-focus`
- `color-scheme: dark` so native date/time pickers render dark
- Touch targets ≥44px everywhere, tabular numerals in data grids
- All state conveyed with icon+color, never color alone
