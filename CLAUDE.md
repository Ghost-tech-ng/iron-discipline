# Iron Discipline — Fitness OS (React Native)

## What This Is
Offline-first personal fitness OS. Workout tracking, macro/supplement logging, discipline scoring system.

## Tech Stack
- React Native + Expo (managed workflow)
- TypeScript (strict mode)
- Zustand (state management)
- SQLite (local, offline-first via expo-sqlite)
- StyleSheet + theme tokens (`constants/theme.ts`, `useColors()`) — NativeWind is installed but unused

## Architecture
- Offline-first: all data in local SQLite, sync later if needed
- Zustand stores mirror SQLite tables — write to SQLite first, update store after
- No backend dependency for core functionality

## Coding Rules
- **TypeScript:** No `any`. Define interfaces for all data models.
- **Components:** Functional only. Aim for under 150 lines; extract when touching an oversized screen (progress.tsx, meal/log.tsx, index.tsx are legacy offenders).
- **State:** Zustand stores only — no prop drilling past 2 levels
- **Styles:** `StyleSheet.create` inside `useMemo`, built from `useColors()` so light/dark themes work. No hardcoded colours.
- **SQLite:** Always use parameterized queries. Schema changes go in a new numbered migration in `services/db.ts`.
- **Dates:** Calendar dates are local — use `localIso()` / `daysAgoIso()` from `utils/date.ts`. Never `toISOString()` for a date.
- **Navigation:** Expo Router (file-based routing)

## Current Session State
**Last updated:** 2026-10-07

### Status
Active on branch `post-gym` (Sculpt Protocol rework, Expo SDK 57). Restart Protocol button on the Habits tab. Exercise swaps (pick a substitute when a machine is missing, stored in `exercise_swaps`, migration 9). Goal changed 2026-10-07 from the 87kg floor to 12% body fat (migration 10).

### Key Areas
- Workout tracking module
- Macro logging
- Discipline score algorithm
- Supplement tracking
- 16-week Sculpt Protocol phase engine (`constants/phases.ts`): ATTACK cut to 12% body fat (~84kg, wk 1-10) then BUILD lean gain (wk 11-16)

## File Structure Pattern
```
app/                  ← Expo Router screens
components/           ← Reusable UI components
store/                ← Zustand state stores
services/             ← SQLite schema/migrations (db.ts), queries, AI, sync, notifications
constants/            ← Workout split, phases, nutrition targets, theme
hooks/                ← Custom React hooks
types/                ← TypeScript interfaces
utils/                ← Pure helpers (dates)
```
