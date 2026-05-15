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
    await Notifications.setNotificationChannelAsync('iron-discipline', {
      name: 'Iron Discipline',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#3b82f6',
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// weekday: 1=Sun 2=Mon 3=Tue 4=Wed 5=Thu 6=Fri 7=Sat (iOS Calendar convention, expo normalises for Android)
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

const SCHEDULE: Array<{
  identifier: string;
  title: string;
  body: string;
  trigger: WeeklyTrigger | DailyTrigger;
}> = [
  // --- Supplements ---
  {
    identifier: 'supp_morning',
    title: 'Morning Stack',
    body: 'Creatine · Vitamin D3 · Minoxidil — take before breakfast.',
    trigger: { type: 'daily', hour: 8, minute: 0 },
  },
  {
    identifier: 'supp_lunch',
    title: 'Omega-3',
    body: 'Take your fish oil with lunch.',
    trigger: { type: 'daily', hour: 13, minute: 0 },
  },
  {
    identifier: 'supp_night',
    title: 'Magnesium',
    body: 'Magnesium glycinate before sleep. Supports recovery.',
    trigger: { type: 'daily', hour: 22, minute: 0 },
  },
  // --- Workout reminders (training days only) ---
  {
    identifier: 'workout_mon',
    title: 'Push Day',
    body: 'Chest, shoulders, triceps. You know the work.',
    trigger: { type: 'weekly', weekday: 2, hour: 7, minute: 0 },
  },
  {
    identifier: 'workout_tue',
    title: 'Pull Day',
    body: 'Back and biceps. Build the base.',
    trigger: { type: 'weekly', weekday: 3, hour: 7, minute: 0 },
  },
  {
    identifier: 'workout_wed',
    title: 'Leg Day',
    body: "Squats don't care if you're tired.",
    trigger: { type: 'weekly', weekday: 4, hour: 7, minute: 0 },
  },
  {
    identifier: 'workout_fri',
    title: 'Upper Body',
    body: 'Full upper session. Finish the week strong.',
    trigger: { type: 'weekly', weekday: 6, hour: 7, minute: 0 },
  },
  {
    identifier: 'workout_sat',
    title: 'Lower Body',
    body: "Saturday legs. Don't skip.",
    trigger: { type: 'weekly', weekday: 7, hour: 7, minute: 0 },
  },
  // --- Evening workout reminders (training days, if still not done by 7pm) ---
  {
    identifier: 'workout_eve_mon',
    title: 'Workout Reminder',
    body: 'Push day not logged yet. Get to the gym before bed.',
    trigger: { type: 'weekly', weekday: 2, hour: 19, minute: 0 },
  },
  {
    identifier: 'workout_eve_tue',
    title: 'Workout Reminder',
    body: 'Pull day not logged yet. Back and biceps — finish it tonight.',
    trigger: { type: 'weekly', weekday: 3, hour: 19, minute: 0 },
  },
  {
    identifier: 'workout_eve_wed',
    title: 'Workout Reminder',
    body: 'Leg day not logged yet. No shortcuts on Wednesday.',
    trigger: { type: 'weekly', weekday: 4, hour: 19, minute: 0 },
  },
  {
    identifier: 'workout_eve_fri',
    title: 'Workout Reminder',
    body: 'Upper body session pending. End the week strong.',
    trigger: { type: 'weekly', weekday: 6, hour: 19, minute: 0 },
  },
  {
    identifier: 'workout_eve_sat',
    title: 'Workout Reminder',
    body: "Lower day not logged. Finish the week — you're almost there.",
    trigger: { type: 'weekly', weekday: 7, hour: 19, minute: 0 },
  },
  // --- Evening protein check ---
  {
    identifier: 'protein_evening',
    title: 'Protein Check',
    body: 'Have you hit 171g protein today? Top up now if not — sardines, tuna, milk.',
    trigger: { type: 'daily', hour: 20, minute: 0 },
  },
  // --- End-of-day score check ---
  {
    identifier: 'eod_check',
    title: 'Daily Score',
    body: 'Calories on target? Log remaining habits before midnight. Every point counts.',
    trigger: { type: 'daily', hour: 21, minute: 0 },
  },
  // --- Streak break alert ---
  {
    identifier: 'streak_check',
    title: 'Streak Alert',
    body: "Don't let today be a zero. Log sleep and any habit before midnight.",
    trigger: { type: 'daily', hour: 22, minute: 0 },
  },
  // --- Monday weigh-in ---
  {
    identifier: 'weigh_in',
    title: 'Monday Weigh-In',
    body: 'First thing after waking, after toilet, before food. Log your weight.',
    trigger: { type: 'weekly', weekday: 2, hour: 6, minute: 30 },
  },
];

export async function scheduleAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();

  const { SchedulableTriggerInputTypes } = Notifications;

  await Promise.allSettled(
    SCHEDULE.map(({ identifier, title, body, trigger }) => {
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
        content: { title, body, sound: true },
        trigger: notifTrigger,
      });
    })
  );
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
