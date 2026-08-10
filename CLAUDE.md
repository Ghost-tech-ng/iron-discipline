# Iron Discipline — Fitness OS (React Native)

## What This Is
Offline-first personal fitness OS. Workout tracking, macro/supplement logging, discipline scoring system.

## Tech Stack
- React Native + Expo (managed workflow)
- TypeScript (strict mode)
- Zustand (state management)
- SQLite (local, offline-first via expo-sqlite)
- NativeWind (Tailwind for RN styling)

## Architecture
- Offline-first: all data in local SQLite, sync later if needed
- Zustand stores mirror SQLite tables — write to SQLite first, update store after
- No backend dependency for core functionality

## Coding Rules
- **TypeScript:** No `any`. Define interfaces for all data models.
- **Components:** Functional only. Under 150 lines. Extract when larger.
- **State:** Zustand stores only — no prop drilling past 2 levels
- **Styles:** NativeWind classes only — no StyleSheet.create or inline styles
- **SQLite:** Always use parameterized queries
- **Navigation:** Expo Router (file-based routing)

## Current Session State
**Last updated:** 2026-07-13

### Status
Paused. Resume with `/start` to see current state of the repo.

### Key Areas
- Workout tracking module
- Macro logging
- Discipline score algorithm
- Supplement tracking

## File Structure Pattern
```
app/                  ← Expo Router screens
components/           ← Reusable UI components
stores/               ← Zustand state stores
db/                   ← SQLite schema + queries
hooks/                ← Custom React hooks
types/                ← TypeScript interfaces
```
