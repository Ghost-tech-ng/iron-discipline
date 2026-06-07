import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

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
    // --- Workout reminders (training days) ---
    {
      identifier: 'workout_mon',
      title: 'Push Day — Chest & Shoulders',
      body: 'Bench press, OHP, incline — build the width. Get it done today.',
      trigger: { type: 'weekly', weekday: 2, hour: 7, minute: 0 },
    },
    {
      identifier: 'workout_tue',
      title: 'Pull Day — Back & Biceps',
      body: 'Rows, pulldowns, curls. The back you build today shows in 8 weeks.',
      trigger: { type: 'weekly', weekday: 3, hour: 7, minute: 0 },
    },
    {
      identifier: 'workout_wed',
      title: 'Leg Day — Quads',
      body: 'Squat day. Heaviest session of the week. Don\'t negotiate with yourself.',
      trigger: { type: 'weekly', weekday: 4, hour: 7, minute: 0 },
    },
    {
      identifier: 'workout_fri',
      title: 'Upper Body — Full Compound',
      body: 'Re-stimulus day — hit everything with fresh strength. End the week properly.',
      trigger: { type: 'weekly', weekday: 6, hour: 7, minute: 0 },
    },
    {
      identifier: 'workout_sat',
      title: 'Lower Body — Posterior Chain',
      body: 'RDLs, leg curls, hip thrusts. Glutes and hamstrings — don\'t skip this.',
      trigger: { type: 'weekly', weekday: 7, hour: 7, minute: 0 },
    },
    // --- Evening workout reminders (training days, if not done) ---
    {
      identifier: 'workout_eve_mon',
      title: 'Push Day Not Done',
      body: 'Push session still pending. Even 40 focused minutes counts. Don\'t let Monday go.',
      trigger: { type: 'weekly', weekday: 2, hour: 19, minute: 0 },
    },
    {
      identifier: 'workout_eve_tue',
      title: 'Pull Day Not Done',
      body: 'Back session still pending. Pull day skipped = missed protein synthesis opportunity.',
      trigger: { type: 'weekly', weekday: 3, hour: 19, minute: 0 },
    },
    {
      identifier: 'workout_eve_wed',
      title: 'Leg Day Not Done',
      body: 'Squat day still pending. Legs are your biggest driver of fat loss. Get it done.',
      trigger: { type: 'weekly', weekday: 4, hour: 19, minute: 0 },
    },
    {
      identifier: 'workout_eve_fri',
      title: 'Upper Body Not Done',
      body: 'Upper session pending. You have time tonight — finish the training week.',
      trigger: { type: 'weekly', weekday: 6, hour: 19, minute: 0 },
    },
    {
      identifier: 'workout_eve_sat',
      title: 'Lower Body Not Done',
      body: 'Posterior chain session still pending. Finish the week — you\'re one session away.',
      trigger: { type: 'weekly', weekday: 7, hour: 19, minute: 0 },
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
    // --- Rest day protein reminder ---
    {
      identifier: 'rest_day_protein_sun',
      title: 'Rest Day — Hit Protein Anyway',
      body: `Rest days still need ${proteinGoal}g protein. Muscle doesn\'t know it\'s Sunday.`,
      trigger: { type: 'weekly', weekday: 1, hour: 13, minute: 0 },
    },
    {
      identifier: 'rest_day_protein_thu',
      title: 'Rest Day — Hit Protein Anyway',
      body: `${proteinGoal}g protein even on rest days. Recovery is built at the table, not the gym.`,
      trigger: { type: 'weekly', weekday: 5, hour: 13, minute: 0 },
    },
  ];
}

export async function scheduleAllNotifications(proteinGoal = 200): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();

  const { SchedulableTriggerInputTypes } = Notifications;
  const schedule = buildSchedule(proteinGoal);

  await Promise.allSettled(
    schedule.map(({ identifier, title, body, trigger }) => {
      const notifTrigger: Notifications.SchedulableNotificationTriggerInput =
        trigger.type === 'daily'
          ? ({
              type: SchedulableTriggerInputTypes.DAILY,
              hour: trigger.hour,
              minute: trigger.minute,
            } as Notifications.DailyTriggerInput)
          : ({
              type: SchedulableTriggerInputTypes.WEEKLY,
              weekday: (trigger as WeeklyTrigger).weekday,
              hour: trigger.hour,
              minute: trigger.minute,
            } as Notifications.WeeklyTriggerInput);

      return Notifications.scheduleNotificationAsync({
        identifier,
        content: {
          title,
          body,
          sound: true,
          ...(Platform.OS === 'android' ? { channelId: 'iron-discipline' } : {}),
        },
        trigger: notifTrigger,
      });
    })
  );
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
