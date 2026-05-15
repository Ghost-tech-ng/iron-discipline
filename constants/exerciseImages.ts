// Maps our exercise IDs to wger.de exercise base IDs (free, open-source fitness DB)
// Image URLs fetched lazily from https://wger.de/api/v2/exerciseimage/
const WGER_IDS: Record<string, number> = {
  bench_press: 192,
  incline_db_press: 263,
  cable_fly: 247,
  ohp_mon: 65,
  ohp_fri: 65,
  lateral_raises_mon: 171,
  lateral_raises_fri: 171,
  rope_pushdown: 115,
  oh_tricep_ext: 73,
  deadlift: 29,
  barbell_row: 166,
  cable_row: 212,
  lat_pulldown: 159,
  face_pulls: 362,
  bb_curl: 88,
  hammer_curl: 195,
  back_squat: 111,
  leg_press: 225,
  leg_press_high: 225,
  hack_squat: 354,
  leg_ext: 72,
  rdl_wed: 69,
  rdl_sat: 69,
  leg_curl_wed: 116,
  leg_curl_sat: 116,
  standing_calf: 285,
  seated_calf: 206,
  cable_crunch_wed: 308,
  cable_crunch_sat: 308,
  plank_wed: 47,
  weighted_pullups: 4,
  incline_bb_press: 196,
  tbar_row: 167,
  rear_delt_fly: 188,
  skull_crushers: 80,
  incline_db_curl: 222,
  bulgarian_split: 368,
  hip_thrust: 349,
  hanging_leg_raise: 10,
};

const cache: Record<string, string | null> = {};

export async function getExerciseImageUrl(exerciseId: string): Promise<string | null> {
  if (exerciseId in cache) return cache[exerciseId];

  const wgerId = WGER_IDS[exerciseId];
  if (!wgerId) {
    cache[exerciseId] = null;
    return null;
  }

  try {
    const res = await fetch(
      `https://wger.de/api/v2/exerciseimage/?format=json&exercise_base=${wgerId}&is_main=True`,
      { headers: { Accept: 'application/json' } }
    );
    if (!res.ok) throw new Error('fetch failed');
    const data = await res.json() as { results: { image: string }[] };
    const imagePath = data.results?.[0]?.image;
    const url = imagePath ? `https://wger.de${imagePath}` : null;
    cache[exerciseId] = url;
    return url;
  } catch {
    cache[exerciseId] = null;
    return null;
  }
}
