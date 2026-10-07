import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { WEEKLY_SPLIT } from '../constants/workouts';
import { getProtocolStatus, mondayIndex } from '../constants/phases';
import { localIso } from '../utils/date';
import type { DayOfWeek } from '../types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'android') {
    // Standard channel for scheduled reminders
    await Notifications.setNotificationChannelAsync('iron-discipline', {
      name: 'Iron Discipline',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#3b82f6',
    });
    // High-importance channel for rest timer — sounds and vibrates even when screen is locked
    await Notifications.setNotificationChannelAsync('rest-timer', {
      name: 'Rest Timer',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 100, 100, 100],
      lightColor: '#3b82f6',
      sound: 'default',
      bypassDnd: false,
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// Fire a notification immediately (used for rest timer complete, etc.)
export async function sendImmediateNotification(title: string, body: string): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        ...(Platform.OS === 'android' ? { channelId: 'rest-timer' } : {}),
      },
      trigger: null,
    });
  } catch {
    // silently fail — not critical
  }
}

type WeeklyTrigger = {
  type: 'weekly';
  weekday: number;
  hour: number;
  minute: number;
};

type DailyTrigger = {
  type: 'daily';
  hour: number;
  minute: number;
};

function buildSchedule(proteinGoal: number): Array<{
  identifier: string;
  title: string;
  body: string;
  trigger: WeeklyTrigger | DailyTrigger;
}> {
  return [
    // --- Daily core ---
    {
      identifier: 'core_daily',
      title: '2-Min Core',
      body: 'Dead bug · Bird-dog · Side plank. Two minutes, right now.',
      trigger: { type: 'daily', hour: 7, minute: 30 },
    },
    // --- Supplements ---
    {
      identifier: 'supp_morning',
      title: 'Morning Stack',
      body: 'Creatine · Vitamin D3 · Minoxidil — take before your first meal.',
      trigger: { type: 'daily', hour: 8, minute: 0 },
    },
    {
      identifier: 'supp_lunch',
      title: 'Fish Oil',
      body: 'Omega-3 with lunch. Don\'t skip — it\'s anti-inflammatory and supports recovery.',
      trigger: { type: 'daily', hour: 13, minute: 0 },
    },
    {
      identifier: 'supp_night',
      title: 'Magnesium',
      body: 'Magnesium glycinate before sleep. Better sleep = better muscle recovery.',
      trigger: { type: 'daily', hour: 22, minute: 0 },
    },
    // --- Evening protein check ---
    {
      identifier: 'protein_evening',
      title: 'Protein Check',
      body: `Have you hit ${proteinGoal}g protein today? Check the app and top up if not — sardines, eggs, whey, or grilled chicken.`,
      trigger: { type: 'daily', hour: 20, minute: 0 },
    },
    // --- End-of-day score ---
    {
      identifier: 'eod_check',
      title: 'End of Day — Log It',
      body: 'Log any remaining meals and habits before midnight. Every logged day builds the streak.',
      trigger: { type: 'daily', hour: 21, minute: 0 },
    },
    // --- Streak protection ---
    {
      identifier: 'streak_check',
      title: 'Last Chance Today',
      body: `Don't let today be a zero. Log sleep, water, and your protein if you haven\'t.`,
      trigger: { type: 'daily', hour: 22, minute: 30 },
    },
    // --- Monday weigh-in ---
    {
      identifier: 'weigh_in',
      title: 'Monday Weigh-In',
      body: 'First thing after waking, after toilet, before food or water. Log your weight now.',
      trigger: { type: 'weekly', weekday: 2, hour: 6, minute: 30 },
    },
  ];
}

const DAY_KEYS: DayOfWeek[] = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
];

/**
 * How far ahead the split-based reminders are laid out. They are dated rather
 * than weekly so they follow WEEKLY_SPLIT and deload weeks, and so today's
 * evening nag can be cancelled once the session is logged. Rescheduled on every
 * launch and day change; if the app goes unopened this long, they stop.
 */
const DAYS_AHEAD = 14;

const eveningReminderId = (iso: string) => `workout_eve_${iso}`;

function at(date: Date, hour: number, minute: number): Date {
  const d = new Date(date);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function buildDatedSchedule(
  proteinGoal: number,
  workoutDoneToday: boolean
): Array<{ identifier: string; title: string; body: string; date: Date }> {
  const out: Array<{ identifier: string; title: string; body: string; date: Date }> = [];
  const now = new Date();

  for (let i = 0; i < DAYS_AHEAD; i++) {
    const day = new Date(now);
    day.setDate(now.getDate() + i);
    const iso = localIso(day);
    const session = WEEKLY_SPLIT[DAY_KEYS[mondayIndex(day)]];

    if (!session) {
      out.push({
        identifier: `rest_protein_${iso}`,
        title: 'Rest Day — Hit Protein Anyway',
        body: `${proteinGoal}g protein even on rest days. Recovery is built at the table, not the gym.`,
        date: at(day, 13, 0),
      });
      continue;
    }

    const status = getProtocolStatus(iso);
    const shortName = session.label.split(' — ')[0];
    const lifts = session.exercises.slice(0, 3).map((e) => e.name).join(' · ');

    out.push({
      identifier: `workout_${iso}`,
      title: status.isDeloadWeek ? `${shortName} — Deload` : session.label,
      body: status.isDeloadWeek
        ? 'Deload week: same lifts, 60% of the sets. Show up, move well, recover.'
        : `${lifts}. Get it done today.`,
      date: at(day, 7, 0),
    });

    if (!(i === 0 && workoutDoneToday)) {
      out.push({
        identifier: eveningReminderId(iso),
        title: `${shortName} Not Done`,
        body: 'Session still pending. Even 40 focused minutes counts — do not let today go.',
        date: at(day, 19, 0),
      });
    }
  }

  return out.filter((n) => n.date.getTime() > now.getTime());
}

function channel() {
  return Platform.OS === 'android' ? { channelId: 'iron-discipline' } : {};
}

export async function scheduleAllNotifications(proteinGoal = 200, workoutDoneToday = false): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();

  const { SchedulableTriggerInputTypes } = Notifications;
  const repeating = buildSchedule(proteinGoal).map(({ identifier, title, body, trigger }) => {
    const notifTrigger: Notifications.SchedulableNotificationTriggerInput =
      trigger.type === 'daily'
        ? ({
            type: SchedulableTriggerInputTypes.DAILY,
            hour: trigger.hour,
            minute: trigger.minute,
          } as Notifications.DailyTriggerInput)
        : ({
            type: SchedulableTriggerInputTypes.WEEKLY,
            weekday: trigger.weekday,
            hour: trigger.hour,
            minute: trigger.minute,
          } as Notifications.WeeklyTriggerInput);

    return Notifications.scheduleNotificationAsync({
      identifier,
      content: { title, body, sound: true, ...channel() },
      trigger: notifTrigger,
    });
  });

  const dated = buildDatedSchedule(proteinGoal, workoutDoneToday).map(({ identifier, title, body, date }) =>
    Notifications.scheduleNotificationAsync({
      identifier,
      content: { title, body, sound: true, ...channel() },
      trigger: { type: SchedulableTriggerInputTypes.DATE, date },
    })
  );

  await Promise.allSettled([...repeating, ...dated]);
}

/** Called when today's session is logged, so the 19:00 "Not Done" reminder doesn't fire. */
export async function cancelTodayWorkoutReminder(): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(eveningReminderId(localIso()));
  } catch {
    // Not critical
  }
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
