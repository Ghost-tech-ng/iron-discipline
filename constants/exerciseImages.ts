// All URLs verified against wger.de live image list (open-source fitness DB, CC licence)
const IMAGE_URLS: Record<string, string> = {
  // Push — chest/shoulders/triceps
  bench_press:        'https://wger.de/media/exercise-images/192/Bench-press-1.png',
  incline_db_press:   'https://wger.de/media/exercise-images/41/Incline-bench-press-1.png',
  incline_bb_press:   'https://wger.de/media/exercise-images/41/Incline-bench-press-1.png',
  cable_fly:          'https://wger.de/media/exercise-images/71/Cable-crossover-2.png',
  ohp_mon:            'https://wger.de/media/exercise-images/119/seated-barbell-shoulder-press-large-1.png',
  ohp_fri:            'https://wger.de/media/exercise-images/119/seated-barbell-shoulder-press-large-1.png',
  lateral_raises_mon: 'https://wger.de/media/exercise-images/148/lateral-dumbbell-raises-large-2.png',
  lateral_raises_fri: 'https://wger.de/media/exercise-images/148/lateral-dumbbell-raises-large-2.png',
  skull_crushers:     'https://wger.de/media/exercise-images/84/Lying-close-grip-triceps-press-to-chin-1.png',
  rope_pushdown:      'https://wger.de/media/exercise-images/84/Lying-close-grip-triceps-press-to-chin-1.png',
  oh_tricep_ext:      'https://wger.de/media/exercise-images/84/Lying-close-grip-triceps-press-to-chin-1.png',

  // Pull — back/biceps
  deadlift:           'https://wger.de/media/exercise-images/161/Dead-lifts-2.png',
  barbell_row:        'https://wger.de/media/exercise-images/110/Reverse-grip-bent-over-rows-1.png',
  tbar_row:           'https://wger.de/media/exercise-images/106/T-bar-row-1.png',
  cable_row:          'https://wger.de/media/exercise-images/143/Cable-seated-rows-2.png',
  lat_pulldown:       'https://wger.de/media/exercise-images/181/Chin-ups-2.png',
  face_pulls:         'https://wger.de/media/exercise-images/109/Barbell-rear-delt-row-1.png',
  rear_delt_fly:      'https://wger.de/media/exercise-images/109/Barbell-rear-delt-row-1.png',
  weighted_pullups:   'https://wger.de/media/exercise-images/181/Chin-ups-2.png',
  bb_curl:            'https://wger.de/media/exercise-images/129/Standing-biceps-curl-1.png',
  hammer_curl:        'https://wger.de/media/exercise-images/86/Bicep-hammer-curl-1.png',
  incline_db_curl:    'https://wger.de/media/exercise-images/129/Standing-biceps-curl-1.png',

  // Legs
  back_squat:         'https://wger.de/media/exercise-images/191/Front-squat-1-857x1024.png',
  leg_press:          'https://wger.de/media/exercise-images/130/Narrow-stance-hack-squats-1-1024x721.png',
  leg_press_high:     'https://wger.de/media/exercise-images/130/Narrow-stance-hack-squats-1-1024x721.png',
  hack_squat:         'https://wger.de/media/exercise-images/130/Narrow-stance-hack-squats-1-1024x721.png',
  bulgarian_split:    'https://wger.de/media/exercise-images/113/Walking-lunges-1.png',
  rdl_wed:            'https://wger.de/media/exercise-images/161/Dead-lifts-2.png',
  rdl_sat:            'https://wger.de/media/exercise-images/161/Dead-lifts-2.png',
  leg_curl_wed:       'https://wger.de/media/exercise-images/154/lying-leg-curl-machine-large-1.png',
  leg_curl_sat:       'https://wger.de/media/exercise-images/154/lying-leg-curl-machine-large-1.png',
  leg_ext:            'https://wger.de/media/exercise-images/117/seated-leg-curl-large-1.png',
  hip_thrust:         'https://wger.de/media/exercise-images/128/Hyperextensions-1.png',
  standing_calf:      'https://wger.de/media/exercise-images/118/standing-leg-curls-large-1.png',
  seated_calf:        'https://wger.de/media/exercise-images/117/seated-leg-curl-large-1.png',

  // Core
  cable_crunch_wed:   'https://wger.de/media/exercise-images/91/Crunches-1.png',
  cable_crunch_sat:   'https://wger.de/media/exercise-images/91/Crunches-1.png',
  plank_wed:          'https://wger.de/media/exercise-images/176/Cross-body-crunch-1.png',
  hanging_leg_raise:  'https://wger.de/media/exercise-images/125/Leg-raises-2.png',
};

const verified: Record<string, string | null> = {};

export async function getExerciseImageUrl(exerciseId: string): Promise<string | null> {
  if (exerciseId in verified) return verified[exerciseId];

  const url = IMAGE_URLS[exerciseId];
  if (!url) {
    verified[exerciseId] = null;
    return null;
  }

  // When offline, trust the hardcoded URL
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, { method: 'HEAD', signal: controller.signal });
    clearTimeout(timeout);
    verified[exerciseId] = res.ok ? url : null;
  } catch {
    verified[exerciseId] = url;
  }

  return verified[exerciseId];
}
