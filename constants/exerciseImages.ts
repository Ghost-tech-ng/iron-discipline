import * as FileSystem from 'expo-file-system/legacy';

// All URLs sourced from wger.de (open-source fitness DB, CC licence). Each one was
// checked against wger's image index, not the folder number in the path, which is
// not a reliable exercise id. Exercises with no honest photo on wger (Nordic curl,
// sliding curl, suitcase carry, dead bug, side plank) stay unmapped; ExerciseCard
// renders no image rather than a misleading one.
const WGER = 'https://wger.de/media/exercise-images/';

const IMAGE_URLS: Record<string, string> = {
  // ── Legs A (Monday) ───────────────────────────────────────────
  back_squat:            '1801/60043328-1cfb-4289-9865-aaf64d5aaa28.jpg',
  hack_squat:            '130/Narrow-stance-hack-squats-1-1024x721.png',
  leg_ext:               '369/78c915d1-e46d-4d30-8124-65d68664c3ef.png',
  walking_lunge:         '113/Walking-lunges-1.png',
  back_ext_45:           '1348/a3769120-2445-49f2-97d3-afc1238bfc2a.webp',
  standing_calf:         '622/9a429bd0-afd3-4ad0-8043-e9beec901c81.jpeg',
  cable_crunch_mon:      '91/Crunches-1.png',
  vacuum_mon:            '2673/71e1dd6a-c407-45bd-a082-e0e6f5226eb6.jpg',

  // ── Push ──────────────────────────────────────────────────────
  incline_db_press:      '16/Incline-press-1.png',
  bench_press:           '192/Bench-press-1.png',
  weighted_dip:          '194/34600351-8b0b-4cb0-8daa-583537be15b0.png',
  low_high_fly:          '122/Incline-cable-flyes-1.png',
  seated_ohp:            '123/dumbbell-shoulder-press-large-1.png',
  lateral_raises_tue:    '148/lateral-dumbbell-raises-large-2.png',
  oh_tricep_ext:         '659/a60452f1-e2ea-43fe-baa6-c1a2208d060c.png',
  rope_pushdown:         '805/7a437824-e2cc-46e1-804a-674f0ea31d25.png',
  hanging_leg_raise_tue: '979/27097a3a-5749-428d-b94c-6082afe390f6.png',

  // ── Pull ──────────────────────────────────────────────────────
  deadlift:              '184/1709c405-620a-4d07-9658-fade2b66a2df.jpeg',
  weighted_pullups:      '475/b0554016-16fd-4dbe-be47-a2a17d16ae0e.jpg',
  chest_supported_row:   '1283/e7262f70-7512-408a-8d00-4c499ef632fc.jpg',
  single_arm_pulldown:   '158/02e8a7c3-dc67-434e-a4bc-77fdecf84b49.webp',
  face_pulls:            '1732/d13b9adb-968e-4f73-95e6-b16690bcf616.jpg',
  bb_curl:               '74/Bicep-curls-1.png',
  incline_db_curl:       '81/Biceps-curl-1.png',
  pallof_press_wed:      '1194/074e1766-4208-4a67-a211-9721772d99b0.png',

  // ── Legs B (Friday) ───────────────────────────────────────────
  rdl_fri:               '507/13d526ab-12fc-461e-828a-051dd7c13fb1.png',
  hip_thrust:            '1642/a81ad922-caf5-47f8-99b4-640cb0717436.webp',
  bulgarian_split:       '988/6283b258-a4d7-4833-84f7-a38987022d3d.png',
  roman_chair_ext:       '128/Hyperextensions-1.png',
  leg_press_high:        '371/d2136f96-3a43-4d4c-9944-1919c4ca1ce1.webp',
  seated_calf:           '1620/edd40e39-e337-4460-a8dd-6127d40ddd16.jpeg',
  decline_crunch:        '93/Decline-crunch-1.png',
  vacuum_fri:            '2673/71e1dd6a-c407-45bd-a082-e0e6f5226eb6.jpg',

  // ── Upper (Saturday) ──────────────────────────────────────────
  incline_bb_press:      '41/Incline-bench-press-1.png',
  pullups_sat:           '475/b0554016-16fd-4dbe-be47-a2a17d16ae0e.jpg',
  pec_deck:              '926/ae9deb5d-a1e9-4c30-b1e3-c128ba5d4969.png',
  tbar_row:              '106/T-bar-row-1.png',
  cable_lateral:         '1378/7c1fcf34-fb7e-45e7-a0c1-51f296235315.jpg',
  rear_delt_fly:         '822/74affc0d-03b6-4f33-b5f4-a822a2615f68.png',
  skull_crushers:        '84/Lying-close-grip-triceps-press-to-chin-1.png',
  hammer_curl:           '86/Bicep-hammer-curl-1.png',
  ab_wheel_sat:          '1573/a9ab402b-61ef-4d60-b91a-df52bf7f41a9.jpg',
};

// Keyed by the exact swap string in constants/workouts.ts. Swaps without an entry
// render with no image — never the original exercise's image.
const SWAP_IMAGE_URLS: Record<string, string> = {
  'Front Squat':                                  '191/Front-squat-1-857x1024.png',
  'Smith Machine Squat':                          '1747/af9647dd-04ec-4adf-9c07-4e33edb77277.jpg',
  'Leg Press (feet low and narrow)':              '371/d2136f96-3a43-4d4c-9944-1919c4ca1ce1.webp',
  'Reverse Lunge':                                '1651/04ab2679-a04d-4d05-9c85-0d36e898328c.webp',
  'Dumbbell Reverse Lunge':                       '1651/04ab2679-a04d-4d05-9c85-0d36e898328c.webp',
  'Step-Up (knee-height box)':                    '981/f9377a7e-eb58-4cca-b805-2d36863aeb03.png',
  'Good Morning (light)':                         '1392/a02c9c7d-f42d-43e0-9946-1b99b014daee.png',
  'Hyperextension bench':                         '128/Hyperextensions-1.png',
  'Weighted 45° Back Extension':                  '128/Hyperextensions-1.png',
  'Lying Leg Curl (machine)':                     '154/lying-leg-curl-machine-large-1.png',
  'Weighted Decline Crunch':                      '93/Decline-crunch-1.png',
  'Weighted Floor Crunch':                        '1648/63ae02d6-6dd9-4e9e-84da-d4905e78a33c.jpg',
  'Incline Smith Press':                          '925/67dbb1c9-b378-46f9-adb6-1f55b3d3007a.png',
  'Incline Dumbbell Press':                       '16/Incline-press-1.png',
  'Dumbbell Bench Press':                         '97/Dumbbell-bench-press-1.png',
  'Machine Chest Press':                          '129/b263c968-e067-4750-916a-d8758a7df23e.webp',
  'Decline Barbell Press':                        '100/Decline-bench-press-1.png',
  'Machine Shoulder Press':                       '53/Shoulder-press-machine-1.png',
  'Seated Barbell Overhead Press':                '119/seated-barbell-shoulder-press-large-1.png',
  'Cable Lateral Raise':                          '1378/7c1fcf34-fb7e-45e7-a0c1-51f296235315.jpg',
  'Machine Lateral Raise':                        '1654/aa724a58-b3b5-4522-b278-1155416236a5.jpg',
  'Lean-Away Dumbbell Lateral Raise':             '148/lateral-dumbbell-raises-large-2.png',
  'Close-Grip Bench Press':                       '88/Narrow-grip-bench-press-1.png',
  "Captain's Chair Knee Raise":                   '978/d3ffe51f-7eb8-4cc9-9eae-105847af3005.png',
  'Lying Leg Raise':                              '125/Leg-raises-1.png',
  'Rack Pull (below knee)':                       '161/Dead-lifts-1.png',
  'Machine Row':                                  '1725/f0ebd44e-b8e1-400c-b598-ca371f3a07af.png',
  'Seated Cable Row (close grip)':                '143/Cable-seated-rows-1.png',
  'Neutral-Grip Lat Pulldown':                    '1136/5778a8e9-c606-4843-89c8-9d9469eeb6e4.PNG',
  'One-Arm Dumbbell Row (long stretch)':          '1186/1987a039-cf35-437e-bbdc-40c53dd7d053.jpg',
  'Band Face Pull':                               '1732/d13b9adb-968e-4f73-95e6-b16690bcf616.jpg',
  'Incline Bench Reverse Fly':                    '828/2e959dab-f39b-4c7c-9063-eb43064ab5eb.png',
  'Cable Rear Delt Fly':                          '822/74affc0d-03b6-4f33-b5f4-a822a2615f68.png',
  'EZ-Bar Curl':                                  '94/6dee2f60-aea2-4f2d-9bf6-aef50c4f9483.png',
  'Dumbbell Curl':                                '81/Biceps-curl-1.png',
  'Preacher Curl':                                '193/Preacher-curl-3-1.png',
  'Rope Cable Hammer Curl':                       '138/Hammer-curls-with-rope-1.png',
  'Dumbbell Romanian Deadlift':                   '1652/0306c8c0-70cc-45d4-92de-6fa72ceaa834.webp',
  'Glute Bridge (barbell)':                       '265/7528acb4-b2cc-4b75-b6ae-d514cbd4f78b.png',
  'Seated Dumbbell Calf Raise (weight on knees)': '1620/edd40e39-e337-4460-a8dd-6127d40ddd16.jpeg',
  'Cable Fly (chest height)':                     '71/Cable-crossover-1.png',
  'Flat Dumbbell Fly':                            '238/2fc242d3-5bdd-4f97-99bd-678adb8c96fc.png',
  'Barbell Rollout':                              '41/34b37423-269f-43d4-9d29-d2a90eeaa6b4.png',
};

const memCache: Record<string, string | null> = {};

function ext(url: string): string {
  const match = url.match(/\.(png|jpg|jpeg|webp)(\?|$)/i);
  return match ? `.${match[1].toLowerCase()}` : '.png';
}

/** Cache key safe for a filename. Prefixing keeps swap files apart from exercise ids. */
function swapKey(name: string): string {
  return `swap_${name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}`;
}

async function resolveCached(cacheKey: string, path: string | undefined): Promise<string | null> {
  if (cacheKey in memCache) return memCache[cacheKey];
  if (!path) {
    memCache[cacheKey] = null;
    return null;
  }
  const remoteUrl = `${WGER}${path}`;

  try {
    const cacheDir = FileSystem.documentDirectory
      ? `${FileSystem.documentDirectory}exercise_images/`
      : null;

    if (cacheDir) {
      // The URL's file stem is part of the name so a corrected mapping never serves
      // the stale image cached under the same exercise id.
      const stem = path.split('/').pop()?.replace(/\.[a-z]+$/i, '').slice(0, 12) ?? '';
      const localPath = `${cacheDir}${cacheKey}_${stem}${ext(remoteUrl)}`;

      const info = await FileSystem.getInfoAsync(localPath);
      if (info.exists) {
        memCache[cacheKey] = localPath;
        return localPath;
      }

      const dirInfo = await FileSystem.getInfoAsync(cacheDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });
      }

      const result = await FileSystem.downloadAsync(remoteUrl, localPath);
      if (result.status === 200) {
        memCache[cacheKey] = result.uri;
        return result.uri;
      }
    }
  } catch {
    // fall through to remote URL
  }

  // Always fall back to remote so images work online even if caching fails
  memCache[cacheKey] = remoteUrl;
  return remoteUrl;
}

export function getExerciseImageUrl(exerciseId: string): Promise<string | null> {
  return resolveCached(exerciseId, IMAGE_URLS[exerciseId]);
}

export function getSwapImageUrl(swapName: string): Promise<string | null> {
  return resolveCached(swapKey(swapName), SWAP_IMAGE_URLS[swapName]);
}
