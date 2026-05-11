# Iron Discipline

**Personal fitness transformation OS — built for one user, built to last.**

Iron Discipline is a private mobile application for physique transformation. It centralises workout execution, macro tracking, supplement adherence, habit accountability, and progress analytics into a single disciplined system. No social feed, no gamification noise — just the tools that drive consistent results.

Built with React Native and Expo. Runs fully offline. Designed for daily use.

---

## Philosophy

Most fitness apps are designed for mass-market retention, not personal transformation. Iron Discipline inverts that priority. Every screen is built around one outcome: making it harder to skip and easier to execute. The discipline score is not motivational — it is factual. It tells you exactly what percentage of your system you actually ran that day.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native + Expo |
| Language | TypeScript |
| Routing | Expo Router |
| UI | NativeWind (Tailwind for RN) |
| Animations | Reanimated + Moti |
| State | Zustand |
| Database | SQLite (offline-first via Expo SQLite) |
| Charts | Victory Native |
| Notifications | Expo Notifications |
| Camera | Expo Image Picker (progress photos) |

---

## Features

### Dashboard — Command Center

The first screen you see every morning.

- **Daily Readiness Card** — today's workout, calories remaining, protein remaining, water intake, checklist completion, current streak
- **Discipline Score** — a single percentage computed from every tracked variable for the day. No rounding up.
- **Quick Actions** — log a meal, start today's workout, mark supplements taken

### Workout System

- Weekly split scheduler (configurable per day of week)
- Exercise cards with sets, reps, weight, rest timer, and notes per set
- Progressive overload tracking — previous session's weight and volume shown inline while logging
- Workout completion triggers streak update, estimated calorie burn, and discipline score contribution

### Nutrition Tracking

- Daily macro targets: calories, protein, carbs, fats
- Meal categories: breakfast, lunch, dinner, post-workout, snacks
- Smart progress bars showing current vs. target in real time
- Barcode scanner for packaged foods (Phase 2)
- Manual entry with common food library

### Supplement Tracking

- Custom supplement list with daily dosing schedule
- Push notification reminders per supplement (time-configurable)
- One-tap mark-as-taken
- Tracked supplements: creatine, protein powder, minoxidil, vitamins, omega-3 — fully editable

### Habit Tracking

- Daily checklist: 10k steps, 8h sleep, no junk food, water goal, cardio
- Checkbox UI with haptic feedback and completion animations
- Missed habits feed directly into the discipline score reduction

### Progress Tracking

- Weekly body weight and waist logging
- Progress photo upload with side-by-side comparison view
- Charts: weight trend, workout consistency, calorie adherence, streak history
- Discipline score history graph

### Discipline System

The core differentiator. Every tracked variable has a weighted contribution to a daily discipline percentage:

| Variable | Weight |
|----------|--------|
| Workout completed | 25% |
| Protein target hit | 20% |
| Calorie target hit | 15% |
| Supplements taken | 15% |
| Water goal | 10% |
| Sleep logged | 10% |
| Cardio / steps | 5% |

Streaks tracked separately: workout streak, nutrition streak, full discipline streak. The dashboard degrades visually when streaks break — no hiding from it.

### Notifications

- Supplement reminders at configured times
- Workout reminder if none logged by set hour
- Protein and calorie warnings at end of day
- Streak break alert

---

## Architecture

```
iron-discipline/
├── app/                         Expo Router screens
│   ├── (tabs)/
│   │   ├── index.tsx            Dashboard
│   │   ├── workouts.tsx
│   │   ├── nutrition.tsx
│   │   ├── progress.tsx
│   │   ├── habits.tsx
│   │   └── settings.tsx
│   ├── workout/[id].tsx         Live workout screen
│   ├── meal/log.tsx
│   └── onboarding/
├── components/
│   ├── ui/                      Base components (cards, buttons, bars)
│   ├── dashboard/
│   ├── workouts/
│   ├── nutrition/
│   ├── habits/
│   └── progress/
├── features/
│   ├── workouts/                Logic, hooks, types
│   ├── nutrition/
│   ├── habits/
│   ├── supplements/
│   └── progress/
├── store/
│   ├── userStore.ts             Profile, goals, onboarding state
│   ├── workoutStore.ts
│   ├── nutritionStore.ts
│   ├── habitStore.ts
│   └── disciplineStore.ts
├── services/
│   ├── db.ts                    SQLite setup and migrations
│   ├── notifications.ts
│   └── discipline.ts            Score calculation engine
├── utils/
└── assets/
```

---

## State Model

```typescript
// store/disciplineStore.ts
type DisciplineState = {
  date: string
  workoutDone: boolean
  proteinHit: boolean
  calorieHit: boolean
  supplementsTaken: string[]
  waterGoalHit: boolean
  sleepLogged: boolean
  cardioLogged: boolean
  score: number                  // 0–100, computed
}

// store/userStore.ts
type UserProfile = {
  name: string
  heightCm: number
  weightKg: number
  goalCalories: number
  goalProtein: number
  goalWaterMl: number
  split: Record<string, string>  // { monday: 'Chest + Triceps', ... }
}
```

---

## Design System

- **Mode**: Dark only
- **Background**: `#0a0a0a` base, `#111111` cards
- **Accent**: Cold white `#f5f5f5` with selective graphite `#2a2a2a` borders
- **Typography**: `Inter` variable font — tight tracking, high contrast
- **Glow accents**: Subtle on active states only
- **Inspiration**: Whoop, Nike Training Club, Apple Fitness, Notion minimalism

---

## Onboarding Flow

1. Name, height, current weight
2. Daily calorie and protein targets
3. Gym split configuration (day → muscle group)
4. Supplement list setup
5. Notification time preferences

---

## Build Roadmap

**Phase 1 — Shell**
- [ ] Navigation setup (Expo Router, tabs)
- [ ] Design system: theme tokens, base components
- [ ] Zustand stores and SQLite schema
- [ ] Onboarding screens

**Phase 2 — Core Tracking**
- [ ] Workout tracker — live logging screen
- [ ] Macro logger — meal entry and daily totals
- [ ] Dashboard — readiness card and discipline score

**Phase 3 — Consistency Systems**
- [ ] Habits checklist with haptics
- [ ] Supplement tracker
- [ ] Push notification service

**Phase 4 — Progress**
- [ ] Progress photo upload and comparison view
- [ ] Analytics charts (weight, streaks, consistency)
- [ ] Discipline score history

**Phase 5 — Intelligence (Optional)**
- [ ] AI meal estimation ("chicken and rice" → macros)
- [ ] Daily coach feedback based on previous week's data
- [ ] Voice logging

---

## Running Locally

```bash
git clone https://github.com/Ghost-tech-ng/iron-discipline
cd iron-discipline

npm install
npx expo start
```

Scan the QR code with Expo Go on your phone. No simulator required for initial development.

---

## License

Private repository. Personal use only.
