import * as FileSystem from 'expo-file-system/legacy';

// All URLs sourced from wger.de live scan — open-source fitness DB (CC licence)
const IMAGE_URLS: Record<string, string> = {
  // ── Push — Chest ──────────────────────────────────────────────
  bench_press:        'https://wger.de/media/exercise-images/192/Bench-press-1.png',
  incline_db_press:   'https://wger.de/media/exercise-images/16/Incline-press-1.png',
  incline_bb_press:   'https://wger.de/media/exercise-images/41/Incline-bench-press-1.png',
  cable_fly:          'https://wger.de/media/exercise-images/71/Cable-crossover-2.png',

  // ── Push — Shoulders ──────────────────────────────────────────
  ohp_mon:            'https://wger.de/media/exercise-images/119/seated-barbell-shoulder-press-large-1.png',
  ohp_fri:            'https://wger.de/media/exercise-images/119/seated-barbell-shoulder-press-large-1.png',
  lateral_raises_mon: 'https://wger.de/media/exercise-images/148/lateral-dumbbell-raises-large-2.png',
  lateral_raises_fri: 'https://wger.de/media/exercise-images/148/lateral-dumbbell-raises-large-2.png',

  // ── Push — Triceps ────────────────────────────────────────────
  rope_pushdown:      'https://wger.de/media/exercise-images/805/7a437824-e2cc-46e1-804a-674f0ea31d25.png',
  oh_tricep_ext:      'https://wger.de/media/exercise-images/659/a60452f1-e2ea-43fe-baa6-c1a2208d060c.png',
  skull_crushers:     'https://wger.de/media/exercise-images/84/Lying-close-grip-triceps-press-to-chin-1.png',

  // ── Pull — Back ───────────────────────────────────────────────
  deadlift:           'https://wger.de/media/exercise-images/184/1709c405-620a-4d07-9658-fade2b66a2df.jpeg',
  barbell_row:        'https://wger.de/media/exercise-images/109/Barbell-rear-delt-row-1.png',
  cable_row:          'https://wger.de/media/exercise-images/512/b938437e-ff00-4679-9036-acb41bb28bbd.png',
  lat_pulldown:       'https://wger.de/media/exercise-images/158/02e8a7c3-dc67-434e-a4bc-77fdecf84b49.webp',
  tbar_row:           'https://wger.de/media/exercise-images/106/T-bar-row-1.png',
  weighted_pullups:   'https://wger.de/media/exercise-images/475/b0554016-16fd-4dbe-be47-a2a17d16ae0e.jpg',
  db_shrugs:          'https://wger.de/media/exercise-images/151/Dumbbell-shrugs-2.png',

  // ── Pull — Rear Delt ──────────────────────────────────────────
  face_pulls:         'https://wger.de/media/exercise-images/822/74affc0d-03b6-4f33-b5f4-a822a2615f68.png',
  rear_delt_fly:      'https://wger.de/media/exercise-images/829/ad724e5c-b1ed-49e8-9279-a17545b0dd0b.png',

  // ── Pull — Biceps ─────────────────────────────────────────────
  bb_curl:            'https://wger.de/media/exercise-images/74/Bicep-curls-1.png',
  hammer_curl:        'https://wger.de/media/exercise-images/86/Bicep-hammer-curl-1.png',
  incline_db_curl:    'https://wger.de/media/exercise-images/81/Biceps-curl-1.png',

  // ── Legs — Quads ──────────────────────────────────────────────
  back_squat:         'https://wger.de/media/exercise-images/191/Front-squat-1-857x1024.png',
  leg_press:          'https://wger.de/media/exercise-images/371/d2136f96-3a43-4d4c-9944-1919c4ca1ce1.webp',
  leg_press_high:     'https://wger.de/media/exercise-images/371/d2136f96-3a43-4d4c-9944-1919c4ca1ce1.webp',
  hack_squat:         'https://wger.de/media/exercise-images/130/Narrow-stance-hack-squats-1-1024x721.png',
  leg_ext:            'https://wger.de/media/exercise-images/369/78c915d1-e46d-4d30-8124-65d68664c3ef.png',
  bulgarian_split:    'https://wger.de/media/exercise-images/113/Walking-lunges-1.png',

  // ── Legs — Hamstrings / Glutes ────────────────────────────────
  rdl_wed:            'https://wger.de/media/exercise-images/184/1709c405-620a-4d07-9658-fade2b66a2df.jpeg',
  rdl_sat:            'https://wger.de/media/exercise-images/184/1709c405-620a-4d07-9658-fade2b66a2df.jpeg',
  leg_curl_wed:       'https://wger.de/media/exercise-images/154/lying-leg-curl-machine-large-1.png',
  leg_curl_sat:       'https://wger.de/media/exercise-images/154/lying-leg-curl-machine-large-1.png',
  hip_thrust:         'https://wger.de/media/exercise-images/128/Hyperextensions-1.png',

  // ── Legs — Calves ─────────────────────────────────────────────
  standing_calf:      'https://wger.de/media/exercise-images/146/8b284904-d072-4381-a256-4c81d8fd9c1f.png',
  seated_calf:        'https://wger.de/media/exercise-images/146/8b284904-d072-4381-a256-4c81d8fd9c1f.png',

  // ── Core ──────────────────────────────────────────────────────
  cable_crunch_wed:   'https://wger.de/media/exercise-images/91/Crunches-1.png',
  cable_crunch_sat:   'https://wger.de/media/exercise-images/91/Crunches-1.png',
  plank_wed:          'https://wger.de/media/exercise-images/458/b7bd9c28-9f1d-4647-bd17-ab6a3adf5770.png',
  hanging_leg_raise:  'https://wger.de/media/exercise-images/125/Leg-raises-2.png',
  ab_wheel_mon:       'https://wger.de/media/exercise-images/41/34b37423-269f-43d4-9d29-d2a90eeaa6b4.png',
  ab_wheel_fri:       'https://wger.de/media/exercise-images/41/34b37423-269f-43d4-9d29-d2a90eeaa6b4.png',
  side_plank:         'https://wger.de/media/exercise-images/1091/50c8912d-54ef-46c9-99d1-633b6196aa1e.jpg',
  pallof_press_tue:   'https://wger.de/media/exercise-images/1194/074e1766-4208-4a67-a211-9721772d99b0.png',
  pallof_press_sat:   'https://wger.de/media/exercise-images/1194/074e1766-4208-4a67-a211-9721772d99b0.png',
  dead_bug:           'https://wger.de/media/exercise-images/978/d3ffe51f-7eb8-4cc9-9eae-105847af3005.png',
  cable_woodchop_wed: 'https://wger.de/media/exercise-images/1089/49f51716-535d-41dd-aeb5-cff5bb906bc1.jpeg',
  cable_woodchop_sat: 'https://wger.de/media/exercise-images/1089/49f51716-535d-41dd-aeb5-cff5bb906bc1.jpeg',
  russian_twist:      'https://wger.de/media/exercise-images/1193/70ca5d80-3847-4a8c-8882-c6e9e485e29e.png',
};

const memCache: Record<string, string | null> = {};

function ext(url: string): string {
  const match = url.match(/\.(png|jpg|jpeg|webp)(\?|$)/i);
  return match ? `.${match[1].toLowerCase()}` : '.png';
}

export async function getExerciseImageUrl(exerciseId: string): Promise<string | null> {
  if (exerciseId in memCache) return memCache[exerciseId];

  const remoteUrl = IMAGE_URLS[exerciseId];
  if (!remoteUrl) {
    memCache[exerciseId] = null;
    return null;
  }

  try {
    const cacheDir = FileSystem.documentDirectory
      ? `${FileSystem.documentDirectory}exercise_images/`
      : null;

    if (cacheDir) {
      const localPath = `${cacheDir}${exerciseId}${ext(remoteUrl)}`;

      const info = await FileSystem.getInfoAsync(localPath);
      if (info.exists) {
        memCache[exerciseId] = localPath;
        return localPath;
      }

      const dirInfo = await FileSystem.getInfoAsync(cacheDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });
      }

      const result = await FileSystem.downloadAsync(remoteUrl, localPath);
      if (result.status === 200) {
        memCache[exerciseId] = result.uri;
        return result.uri;
      }
    }
  } catch {
    // fall through to remote URL
  }

  // Always fall back to remote so images work online even if caching fails
  memCache[exerciseId] = remoteUrl;
  return remoteUrl;
}
