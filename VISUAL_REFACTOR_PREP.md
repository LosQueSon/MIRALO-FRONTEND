# Visual Refactor Prep

## Current Readiness

The project is ready for visual refactor without touching feature behavior:

- Playback sync is functional (WebSocket-first + polling fallback).
- Room chat is functional per room.
- Navigation flow between Discover and Watch Party is stable.
- Shared design tokens and utility classes are now available in global styles.

## Added Foundation

- Global design tokens in `src/app/globals.css`:
  - Color surfaces, text hierarchy, state colors.
  - Radius and shadow primitives.
  - Reusable utility classes:
    - `ui-glass-card`
    - `ui-header-shell`
    - `ui-dot-grid`
    - `ui-eyebrow`
    - `ui-button-primary`
    - `ui-button-secondary`
    - `ui-status-chip`

- Shared layout components moved to tokenized styling:
  - `src/components/layout/FeaturePageShell.tsx`
  - `src/components/layout/StatusCard.tsx`

## Refactor Sequence (Recommended)

1. **Layout Harmonization**
   - Unify spacing and section rhythm across Discover and Watch Party.
   - Normalize card hierarchy and action placement.

2. **Typography System**
   - Define title/subtitle/body scales and apply consistently.
   - Keep accessibility contrast with current dark video background.

3. **Component Styling Pass**
   - Migrate button variants and chips to utility classes.
   - Normalize form controls and feedback states.

4. **Interaction Polish**
   - Add subtle transitions for room select, chat updates, and status changes.
   - Keep transitions deterministic to avoid flicker.

5. **Responsive QA**
   - Validate sidebar + content behavior at mobile/tablet/desktop breakpoints.

## Definition of Done for Visual Refactor

- No behavioral regressions in auth, join/leave, playback, and chat.
- Shared visual language across Discover and Watch Party.
- Consistent spacing, typography, button hierarchy, and status semantics.
- Build passes and no TypeScript errors.
