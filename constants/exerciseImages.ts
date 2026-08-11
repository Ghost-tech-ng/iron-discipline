import * as FileSystem from 'expo-file-system/legacy';

// All URLs sourced from wger.de live scan — open-source fitness DB (CC licence)
// Every key below matches an exercise id used in constants/workouts.ts. wger has no
// photo at all for a suitcase carry, so that one stays unmapped (ExerciseCard skips
// rendering when the url is null). Stomach vacuum and side plank also have no exact
// photo — they use the closest visual proxy wger has (hollow hold / front plank).
const IMAGE_URLS: Record<string, string> = {
  // ── Legs A (Monday) ───────────────────────────────────────────
  back_squat:            'https://wger.de/media/exercise-images/1801/60043328-1cfb-4289-9865-aaf64d5aaa28.jpg',
  hack_squat:            'https://wger.de/media/exercise-images/130/Narrow-stance-hack-squats-1-1024x721.png',
  leg_ext:               'https://wger.de/media/exercise-images/369/78c915d1-e46d-4d30-8124-65d68664c3ef.png',
  walking_lunge:         'https://wger.de/media/exercise-images/113/Walking-lunges-1.png',
  seated_leg_curl_mon:   'https://wger.de/media/exercise-images/117/seated-leg-curl-large-1.png',
  back_ext_45:           'https://wger.de/media/exercise-images/1348/a3769120-2445-49f2-97d3-afc1238bfc2a.webp',
  standing_calf:         'https://wger.de/media/exercise-images/146/8b284904-d072-4381-a256-4c81d8fd9c1f.png',
  cable_crunch_mon:      'https://wger.de/media/exercise-images/91/Crunches-1.png',
  vacuum_mon:            'https://wger.de/media/exercise-images/297/b10d3341-baa8-49ab-b462-5b3529389aac.png',

  // ── Push ──────────────────────────────────────────────────────
  incline_db_press:      'https://wger.de/media/exercise-images/16/Incline-press-1.png',
  bench_press:           'https://wger.de/media/exercise-images/192/Bench-press-1.png',
  weighted_dip:          'https://wger.de/media/exercise-images/194/34600351-8b0b-4cb0-8daa-583537be15b0.png',
  low_high_fly:          'https://wger.de/media/exercise-images/122/Incline-cable-flyes-1.png',
  seated_ohp:            'https://wger.de/media/exercise-images/123/dumbbell-shoulder-press-large-1.png',
  lateral_raises_tue:    'https://wger.de/media/exercise-images/148/lateral-dumbbell-raises-large-2.png',
  oh_tricep_ext:         'https://wger.de/media/exercise-images/659/a60452f1-e2ea-43fe-baa6-c1a2208d060c.png',
  rope_pushdown:         'https://wger.de/media/exercise-images/805/7a437824-e2cc-46e1-804a-674f0ea31d25.png',
  hanging_leg_raise_tue: 'https://wger.de/media/exercise-images/979/27097a3a-5749-428d-b94c-6082afe390f6.png',

  // ── Pull ──────────────────────────────────────────────────────
  deadlift:              'https://wger.de/media/exercise-images/184/1709c405-620a-4d07-9658-fade2b66a2df.jpeg',
  weighted_pullups:      'https://wger.de/media/exercise-images/475/b0554016-16fd-4dbe-be47-a2a17d16ae0e.jpg',
  chest_supported_row:   'https://wger.de/media/exercise-images/1283/e7262f70-7512-408a-8d00-4c499ef632fc.jpg',
  single_arm_pulldown:   'https://wger.de/media/exercise-images/158/02e8a7c3-dc67-434e-a4bc-77fdecf84b49.webp',
  face_pulls:            'https://wger.de/media/exercise-images/1639/8927346e-f5ca-4795-bdf1-5ac9309401e7.webp',
  bb_curl:               'https://wger.de/media/exercise-images/74/Bicep-curls-1.png',
  incline_db_curl:       'https://wger.de/media/exercise-images/81/Biceps-curl-1.png',
  pallof_press_wed:      'https://wger.de/media/exercise-images/1194/074e1766-4208-4a67-a211-9721772d99b0.png',

  // ── Legs B (Friday) ───────────────────────────────────────────
  rdl_fri:               'https://wger.de/media/exercise-images/1652/0306c8c0-70cc-45d4-92de-6fa72ceaa834.webp',
  seated_leg_curl_fri:   'https://wger.de/media/exercise-images/117/seated-leg-curl-large-1.png',
  hip_thrust:            'https://wger.de/media/exercise-images/1642/a81ad922-caf5-47f8-99b4-640cb0717436.webp',
  bulgarian_split:       'https://wger.de/media/exercise-images/988/6283b258-a4d7-4833-84f7-a38987022d3d.png',
  roman_chair_ext:       'https://wger.de/media/exercise-images/128/Hyperextensions-1.png',
  leg_press_high:        'https://wger.de/media/exercise-images/371/d2136f96-3a43-4d4c-9944-1919c4ca1ce1.webp',
  seated_calf:           'https://wger.de/media/exercise-images/1620/edd40e39-e337-4460-a8dd-6127d40ddd16.jpeg',
  decline_crunch:        'https://wger.de/media/exercise-images/1648/63ae02d6-6dd9-4e9e-84da-d4905e78a33c.jpg',
  dead_bug:              'https://wger.de/media/exercise-images/978/d3ffe51f-7eb8-4cc9-9eae-105847af3005.png',
  vacuum_fri:            'https://wger.de/media/exercise-images/297/b10d3341-baa8-49ab-b462-5b3529389aac.png',

  // ── Upper (Saturday) ──────────────────────────────────────────
  incline_bb_press:      'https://wger.de/media/exercise-images/41/Incline-bench-press-1.png',
  pullups_sat:           'https://wger.de/media/exercise-images/475/b0554016-16fd-4dbe-be47-a2a17d16ae0e.jpg',
  pec_deck:              'https://wger.de/media/exercise-images/926/ae9deb5d-a1e9-4c30-b1e3-c128ba5d4969.png',
  tbar_row:              'https://wger.de/media/exercise-images/106/T-bar-row-1.png',
  cable_lateral:         'https://wger.de/media/exercise-images/1378/7c1fcf34-fb7e-45e7-a0c1-51f296235315.jpg',
  rear_delt_fly:         'https://wger.de/media/exercise-images/822/74affc0d-03b6-4f33-b5f4-a822a2615f68.png',
  skull_crushers:        'https://wger.de/media/exercise-images/84/Lying-close-grip-triceps-press-to-chin-1.png',
  hammer_curl:           'https://wger.de/media/exercise-images/86/Bicep-hammer-curl-1.png',
  ab_wheel_sat:          'https://wger.de/media/exercise-images/1573/a9ab402b-61ef-4d60-b91a-df52bf7f41a9.jpg',
  side_plank_sat:        'https://wger.de/media/exercise-images/458/b7bd9c28-9f1d-4647-bd17-ab6a3adf5770.png',
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
