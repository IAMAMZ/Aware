/*
=============================================================
  AWARE APP — DEMO ACCOUNT SEED SCRIPT
=============================================================

STEP 1: Create the account
  - Go to Supabase Dashboard → Authentication → Users → "Invite user"
  - Email: maqarach@lakeheadu.ca
  - After the user is created, confirm/set a password if needed

STEP 2: Get the UUID
  - Go to Table Editor → public.users (or Authentication → Users)
  - Copy the UUID for maqarach@lakeheadu.ca

STEP 3: Replace placeholder
  - Find: REPLACE_WITH_DEMO_USER_UUID
  - Replace with the real UUID (e.g. a1b2c3d4-e5f6-7890-abcd-ef1234567890)

STEP 4: Run this script
  - In Supabase Dashboard → SQL Editor, paste and run this script
  - Or run via psql: psql <connection_string> -f demo_seed.sql
=============================================================
*/

DO $$ 
DECLARE
  v_uid uuid := 'REPLACE_WITH_DEMO_USER_UUID';
BEGIN

-- ============================================================
-- INSERT USER PROFILE
-- ============================================================
INSERT INTO public.users (id, email, timezone, medication_tracking)
VALUES (v_uid, 'maqarach@lakeheadu.ca', 'America/Toronto', true)
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, timezone = EXCLUDED.timezone;

-- ============================================================
-- SLEEP LOGS (30 entries, day 1=2026-02-27 through day 30=2026-03-28)
-- Patterns: weeknights bed 11pm-1am, weekends 1am-3am
--           weekday dur ~6.2h, weekend ~7.8h
--           quality correlates with duration
-- ============================================================

-- Day 1: Fri 2026-02-27 (weekend night → sleep Fri late)
INSERT INTO public.sleep_logs (user_id, date, bedtime, wake_time, duration_hours, quality, sleep_type, pre_sleep_context)
VALUES (v_uid, '2026-02-27', '2026-02-27 23:10:00-05', '2026-02-28 06:00:00-05', 6.8, 3, 'light', ARRAY['screen_time']);

-- Day 2: Sat 2026-02-28 (weekend)
INSERT INTO public.sleep_logs (user_id, date, bedtime, wake_time, duration_hours, quality, sleep_type, pre_sleep_context)
VALUES (v_uid, '2026-02-28', '2026-03-01 01:45:00-05', '2026-03-01 09:30:00-05', 7.75, 4, 'deep', ARRAY['screen_time','meditation']);

-- Day 3: Sun 2026-03-01 (weekend)
INSERT INTO public.sleep_logs (user_id, date, bedtime, wake_time, duration_hours, quality, sleep_type, pre_sleep_context)
VALUES (v_uid, '2026-03-01', '2026-03-02 02:15:00-05', '2026-03-02 10:00:00-05', 7.75, 4, 'deep', ARRAY['screen_time']);

-- Day 4: Mon 2026-03-02 (weekday)
INSERT INTO public.sleep_logs (user_id, date, bedtime, wake_time, duration_hours, quality, sleep_type, pre_sleep_context)
VALUES (v_uid, '2026-03-02', '2026-03-03 00:30:00-05', '2026-03-03 07:00:00-05', 6.5, 3, 'light', ARRAY['screen_time','anxiety']);

-- Day 5: Tue 2026-03-03 (weekday)
INSERT INTO public.sleep_logs (user_id, date, bedtime, wake_time, duration_hours, quality, sleep_type, pre_sleep_context)
VALUES (v_uid, '2026-03-03', '2026-03-04 01:00:00-05', '2026-03-04 05:45:00-05', 4.75, 1, 'restless', ARRAY['screen_time','anxiety','late_meal']);

-- Day 6: Wed 2026-03-04 (weekday)
INSERT INTO public.sleep_logs (user_id, date, bedtime, wake_time, duration_hours, quality, sleep_type, pre_sleep_context)
VALUES (v_uid, '2026-03-04', '2026-03-05 23:45:00-05', '2026-03-05 06:15:00-05', 6.5, 3, 'light', ARRAY['screen_time']);

-- Day 7: Thu 2026-03-05 (weekday)
INSERT INTO public.sleep_logs (user_id, date, bedtime, wake_time, duration_hours, quality, sleep_type, pre_sleep_context)
VALUES (v_uid, '2026-03-05', '2026-03-06 00:50:00-05', '2026-03-06 06:00:00-05', 5.17, 2, 'restless', ARRAY['screen_time','late_meal']);

-- Day 8: Fri 2026-03-06 (weekday)
INSERT INTO public.sleep_logs (user_id, date, bedtime, wake_time, duration_hours, quality, sleep_type, pre_sleep_context)
VALUES (v_uid, '2026-03-06', '2026-03-07 01:10:00-05', '2026-03-07 07:30:00-05', 6.33, 3, 'light', ARRAY['screen_time']);

-- Day 9: Sat 2026-03-07 (weekend)
INSERT INTO public.sleep_logs (user_id, date, bedtime, wake_time, duration_hours, quality, sleep_type, pre_sleep_context)
VALUES (v_uid, '2026-03-07', '2026-03-08 02:00:00-05', '2026-03-08 09:45:00-05', 7.75, 4, 'deep', ARRAY['screen_time','meditation']);

-- Day 10: Sun 2026-03-08 (weekend)
INSERT INTO public.sleep_logs (user_id, date, bedtime, wake_time, duration_hours, quality, sleep_type, pre_sleep_context)
VALUES (v_uid, '2026-03-08', '2026-03-09 01:30:00-05', '2026-03-09 09:00:00-05', 7.5, 4, 'deep', ARRAY['screen_time']);

-- Day 11: Mon 2026-03-09 (weekday)
INSERT INTO public.sleep_logs (user_id, date, bedtime, wake_time, duration_hours, quality, sleep_type, pre_sleep_context)
VALUES (v_uid, '2026-03-09', '2026-03-10 23:30:00-05', '2026-03-10 06:00:00-05', 6.5, 3, 'light', ARRAY['screen_time']);

-- Day 12: Tue 2026-03-10 (weekday) — deadline stress → bad sleep
INSERT INTO public.sleep_logs (user_id, date, bedtime, wake_time, duration_hours, quality, sleep_type, pre_sleep_context)
VALUES (v_uid, '2026-03-10', '2026-03-11 01:30:00-05', '2026-03-11 06:00:00-05', 4.5, 1, 'restless', ARRAY['screen_time','anxiety','late_meal']);

-- Day 13: Wed 2026-03-11 (weekday)
INSERT INTO public.sleep_logs (user_id, date, bedtime, wake_time, duration_hours, quality, sleep_type, pre_sleep_context)
VALUES (v_uid, '2026-03-11', '2026-03-12 00:15:00-05', '2026-03-12 06:30:00-05', 6.25, 3, 'light', ARRAY['screen_time']);

-- Day 14: Thu 2026-03-12 (weekday)
INSERT INTO public.sleep_logs (user_id, date, bedtime, wake_time, duration_hours, quality, sleep_type, pre_sleep_context)
VALUES (v_uid, '2026-03-12', '2026-03-13 00:45:00-05', '2026-03-13 07:00:00-05', 6.25, 3, 'light', ARRAY['screen_time','meditation']);

-- Day 15: Fri 2026-03-13 (weekday)
INSERT INTO public.sleep_logs (user_id, date, bedtime, wake_time, duration_hours, quality, sleep_type, pre_sleep_context)
VALUES (v_uid, '2026-03-13', '2026-03-14 01:00:00-05', '2026-03-14 07:15:00-05', 6.25, 3, 'light', ARRAY['screen_time']);

-- Day 16: Sat 2026-03-14 (weekend)
INSERT INTO public.sleep_logs (user_id, date, bedtime, wake_time, duration_hours, quality, sleep_type, pre_sleep_context)
VALUES (v_uid, '2026-03-14', '2026-03-15 02:30:00-05', '2026-03-15 10:15:00-05', 7.75, 4, 'deep', ARRAY['screen_time','meditation']);

-- Day 17: Sun 2026-03-15 (weekend)
INSERT INTO public.sleep_logs (user_id, date, bedtime, wake_time, duration_hours, quality, sleep_type, pre_sleep_context)
VALUES (v_uid, '2026-03-15', '2026-03-16 01:45:00-05', '2026-03-16 09:30:00-05', 7.75, 4, 'deep', ARRAY['screen_time']);

-- Day 18: Mon 2026-03-16 (weekday)
INSERT INTO public.sleep_logs (user_id, date, bedtime, wake_time, duration_hours, quality, sleep_type, pre_sleep_context)
VALUES (v_uid, '2026-03-16', '2026-03-17 23:50:00-05', '2026-03-17 06:20:00-05', 6.5, 3, 'light', ARRAY['screen_time']);

-- Day 19: Tue 2026-03-17 (weekday)
INSERT INTO public.sleep_logs (user_id, date, bedtime, wake_time, duration_hours, quality, sleep_type, pre_sleep_context)
VALUES (v_uid, '2026-03-17', '2026-03-18 01:20:00-05', '2026-03-18 06:00:00-05', 4.67, 1, 'restless', ARRAY['screen_time','anxiety']);

-- Day 20: Wed 2026-03-18 (weekday)
INSERT INTO public.sleep_logs (user_id, date, bedtime, wake_time, duration_hours, quality, sleep_type, pre_sleep_context)
VALUES (v_uid, '2026-03-18', '2026-03-19 00:00:00-05', '2026-03-19 06:30:00-05', 6.5, 3, 'light', ARRAY['screen_time']);

-- Day 21: Thu 2026-03-19 (weekday)
INSERT INTO public.sleep_logs (user_id, date, bedtime, wake_time, duration_hours, quality, sleep_type, pre_sleep_context)
VALUES (v_uid, '2026-03-19', '2026-03-20 00:30:00-05', '2026-03-20 06:45:00-05', 6.25, 2, 'restless', ARRAY['screen_time','late_meal']);

-- Day 22: Fri 2026-03-20 (weekday)
INSERT INTO public.sleep_logs (user_id, date, bedtime, wake_time, duration_hours, quality, sleep_type, pre_sleep_context)
VALUES (v_uid, '2026-03-20', '2026-03-21 01:00:00-05', '2026-03-21 07:00:00-05', 6.0, 2, 'light', ARRAY['screen_time','late_meal']);

-- Day 23: Sat 2026-03-21 (weekend)
INSERT INTO public.sleep_logs (user_id, date, bedtime, wake_time, duration_hours, quality, sleep_type, pre_sleep_context)
VALUES (v_uid, '2026-03-21', '2026-03-22 02:00:00-05', '2026-03-22 10:00:00-05', 8.0, 5, 'deep', ARRAY['meditation']);

-- Day 24: Sun 2026-03-22 (weekend)
INSERT INTO public.sleep_logs (user_id, date, bedtime, wake_time, duration_hours, quality, sleep_type, pre_sleep_context)
VALUES (v_uid, '2026-03-22', '2026-03-23 01:30:00-05', '2026-03-23 09:00:00-05', 7.5, 4, 'deep', ARRAY['screen_time','meditation']);

-- Day 25: Mon 2026-03-23 (weekday)
INSERT INTO public.sleep_logs (user_id, date, bedtime, wake_time, duration_hours, quality, sleep_type, pre_sleep_context)
VALUES (v_uid, '2026-03-23', '2026-03-24 00:10:00-05', '2026-03-24 06:40:00-05', 6.5, 3, 'light', ARRAY['screen_time']);

-- Day 26: Tue 2026-03-24 (weekday)
INSERT INTO public.sleep_logs (user_id, date, bedtime, wake_time, duration_hours, quality, sleep_type, pre_sleep_context)
VALUES (v_uid, '2026-03-24', '2026-03-25 01:45:00-05', '2026-03-25 06:00:00-05', 4.25, 1, 'restless', ARRAY['screen_time','anxiety','late_meal']);

-- Day 27: Wed 2026-03-25 (weekday)
INSERT INTO public.sleep_logs (user_id, date, bedtime, wake_time, duration_hours, quality, sleep_type, pre_sleep_context)
VALUES (v_uid, '2026-03-25', '2026-03-26 23:30:00-05', '2026-03-26 06:00:00-05', 6.5, 3, 'light', ARRAY['screen_time']);

-- Day 28: Thu 2026-03-26 (weekday)
INSERT INTO public.sleep_logs (user_id, date, bedtime, wake_time, duration_hours, quality, sleep_type, pre_sleep_context)
VALUES (v_uid, '2026-03-26', '2026-03-27 00:30:00-05', '2026-03-27 06:30:00-05', 6.0, 2, 'light', ARRAY['screen_time','late_meal']);

-- Day 29: Fri 2026-03-27 (weekday)
INSERT INTO public.sleep_logs (user_id, date, bedtime, wake_time, duration_hours, quality, sleep_type, pre_sleep_context)
VALUES (v_uid, '2026-03-27', '2026-03-28 00:50:00-05', '2026-03-28 07:00:00-05', 6.17, 3, 'light', ARRAY['screen_time']);

-- Day 30: Sat 2026-03-28 (weekend)
INSERT INTO public.sleep_logs (user_id, date, bedtime, wake_time, duration_hours, quality, sleep_type, pre_sleep_context)
VALUES (v_uid, '2026-03-28', '2026-03-29 02:15:00-05', '2026-03-29 10:00:00-05', 7.75, 4, 'deep', ARRAY['screen_time','meditation']);


-- ============================================================
-- MOOD LOGS (75+ entries)
-- Morning lags previous night's sleep quality
-- Bad sleep days (Day5=Mar3, Day12=Mar11, Day19=Mar18, Day26=Mar25): morning mood 1-2
-- Weekends: mood 3-4
-- ============================================================

-- === 2026-02-27 (Fri) — sleep 6.8h q3 ===
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-02-27 08:15:00-05', 3, ARRAY['okay','tired'], false, false, 'Slept okay, coffee is helping');
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-02-27 13:30:00-05', 3, ARRAY['focused','okay'], false, false, 'Good focus session this morning, feeling alright');
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-02-27 19:45:00-05', 3, ARRAY['tired','okay'], false, false, 'Winding down, bit tired but decent day');

-- === 2026-02-28 (Sat) — woke after 6.8h sleep q3 ===
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-02-28 10:00:00-05', 4, ARRAY['happy','relaxed'], false, false, 'Saturday! No alarm, feeling refreshed');
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-02-28 15:00:00-05', 4, ARRAY['relaxed','okay'], false, false, 'Chill afternoon, watched some stuff');
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-02-28 21:00:00-05', 3, ARRAY['okay','tired'], false, false, 'Getting a bit tired, stayed up late last night');

-- === 2026-03-01 (Sun) — woke after 7.75h q4 ===
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-01 10:30:00-05', 4, ARRAY['happy','energized'], false, false, 'Slept well, Sunday feels good');
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-01 14:00:00-05', 3, ARRAY['okay','relaxed'], false, false, 'Bit anxious about the week ahead');
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-01 20:00:00-05', 3, ARRAY['anxious','okay'], false, false, 'Sunday scaries kicking in, assignments due this week');

-- === 2026-03-02 (Mon) — woke after 7.75h q4 → good morning ===
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-02 07:30:00-05', 4, ARRAY['energized','focused'], false, false, 'Actually slept well last night, ready for the week');
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-02 12:30:00-05', 3, ARRAY['focused','okay'], false, false, 'Good algorithms lecture, had a solid morning session');
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-02 18:00:00-05', 3, ARRAY['tired','okay'], false, false, 'Afternoon dragged, distracted a lot after lunch');

-- === 2026-03-03 (Tue) — woke after 6.5h q3 ===
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-03 07:45:00-05', 3, ARRAY['tired','okay'], false, false, 'Decent sleep, bit groggy still');
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-03 13:00:00-05', 2, ARRAY['anxious','overwhelmed'], true, false, 'SE lecture was stressful, prof called on me and I blanked');
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-03 19:30:00-05', 2, ARRAY['overwhelmed','tired'], true, false, 'Still thinking about what happened in class. Spiraling a bit.');

-- === 2026-03-04 (Wed) — woke after 4.75h q1 → bad morning ===
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-04 07:00:00-05', 1, ARRAY['exhausted','anxious'], false, false, 'Barely slept. Brain would not shut off.');
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-04 12:00:00-05', 2, ARRAY['tired','anxious'], true, true, 'Algorithms lecture was rough, could not focus at all. Prof noticed.');
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-04 17:30:00-05', 2, ARRAY['drained','overwhelmed'], true, false, 'Tried to study but ended up on YouTube for 2 hours');

-- === 2026-03-05 (Thu) — woke after 6.5h q3 ===
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-05 07:30:00-05', 3, ARRAY['okay','tired'], false, false, 'Feeling more human today. That sleep debt was real.');
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-05 14:30:00-05', 2, ARRAY['anxious','tired'], false, false, 'SE class was okay but I zoned out. Afternoon crash hit hard.');
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-05 20:00:00-05', 3, ARRAY['okay','relaxed'], false, false, 'Evening was decent, did some light reading');

-- === 2026-03-06 (Fri) — woke after 5.17h q2 ===
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-06 07:00:00-05', 2, ARRAY['tired','groggy'], false, false, 'Another rough night. At least it is Friday.');
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-06 11:00:00-05', 2, ARRAY['tired','distracted'], false, false, 'Algorithms lecture, tried to pay attention but kept spacing out');
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-06 17:00:00-05', 3, ARRAY['okay','tired'], false, false, 'Survived the week. Weekend mode activating.');

-- === 2026-03-07 (Sat) — woke after 6.33h q3 ===
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-07 09:00:00-05', 3, ARRAY['okay','relaxed'], false, false, 'Slept in a bit, feeling okay');
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-07 14:00:00-05', 4, ARRAY['happy','focused'], false, false, 'Had a good gym session, mood really lifted');
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-07 20:00:00-05', 3, ARRAY['relaxed','okay'], false, false, 'Chilling with friends tonight');

-- === 2026-03-08 (Sun) — woke after 7.75h q4 ===
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-08 10:30:00-05', 4, ARRAY['happy','energized'], false, false, 'Best sleep in a while. Feel like a new person.');
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-08 14:30:00-05', 4, ARRAY['focused','happy'], false, false, 'Got a good study session in, assignment almost done');
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-08 20:00:00-05', 3, ARRAY['okay','anxious'], false, false, 'Sunday scaries mild, feeling more prepared for the week');

-- === 2026-03-09 (Mon) — woke after 7.5h q4 ===
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-09 07:00:00-05', 4, ARRAY['energized','focused'], false, false, 'Weekend rest paid off, feeling sharp');
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-09 12:00:00-05', 4, ARRAY['focused','okay'], false, false, 'Algorithms lecture was actually interesting today');
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-09 18:00:00-05', 3, ARRAY['tired','okay'], false, false, 'Long day but productive. Tired in a good way.');

-- === 2026-03-10 (Tue) — woke after 6.5h q3 ===
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-10 07:30:00-05', 3, ARRAY['okay','tired'], false, false, 'Okay sleep, manageable');
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-10 13:00:00-05', 2, ARRAY['anxious','overwhelmed'], true, false, 'Assignment due tomorrow, realized I misunderstood a whole section');
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-10 21:00:00-05', 2, ARRAY['stressed','exhausted'], true, true, 'Been coding for 5 hours, not even close. Feeling like I cannot do this.');

-- === 2026-03-11 (Wed) — woke after 4.5h q1 → very bad ===
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-11 07:00:00-05', 1, ARRAY['exhausted','anxious','overwhelmed'], true, false, 'Up until 1:30am, woke at 6. Running on empty.');
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-11 11:30:00-05', 1, ARRAY['exhausted','drained'], true, true, 'Submitted the assignment but it was not good. Feel like a failure.');
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-11 17:00:00-05', 2, ARRAY['tired','anxious'], true, false, 'Took a nap, slightly better but still anxious about grades');

-- === 2026-03-12 (Thu) — woke after 6.25h q3 ===
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-12 07:30:00-05', 2, ARRAY['tired','groggy'], false, false, 'Still recovering from Tuesday night. Tired.');
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-12 14:00:00-05', 3, ARRAY['okay','focused'], false, false, 'SE class was fine, starting to feel more normal');
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-12 19:00:00-05', 3, ARRAY['okay','relaxed'], false, false, 'Evening was chill, watched a movie');

-- === 2026-03-13 (Fri) — woke after 6.25h q3 ===
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-13 08:00:00-05', 3, ARRAY['okay','tired'], false, false, 'TGIF, decent sleep');
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-13 12:30:00-05', 3, ARRAY['focused','okay'], false, false, 'Good morning session, algorithms starting to click');
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-13 18:00:00-05', 3, ARRAY['okay','relaxed'], false, false, 'Feeling alright going into the weekend');

-- === 2026-03-14 (Sat) — woke after 6.25h q3 ===
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-14 10:00:00-05', 4, ARRAY['happy','relaxed'], false, false, 'Saturday vibes, no plans til later');
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-14 15:30:00-05', 4, ARRAY['happy','energized'], false, false, 'Gym was great, feeling really good');
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-14 21:00:00-05', 3, ARRAY['relaxed','okay'], false, false, 'Good night with friends, tired but happy');

-- === 2026-03-15 (Sun) — woke after 7.75h q4 ===
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-15 10:00:00-05', 4, ARRAY['happy','energized'], false, false, 'Slept great. Sunday feels good.');
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-15 14:00:00-05', 4, ARRAY['focused','happy'], false, false, 'Got ahead on reading, feeling prepared');
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-15 20:30:00-05', 3, ARRAY['okay','anxious'], false, false, 'Sunday anxiety mild, feeling okay about the week');

-- === 2026-03-16 (Mon) — woke after 7.75h q4 ===
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-16 07:00:00-05', 4, ARRAY['energized','focused'], false, false, 'Two good nights in a row, feeling strong');
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-16 12:00:00-05', 4, ARRAY['focused','okay'], false, false, 'Crushed the morning session, algorithms making sense');
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-16 18:30:00-05', 3, ARRAY['tired','okay'], false, false, 'Afternoon focus slipped but overall solid day');

-- === 2026-03-17 (Tue) — woke after 6.5h q3 ===
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-17 07:30:00-05', 3, ARRAY['okay','tired'], false, false, 'Decent sleep, a bit groggy');
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-17 14:30:00-05', 2, ARRAY['anxious','overwhelmed'], true, false, 'Project proposal due Friday and I have barely started');
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-17 19:30:00-05', 2, ARRAY['stressed','anxious'], true, false, 'Spent 3 hours on YouTube instead of the proposal. Hate myself a bit.');

-- === 2026-03-18 (Wed) — woke after 4.67h q1 → bad ===
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-18 07:00:00-05', 1, ARRAY['exhausted','anxious','drained'], true, false, 'Anxiety kept me up. Terrible night.');
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-18 12:00:00-05', 2, ARRAY['tired','overwhelmed'], true, true, 'Cannot focus at all. Algorithms lecture was a blur. Everyone seems to get it but me.');
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-18 17:30:00-05', 2, ARRAY['drained','anxious'], true, false, 'Managed to write a paragraph of the proposal. Barely.');

-- === 2026-03-19 (Thu) — woke after 6.5h q3 ===
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-19 07:30:00-05', 2, ARRAY['tired','anxious'], false, false, 'Still rough but better than yesterday');
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-19 14:00:00-05', 3, ARRAY['focused','okay'], false, false, 'SE class went okay, got into a flow during office hours review');
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-19 20:00:00-05', 3, ARRAY['okay','tired'], false, false, 'Proposal outline done. Progress.');

-- === 2026-03-20 (Fri) — woke after 6.25h q2 ===
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-20 07:30:00-05', 2, ARRAY['tired','groggy'], false, false, 'Restless night, body is tired');
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-20 12:30:00-05', 3, ARRAY['focused','okay'], false, false, 'Proposal is coming along, morning was productive');
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-20 19:00:00-05', 3, ARRAY['relieved','okay'], false, false, 'Submitted the proposal! Relief.');

-- === 2026-03-21 (Sat) — woke after 6h q2 ===
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-21 09:30:00-05', 3, ARRAY['okay','relaxed'], false, false, 'Slept in a bit, feeling okay');
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-21 14:30:00-05', 4, ARRAY['happy','energized'], false, false, 'Gym was amazing, endorphins doing their thing');
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-21 21:00:00-05', 4, ARRAY['happy','relaxed'], false, false, 'Really good Saturday overall');

-- === 2026-03-22 (Sun) — woke after 8h q5 ===
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-22 10:30:00-05', 5, ARRAY['energized','happy','focused'], false, false, 'Best sleep of the month. Feel incredible.');
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-22 15:00:00-05', 4, ARRAY['focused','happy'], false, false, 'Smashed through my research paper notes');
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-22 20:00:00-05', 4, ARRAY['okay','relaxed'], false, false, 'Good Sunday, feeling ready for the week');

-- === 2026-03-23 (Mon) — woke after 7.5h q4 ===
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-23 07:00:00-05', 4, ARRAY['energized','focused'], false, false, 'Feeling really good this morning');
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-23 12:00:00-05', 4, ARRAY['focused','okay'], false, false, 'Deep work session before class was great, algorithms finally clicking');
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-23 18:00:00-05', 3, ARRAY['tired','okay'], false, false, 'Long day, afternoon was less focused but still good');

-- === 2026-03-24 (Tue) — woke after 6.5h q3 ===
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-24 07:30:00-05', 3, ARRAY['okay','tired'], false, false, 'Decent sleep, fine morning');
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-24 14:30:00-05', 2, ARRAY['anxious','overwhelmed'], true, false, 'Final project specs dropped. Feels like a lot.');
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-24 20:00:00-05', 2, ARRAY['stressed','tired'], true, false, 'Overthinking the project. Ended up procrastinating all evening.');

-- === 2026-03-25 (Wed) — woke after 4.25h q1 → very bad ===
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-25 07:00:00-05', 1, ARRAY['exhausted','anxious','overwhelmed'], true, false, 'Terrible sleep, kept waking up thinking about the project');
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-25 11:30:00-05', 1, ARRAY['exhausted','drained'], true, true, 'Algorithms quiz and I blanked. Could not retrieve anything. So frustrated.');
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-25 17:30:00-05', 2, ARRAY['drained','tired'], true, false, 'Took a nap. A little better but still low.');

-- === 2026-03-26 (Thu) — woke after 6.5h q3 ===
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-26 07:30:00-05', 2, ARRAY['tired','groggy'], false, false, 'Still feeling the effects of bad sleep');
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-26 14:00:00-05', 3, ARRAY['okay','focused'], false, false, 'SE class was good, project group meeting went well');
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-26 19:30:00-05', 3, ARRAY['okay','tired'], false, false, 'Decent evening, made some progress on the project');

-- === 2026-03-27 (Fri) — woke after 6h q2 ===
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-27 08:00:00-05', 2, ARRAY['tired','groggy'], false, false, 'Rough night, light sleep all through');
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-27 12:30:00-05', 3, ARRAY['focused','okay'], false, false, 'Morning session saved the day, got a lot done before class');
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-27 18:30:00-05', 3, ARRAY['relieved','okay'], false, false, 'Friday! Survived. Feeling decent.');

-- === 2026-03-28 (Sat) — woke after 6.17h q3 ===
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-28 09:00:00-05', 3, ARRAY['okay','relaxed'], false, false, 'Saturday, slept in, feeling okay');
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-28 14:00:00-05', 4, ARRAY['happy','energized'], false, false, 'Gym session lifted my mood significantly');
INSERT INTO public.mood_logs (user_id, timestamp, mood_score, emotion_tags, stress_event, rsd_moment, notes)
VALUES (v_uid, '2026-03-28 20:00:00-05', 4, ARRAY['happy','relaxed'], false, false, 'Good end to the week, feeling optimistic');


-- ============================================================
-- FOCUS SESSIONS (80+ entries)
-- Morning 9-11am: deep energy, lo-fi, 70% completed
-- Afternoon 2-4pm: low/autopilot energy, 50% partial/abandoned
-- Bad sleep days: sessions < 60 min total
-- ============================================================

-- === 2026-02-27 (Fri) — sleep was 6.8h q3, decent day ===
INSERT INTO public.focus_sessions (user_id, started_at, ended_at, duration_minutes, task_label, music_type, energy_tag, completion_status, interruption_count, notes)
VALUES (v_uid, '2026-02-27 09:00:00-05', '2026-02-27 10:05:00-05', 65, 'studying algorithms', 'lo-fi', 'deep', 'completed', 1, 'Good morning block, sorting algorithms finally making sense');
INSERT INTO public.focus_sessions (user_id, started_at, ended_at, duration_minutes, task_label, music_type, energy_tag, completion_status, interruption_count, notes)
VALUES (v_uid, '2026-02-27 14:00:00-05', '2026-02-27 14:45:00-05', 45, 'CS assignment', 'lo-fi', 'medium', 'partial', 2, 'Got distracted halfway through');

-- === 2026-02-28 (Sat) — sleep was 6.8h q3, weekend ===
INSERT INTO public.focus_sessions (user_id, started_at, ended_at, duration_minutes, task_label, music_type, energy_tag, completion_status, interruption_count, notes)
VALUES (v_uid, '2026-02-28 11:00:00-05', '2026-02-28 12:00:00-05', 60, 'CS assignment', 'lo-fi', 'medium', 'completed', 1, 'Light weekend session');
INSERT INTO public.focus_sessions (user_id, started_at, ended_at, duration_minutes, task_label, music_type, energy_tag, completion_status, interruption_count, notes)
VALUES (v_uid, '2026-02-28 15:30:00-05', '2026-02-28 16:00:00-05', 30, 'reading', 'silence', 'low', 'partial', 3, 'Too distracted to read effectively');

-- === 2026-03-01 (Sun) — woke 7.75h q4, good energy ===
INSERT INTO public.focus_sessions (user_id, started_at, ended_at, duration_minutes, task_label, music_type, energy_tag, completion_status, interruption_count, notes)
VALUES (v_uid, '2026-03-01 10:00:00-05', '2026-03-01 11:30:00-05', 90, 'research paper', 'lo-fi', 'deep', 'completed', 0, 'Great flow state, got the intro and lit review drafted');
INSERT INTO public.focus_sessions (user_id, started_at, ended_at, duration_minutes, task_label, music_type, energy_tag, completion_status, interruption_count, notes)
VALUES (v_uid, '2026-03-01 14:00:00-05', '2026-03-01 14:40:00-05', 40, 'studying algorithms', 'lo-fi', 'medium', 'partial', 2, 'Afternoon focus not as sharp');

-- === 2026-03-02 (Mon) — woke 7.75h q4 prev night, great day ===
INSERT INTO public.focus_sessions (user_id, started_at, ended_at, duration_minutes, task_label, music_type, energy_tag, completion_status, interruption_count, notes)
VALUES (v_uid, '2026-03-02 09:00:00-05', '2026-03-02 10:45:00-05', 105, 'CS assignment', 'lo-fi', 'deep', 'completed', 0, 'Deep work before algorithms class, knocked out the whole problem set');
INSERT INTO public.focus_sessions (user_id, started_at, ended_at, duration_minutes, task_label, music_type, energy_tag, completion_status, interruption_count, notes)
VALUES (v_uid, '2026-03-02 14:30:00-05', '2026-03-02 15:15:00-05', 45, 'research paper', 'lo-fi', 'medium', 'partial', 3, 'Afternoon focus was okay but kept checking phone');
INSERT INTO public.focus_sessions (user_id, started_at, ended_at, duration_minutes, task_label, music_type, energy_tag, completion_status, interruption_count, notes)
VALUES (v_uid, '2026-03-02 16:00:00-05', '2026-03-02 16:30:00-05', 30, 'reading', 'silence', 'low', 'abandoned', 4, 'Gave up, too noisy in the library');

-- === 2026-03-03 (Tue) — woke 6.5h q3, stress event day ===
INSERT INTO public.focus_sessions (user_id, started_at, ended_at, duration_minutes, task_label, music_type, energy_tag, completion_status, interruption_count, notes)
VALUES (v_uid, '2026-03-03 09:15:00-05', '2026-03-03 10:10:00-05', 55, 'studying algorithms', 'lo-fi', 'medium', 'completed', 1, 'Okay morning session, need to review dynamic programming');
INSERT INTO public.focus_sessions (user_id, started_at, ended_at, duration_minutes, task_label, music_type, energy_tag, completion_status, interruption_count, notes)
VALUES (v_uid, '2026-03-03 15:00:00-05', '2026-03-03 15:20:00-05', 20, 'CS assignment', 'silence', 'autopilot', 'abandoned', 5, 'Could not focus after what happened in class');

-- === 2026-03-04 (Wed) — woke 4.75h q1, BAD SLEEP DAY → <60 min total ===
INSERT INTO public.focus_sessions (user_id, started_at, ended_at, duration_minutes, task_label, music_type, energy_tag, completion_status, interruption_count, notes)
VALUES (v_uid, '2026-03-04 09:30:00-05', '2026-03-04 10:00:00-05', 30, 'studying algorithms', 'lo-fi', 'low', 'abandoned', 5, 'Brain is not working. Staring at the screen.');
INSERT INTO public.focus_sessions (user_id, started_at, ended_at, duration_minutes, task_label, music_type, energy_tag, completion_status, interruption_count, notes)
VALUES (v_uid, '2026-03-04 14:30:00-05', '2026-03-04 14:50:00-05', 20, 'reading', 'silence', 'autopilot', 'abandoned', 5, 'Gave up completely. Too exhausted.');

-- === 2026-03-05 (Thu) — woke 6.5h q3, recovering ===
INSERT INTO public.focus_sessions (user_id, started_at, ended_at, duration_minutes, task_label, music_type, energy_tag, completion_status, interruption_count, notes)
VALUES (v_uid, '2026-03-05 09:00:00-05', '2026-03-05 10:05:00-05', 65, 'CS assignment', 'lo-fi', 'medium', 'completed', 2, 'Better today, got through the assignment questions');
INSERT INTO public.focus_sessions (user_id, started_at, ended_at, duration_minutes, task_label, music_type, energy_tag, completion_status, interruption_count, notes)
VALUES (v_uid, '2026-03-05 15:30:00-05', '2026-03-05 16:00:00-05', 30, 'reading', 'white noise', 'low', 'partial', 3, 'Afternoon drag, managed half the reading');

-- === 2026-03-06 (Fri) — woke 5.17h q2, rough ===
INSERT INTO public.focus_sessions (user_id, started_at, ended_at, duration_minutes, task_label, music_type, energy_tag, completion_status, interruption_count, notes)
VALUES (v_uid, '2026-03-06 09:30:00-05', '2026-03-06 10:10:00-05', 40, 'studying algorithms', 'lo-fi', 'low', 'partial', 4, 'Struggling but pushing through');
INSERT INTO public.focus_sessions (user_id, started_at, ended_at, duration_minutes, task_label, music_type, energy_tag, completion_status, interruption_count, notes)
VALUES (v_uid, '2026-03-06 14:00:00-05', '2026-03-06 14:15:00-05', 15, 'CS assignment', 'silence', 'autopilot', 'abandoned', 5, 'Friday afternoon — completely checked out');

-- === 2026-03-07 (Sat) — weekend, gym day ===
INSERT INTO public.focus_sessions (user_id, started_at, ended_at, duration_minutes, task_label, music_type, energy_tag, completion_status, interruption_count, notes)
VALUES (v_uid, '2026-03-07 11:00:00-05', '2026-03-07 12:15:00-05', 75, 'research paper', 'lo-fi', 'medium', 'completed', 1, 'Good Saturday morning session after coffee');
INSERT INTO public.focus_sessions (user_id, started_at, ended_at, duration_minutes, task_label, music_type, energy_tag, completion_status, interruption_count, notes)
VALUES (v_uid, '2026-03-07 16:30:00-05', '2026-03-07 17:00:00-05', 30, 'reading', 'silence', 'low', 'partial', 2, 'Post-gym, bit tired');

-- === 2026-03-08 (Sun) — woke 7.75h q4, great energy ===
INSERT INTO public.focus_sessions (user_id, started_at, ended_at, duration_minutes, task_label, music_type, energy_tag, completion_status, interruption_count, notes)
VALUES (v_uid, '2026-03-08 10:00:00-05', '2026-03-08 11:30:00-05', 90, 'CS assignment', 'lo-fi', 'deep', 'completed', 0, 'Flow state unlocked. Best session in weeks.');
INSERT INTO public.focus_sessions (user_id, started_at, ended_at, duration_minutes, task_label, music_type, energy_tag, completion_status, interruption_count, notes)
VALUES (v_uid, '2026-03-08 14:00:00-05', '2026-03-08 15:00:00-05', 60, 'studying algorithms', 'lo-fi', 'deep', 'completed', 1, 'Riding the momentum, got through dynamic programming');

-- === 2026-03-09 (Mon) — woke 7.5h q4, good week start ===
INSERT INTO public.focus_sessions (user_id, started_at, ended_at, duration_minutes, task_label, music_type, energy_tag, completion_status, interruption_count, notes)
VALUES (v_uid, '2026-03-09 09:00:00-05', '2026-03-09 10:30:00-05', 90, 'CS assignment', 'lo-fi', 'deep', 'completed', 0, 'Exceptional morning, deep work before algorithms lecture');
INSERT INTO public.focus_sessions (user_id, started_at, ended_at, duration_minutes, task_label, music_type, energy_tag, completion_status, interruption_count, notes)
VALUES (v_uid, '2026-03-09 14:00:00-05', '2026-03-09 14:50:00-05', 50, 'research paper', 'lo-fi', 'medium', 'partial', 2, 'Good but faded after lunch');
INSERT INTO public.focus_sessions (user_id, started_at, ended_at, duration_minutes, task_label, music_type, energy_tag, completion_status, interruption_count, notes)
VALUES (v_uid, '2026-03-09 16:30:00-05', '2026-03-09 17:10:00-05', 40, 'debugging', 'white noise', 'medium', 'completed', 1, 'Fixed that nasty pointer bug finally');

-- === 2026-03-10 (Tue) — woke 6.5h q3, deadline stress ===
INSERT INTO public.focus_sessions (user_id, started_at, ended_at, duration_minutes, task_label, music_type, energy_tag, completion_status, interruption_count, notes)
VALUES (v_uid, '2026-03-10 09:15:00-05', '2026-03-10 10:15:00-05', 60, 'CS assignment', 'lo-fi', 'deep', 'completed', 1, 'Good morning focus despite stress');
INSERT INTO public.focus_sessions (user_id, started_at, ended_at, duration_minutes, task_label, music_type, energy_tag, completion_status, interruption_count, notes)
VALUES (v_uid, '2026-03-10 15:00:00-05', '2026-03-10 15:30:00-05', 30, 'CS assignment', 'silence', 'low', 'partial', 3, 'Too anxious to focus well');
INSERT INTO public.focus_sessions (user_id, started_at, ended_at, duration_minutes, task_label, music_type, energy_tag, completion_status, interruption_count, notes)
VALUES (v_uid, '2026-03-10 19:30:00-05', '2026-03-10 22:00:00-05', 150, 'CS assignment', 'lo-fi', 'medium', 'completed', 2, 'Late night crunch session, got it done but at what cost');

-- === 2026-03-11 (Wed) — woke 4.5h q1, WORST SLEEP → <60 min ===
INSERT INTO public.focus_sessions (user_id, started_at, ended_at, duration_minutes, task_label, music_type, energy_tag, completion_status, interruption_count, notes)
VALUES (v_uid, '2026-03-11 09:30:00-05', '2026-03-11 09:55:00-05', 25, 'studying algorithms', 'lo-fi', 'low', 'abandoned', 5, 'Cannot function. Eyes burning.');
INSERT INTO public.focus_sessions (user_id, started_at, ended_at, duration_minutes, task_label, music_type, energy_tag, completion_status, interruption_count, notes)
VALUES (v_uid, '2026-03-11 15:00:00-05', '2026-03-11 15:25:00-05', 25, 'reading', 'silence', 'autopilot', 'abandoned', 5, 'Post-nap but still wrecked');

-- === 2026-03-12 (Thu) — woke 6.25h q3, recovering ===
INSERT INTO public.focus_sessions (user_id, started_at, ended_at, duration_minutes, task_label, music_type, energy_tag, completion_status, interruption_count, notes)
VALUES (v_uid, '2026-03-12 09:15:00-05', '2026-03-12 10:20:00-05', 65, 'studying algorithms', 'lo-fi', 'medium', 'completed', 2, 'Back to somewhat normal');
INSERT INTO public.focus_sessions (user_id, started_at, ended_at, duration_minutes, task_label, music_type, energy_tag, completion_status, interruption_count, notes)
VALUES (v_uid, '2026-03-12 15:00:00-05', '2026-03-12 15:45:00-05', 45, 'debugging', 'lo-fi', 'medium', 'partial', 2, 'Decent afternoon, fixed one bug');

-- === 2026-03-13 (Fri) — woke 6.25h q3 ===
INSERT INTO public.focus_sessions (user_id, started_at, ended_at, duration_minutes, task_label, music_type, energy_tag, completion_status, interruption_count, notes)
VALUES (v_uid, '2026-03-13 09:00:00-05', '2026-03-13 10:15:00-05', 75, 'CS assignment', 'lo-fi', 'deep', 'completed', 1, 'Strong Friday morning, algorithms are finally clicking');
INSERT INTO public.focus_sessions (user_id, started_at, ended_at, duration_minutes, task_label, music_type, energy_tag, completion_status, interruption_count, notes)
VALUES (v_uid, '2026-03-13 14:30:00-05', '2026-03-13 15:00:00-05', 30, 'reading', 'white noise', 'low', 'partial', 3, 'Afternoon fade');

-- === 2026-03-14 (Sat) — weekend, good mood ===
INSERT INTO public.focus_sessions (user_id, started_at, ended_at, duration_minutes, task_label, music_type, energy_tag, completion_status, interruption_count, notes)
VALUES (v_uid, '2026-03-14 11:00:00-05', '2026-03-14 12:30:00-05', 90, 'research paper', 'lo-fi', 'deep', 'completed', 0, 'Excellent Saturday session, research paper body draft done');

-- === 2026-03-15 (Sun) — woke 7.75h q4, excellent ===
INSERT INTO public.focus_sessions (user_id, started_at, ended_at, duration_minutes, task_label, music_type, energy_tag, completion_status, interruption_count, notes)
VALUES (v_uid, '2026-03-15 10:00:00-05', '2026-03-15 11:45:00-05', 105, 'research paper', 'lo-fi', 'deep', 'completed', 0, 'Polished the research paper, almost done');
INSERT INTO public.focus_sessions (user_id, started_at, ended_at, duration_minutes, task_label, music_type, energy_tag, completion_status, interruption_count, notes)
VALUES (v_uid, '2026-03-15 14:00:00-05', '2026-03-15 14:40:00-05', 40, 'studying algorithms', 'lo-fi', 'medium', 'completed', 1, 'Review session for upcoming content');

-- === 2026-03-16 (Mon) — woke 7.75h q4, peak week ===
INSERT INTO public.focus_sessions (user_id, started_at, ended_at, duration_minutes, task_label, music_type, energy_tag, completion_status, interruption_count, notes)
VALUES (v_uid, '2026-03-16 09:00:00-05', '2026-03-16 10:30:00-05', 90, 'CS assignment', 'lo-fi', 'deep', 'completed', 0, 'Phenomenal morning block. In the zone.');
INSERT INTO public.focus_sessions (user_id, started_at, ended_at, duration_minutes, task_label, music_type, energy_tag, completion_status, interruption_count, notes)
VALUES (v_uid, '2026-03-16 14:00:00-05', '2026-03-16 15:00:00-05', 60, 'debugging', 'lo-fi', 'medium', 'completed', 1, 'Fixed a tricky recursion bug');
INSERT INTO public.focus_sessions (user_id, started_at, ended_at, duration_minutes, task_label, music_type, energy_tag, completion_status, interruption_count, notes)
VALUES (v_uid, '2026-03-16 16:00:00-05', '2026-03-16 16:30:00-05', 30, 'reading', 'white noise', 'low', 'partial', 2, 'Light reading to wind down');

-- === 2026-03-17 (Tue) — woke 6.5h q3, project stress ===
INSERT INTO public.focus_sessions (user_id, started_at, ended_at, duration_minutes, task_label, music_type, energy_tag, completion_status, interruption_count, notes)
VALUES (v_uid, '2026-03-17 09:15:00-05', '2026-03-17 10:15:00-05', 60, 'project proposal', 'lo-fi', 'medium', 'completed', 1, 'Got the proposal outline done before class');
INSERT INTO public.focus_sessions (user_id, started_at, ended_at, duration_minutes, task_label, music_type, energy_tag, completion_status, interruption_count, notes)
VALUES (v_uid, '2026-03-17 15:00:00-05', '2026-03-17 15:20:00-05', 20, 'project proposal', 'silence', 'autopilot', 'abandoned', 5, 'Could not focus after SE class, too stressed about proposal');

-- === 2026-03-18 (Wed) — woke 4.67h q1, BAD SLEEP → <60 min ===
INSERT INTO public.focus_sessions (user_id, started_at, ended_at, duration_minutes, task_label, music_type, energy_tag, completion_status, interruption_count, notes)
VALUES (v_uid, '2026-03-18 09:30:00-05', '2026-03-18 09:55:00-05', 25, 'project proposal', 'lo-fi', 'low', 'abandoned', 5, 'Useless. Cannot think.');
INSERT INTO public.focus_sessions (user_id, started_at, ended_at, duration_minutes, task_label, music_type, energy_tag, completion_status, interruption_count, notes)
VALUES (v_uid, '2026-03-18 16:00:00-05', '2026-03-18 16:25:00-05', 25, 'project proposal', 'silence', 'autopilot', 'partial', 4, 'Wrote one paragraph. Progress I guess.');

-- === 2026-03-19 (Thu) — woke 6.5h q3, recovering ===
INSERT INTO public.focus_sessions (user_id, started_at, ended_at, duration_minutes, task_label, music_type, energy_tag, completion_status, interruption_count, notes)
VALUES (v_uid, '2026-03-19 09:00:00-05', '2026-03-19 10:00:00-05', 60, 'project proposal', 'lo-fi', 'medium', 'completed', 2, 'Wrote the methodology section, feeling okay');
INSERT INTO public.focus_sessions (user_id, started_at, ended_at, duration_minutes, task_label, music_type, energy_tag, completion_status, interruption_count, notes)
VALUES (v_uid, '2026-03-19 15:30:00-05', '2026-03-19 16:15:00-05', 45, 'studying algorithms', 'lo-fi', 'medium', 'partial', 2, 'Graph algorithms review for upcoming lecture');
INSERT INTO public.focus_sessions (user_id, started_at, ended_at, duration_minutes, task_label, music_type, energy_tag, completion_status, interruption_count, notes)
VALUES (v_uid, '2026-03-19 19:00:00-05', '2026-03-19 20:00:00-05', 60, 'project proposal', 'lo-fi', 'medium', 'completed', 1, 'Evening push, got the outline finalized');

-- === 2026-03-20 (Fri) — woke 6.25h q2, deadline day ===
INSERT INTO public.focus_sessions (user_id, started_at, ended_at, duration_minutes, task_label, music_type, energy_tag, completion_status, interruption_count, notes)
VALUES (v_uid, '2026-03-20 09:00:00-05', '2026-03-20 11:00:00-05', 120, 'project proposal', 'lo-fi', 'deep', 'completed', 0, 'Deadline crunch morning, locked in and got it done');
INSERT INTO public.focus_sessions (user_id, started_at, ended_at, duration_minutes, task_label, music_type, energy_tag, completion_status, interruption_count, notes)
VALUES (v_uid, '2026-03-20 15:00:00-05', '2026-03-20 15:30:00-05', 30, 'reading', 'silence', 'low', 'partial', 3, 'Post-submission crash');

-- === 2026-03-21 (Sat) — weekend, gym, good mood ===
INSERT INTO public.focus_sessions (user_id, started_at, ended_at, duration_minutes, task_label, music_type, energy_tag, completion_status, interruption_count, notes)
VALUES (v_uid, '2026-03-21 11:30:00-05', '2026-03-21 12:30:00-05', 60, 'reading', 'lo-fi', 'medium', 'completed', 1, 'Chill Saturday reading session');

-- === 2026-03-22 (Sun) — woke 8h q5, best sleep of month ===
INSERT INTO public.focus_sessions (user_id, started_at, ended_at, duration_minutes, task_label, music_type, energy_tag, completion_status, interruption_count, notes)
VALUES (v_uid, '2026-03-22 09:30:00-05', '2026-03-22 11:30:00-05', 120, 'research paper', 'lo-fi', 'deep', 'completed', 0, 'Best focus session of the month. Nailed the conclusion.');
INSERT INTO public.focus_sessions (user_id, started_at, ended_at, duration_minutes, task_label, music_type, energy_tag, completion_status, interruption_count, notes)
VALUES (v_uid, '2026-03-22 14:00:00-05', '2026-03-22 15:00:00-05', 60, 'studying algorithms', 'lo-fi', 'deep', 'completed', 0, 'Graph algorithms clicking today');

-- === 2026-03-23 (Mon) — woke 7.5h q4, solid week start ===
INSERT INTO public.focus_sessions (user_id, started_at, ended_at, duration_minutes, task_label, music_type, energy_tag, completion_status, interruption_count, notes)
VALUES (v_uid, '2026-03-23 09:00:00-05', '2026-03-23 10:30:00-05', 90, 'CS assignment', 'lo-fi', 'deep', 'completed', 0, 'Strong Monday morning, good sleep paid off');
INSERT INTO public.focus_sessions (user_id, started_at, ended_at, duration_minutes, task_label, music_type, energy_tag, completion_status, interruption_count, notes)
VALUES (v_uid, '2026-03-23 14:00:00-05', '2026-03-23 14:50:00-05', 50, 'debugging', 'lo-fi', 'medium', 'partial', 2, 'Afternoon focus slipped but made progress');
INSERT INTO public.focus_sessions (user_id, started_at, ended_at, duration_minutes, task_label, music_type, energy_tag, completion_status, interruption_count, notes)
VALUES (v_uid, '2026-03-23 16:30:00-05', '2026-03-23 17:00:00-05', 30, 'reading', 'white noise', 'low', 'partial', 2, 'End of day reading');

-- === 2026-03-24 (Tue) — woke 6.5h q3, project stress hits ===
INSERT INTO public.focus_sessions (user_id, started_at, ended_at, duration_minutes, task_label, music_type, energy_tag, completion_status, interruption_count, notes)
VALUES (v_uid, '2026-03-24 09:15:00-05', '2026-03-24 10:15:00-05', 60, 'CS assignment', 'lo-fi', 'medium', 'completed', 1, 'Good morning session before project panic sets in');
INSERT INTO public.focus_sessions (user_id, started_at, ended_at, duration_minutes, task_label, music_type, energy_tag, completion_status, interruption_count, notes)
VALUES (v_uid, '2026-03-24 15:00:00-05', '2026-03-24 15:25:00-05', 25, 'project proposal', 'silence', 'autopilot', 'abandoned', 5, 'Could not start after reading the project specs');

-- === 2026-03-25 (Wed) — woke 4.25h q1, WORST SLEEP → <60 min ===
INSERT INTO public.focus_sessions (user_id, started_at, ended_at, duration_minutes, task_label, music_type, energy_tag, completion_status, interruption_count, notes)
VALUES (v_uid, '2026-03-25 09:30:00-05', '2026-03-25 09:50:00-05', 20, 'studying algorithms', 'lo-fi', 'low', 'abandoned', 5, 'Quiz in an hour, cannot absorb anything');
INSERT INTO public.focus_sessions (user_id, started_at, ended_at, duration_minutes, task_label, music_type, energy_tag, completion_status, interruption_count, notes)
VALUES (v_uid, '2026-03-25 16:30:00-05', '2026-03-25 16:55:00-05', 25, 'reading', 'silence', 'autopilot', 'abandoned', 5, 'Post-nap attempt, still terrible');

-- === 2026-03-26 (Thu) — woke 6.5h q3, recovering ===
INSERT INTO public.focus_sessions (user_id, started_at, ended_at, duration_minutes, task_label, music_type, energy_tag, completion_status, interruption_count, notes)
VALUES (v_uid, '2026-03-26 09:00:00-05', '2026-03-26 10:15:00-05', 75, 'CS assignment', 'lo-fi', 'medium', 'completed', 2, 'Back on track, solid morning');
INSERT INTO public.focus_sessions (user_id, started_at, ended_at, duration_minutes, task_label, music_type, energy_tag, completion_status, interruption_count, notes)
VALUES (v_uid, '2026-03-26 15:00:00-05', '2026-03-26 15:45:00-05', 45, 'debugging', 'lo-fi', 'medium', 'partial', 2, 'Worked on project codebase, found a few issues');
INSERT INTO public.focus_sessions (user_id, started_at, ended_at, duration_minutes, task_label, music_type, energy_tag, completion_status, interruption_count, notes)
VALUES (v_uid, '2026-03-26 19:00:00-05', '2026-03-26 19:45:00-05', 45, 'project proposal', 'lo-fi', 'medium', 'completed', 1, 'Project planning session with team notes');

-- === 2026-03-27 (Fri) — woke 6h q2, light sleep ===
INSERT INTO public.focus_sessions (user_id, started_at, ended_at, duration_minutes, task_label, music_type, energy_tag, completion_status, interruption_count, notes)
VALUES (v_uid, '2026-03-27 09:00:00-05', '2026-03-27 10:15:00-05', 75, 'CS assignment', 'lo-fi', 'medium', 'completed', 1, 'Strong morning despite mediocre sleep');
INSERT INTO public.focus_sessions (user_id, started_at, ended_at, duration_minutes, task_label, music_type, energy_tag, completion_status, interruption_count, notes)
VALUES (v_uid, '2026-03-27 14:00:00-05', '2026-03-27 14:30:00-05', 30, 'reading', 'white noise', 'low', 'partial', 3, 'Friday afternoon, fading fast');

-- === 2026-03-28 (Sat) — weekend, good mood ===
INSERT INTO public.focus_sessions (user_id, started_at, ended_at, duration_minutes, task_label, music_type, energy_tag, completion_status, interruption_count, notes)
VALUES (v_uid, '2026-03-28 11:00:00-05', '2026-03-28 12:15:00-05', 75, 'studying algorithms', 'lo-fi', 'medium', 'completed', 1, 'Good Saturday study session, reviewing for next week');
INSERT INTO public.focus_sessions (user_id, started_at, ended_at, duration_minutes, task_label, music_type, energy_tag, completion_status, interruption_count, notes)
VALUES (v_uid, '2026-03-28 15:30:00-05', '2026-03-28 16:00:00-05', 30, 'debugging', 'lo-fi', 'medium', 'partial', 2, 'Light project work before evening');


-- ============================================================
-- FOOD LOGS (100+ entries)
-- Breakfast: low/zero GI, Lunch: medium/high GI 3x/week
-- Afternoon snacks: often high GI
-- eating_context: planned for meals, impulsive/boredom for snacks
-- ============================================================

-- === 2026-02-27 (Fri) ===
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-02-27 08:00:00-05', 'Oatmeal with banana', 'low', 12, 'meal', 'planned', 3, 'Breakfast');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-02-27 12:30:00-05', 'Chicken wrap with veggies', 'medium', 18, 'meal', 'planned', 4, 'Lunch');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-02-27 15:30:00-05', 'Chips (Doritos)', 'high', 28, 'snack', 'boredom', 2, 'Afternoon snack, was bored studying');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-02-27 18:30:00-05', 'Rice and chicken stir fry', 'medium', 22, 'meal', 'planned', 4, 'Dinner');

-- === 2026-02-28 (Sat) ===
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-02-28 10:30:00-05', 'Scrambled eggs and toast', 'low', 10, 'meal', 'planned', 3, 'Late breakfast');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-02-28 13:30:00-05', 'Pizza (2 slices)', 'high', 35, 'meal', 'social', 4, 'Lunch with friends');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-02-28 16:00:00-05', 'Cookies (3)', 'high', 30, 'snack', 'boredom', 2, 'Afternoon munchies');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-02-28 19:30:00-05', 'Pasta with marinara', 'high', 38, 'meal', 'planned', 5, 'Dinner');

-- === 2026-03-01 (Sun) ===
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-01 10:00:00-05', 'Eggs and avocado toast', 'low', 8, 'meal', 'planned', 3, 'Sunday brunch');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-01 13:00:00-05', 'Turkey sandwich', 'medium', 20, 'meal', 'planned', 4, 'Lunch');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-01 16:00:00-05', 'Apple and peanut butter', 'low', 9, 'snack', 'planned', 2, 'Healthy snack');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-01 19:00:00-05', 'Grilled salmon with vegetables', 'low', 5, 'meal', 'planned', 4, 'Healthy Sunday dinner');

-- === 2026-03-02 (Mon) ===
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-02 07:30:00-05', 'Oatmeal with berries', 'low', 11, 'meal', 'planned', 3, 'Breakfast');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-02 10:00:00-05', 'Coffee (black)', 'zero', 0, 'caffeine', 'planned', 1, 'Pre-lecture coffee');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-02 12:30:00-05', 'Pasta salad', 'high', 32, 'meal', 'planned', 4, 'Cafeteria lunch — pasta was the only option');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-02 15:30:00-05', 'Chocolate bar', 'high', 25, 'snack', 'boredom', 2, 'Vending machine after distraction spiral');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-02 18:30:00-05', 'Chicken and rice bowl', 'medium', 20, 'meal', 'planned', 4, 'Dinner');

-- === 2026-03-03 (Tue) — stress day ===
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-03 08:00:00-05', 'Scrambled eggs', 'zero', 0, 'meal', 'planned', 3, 'Quick breakfast');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-03 10:00:00-05', 'Coffee with milk', 'low', 2, 'caffeine', 'planned', 1, 'Coffee');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-03 12:30:00-05', 'Burger and fries', 'high', 40, 'meal', 'social', 5, 'Stress eating after class incident');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-03 15:30:00-05', 'Cookies', 'high', 28, 'snack', 'stress', 1, 'Stress eating, not even hungry');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-03 19:00:00-05', 'Frozen pizza', 'high', 36, 'meal', 'impulsive', 4, 'Lazy dinner, did not feel like cooking');

-- === 2026-03-04 (Wed) — post bad sleep ===
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-04 08:30:00-05', 'Granola bar', 'medium', 18, 'snack', 'impulsive', 2, 'Grabbed whatever, no appetite but need energy');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-04 10:00:00-05', 'Coffee (double shot)', 'zero', 0, 'caffeine', 'planned', 1, 'Desperate for caffeine');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-04 13:00:00-05', 'Sandwich from cafe', 'medium', 22, 'meal', 'planned', 3, 'Lunch');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-04 16:00:00-05', 'Chips and soda', 'high', 40, 'snack', 'boredom', 2, 'Zoning out on YouTube with snacks');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-04 19:30:00-05', 'Pasta with butter', 'high', 35, 'meal', 'impulsive', 4, 'Quick easy dinner');

-- === 2026-03-05 (Thu) ===
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-05 08:00:00-05', 'Oatmeal', 'low', 13, 'meal', 'planned', 3, 'Breakfast');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-05 12:30:00-05', 'Rice bowl with veggies', 'medium', 20, 'meal', 'planned', 4, 'Decent lunch');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-05 15:30:00-05', 'Pretzels', 'high', 22, 'snack', 'boredom', 2, 'Afternoon snack');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-05 18:30:00-05', 'Chicken and salad', 'low', 8, 'meal', 'planned', 4, 'Healthy dinner');

-- === 2026-03-06 (Fri) ===
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-06 08:30:00-05', 'Eggs and toast', 'low', 10, 'meal', 'planned', 3, 'Breakfast');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-06 12:30:00-05', 'Pasta (cafeteria)', 'high', 38, 'meal', 'planned', 4, 'Cafeteria pasta again');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-06 15:30:00-05', 'Chips', 'high', 26, 'snack', 'glucose_crash', 2, 'Crashed after pasta lunch, grabbed chips');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-06 19:00:00-05', 'Burger and salad', 'medium', 20, 'meal', 'social', 5, 'Friday dinner out');

-- === 2026-03-07 (Sat) ===
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-07 10:00:00-05', 'Eggs benedict', 'medium', 15, 'meal', 'planned', 4, 'Weekend brunch');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-07 13:30:00-05', 'Sandwich and fruit', 'low', 14, 'meal', 'planned', 4, 'Lunch');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-07 16:30:00-05', 'Protein bar', 'medium', 15, 'snack', 'planned', 2, 'Post gym snack');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-07 19:30:00-05', 'Steak and vegetables', 'low', 8, 'meal', 'social', 5, 'Dinner with friends');

-- === 2026-03-08 (Sun) ===
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-08 10:00:00-05', 'Greek yogurt with granola', 'low', 12, 'meal', 'planned', 3, 'Sunday breakfast');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-08 13:00:00-05', 'Chicken salad wrap', 'low', 14, 'meal', 'planned', 4, 'Healthy lunch');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-08 16:00:00-05', 'Almonds and apple', 'low', 7, 'snack', 'planned', 2, 'Healthy snack');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-08 19:00:00-05', 'Salmon and roasted veg', 'low', 6, 'meal', 'planned', 4, 'Good Sunday dinner');

-- === 2026-03-09 (Mon) ===
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-09 07:30:00-05', 'Oatmeal with honey', 'low', 14, 'meal', 'planned', 3, 'Breakfast');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-09 10:00:00-05', 'Coffee', 'zero', 0, 'caffeine', 'planned', 1, 'Pre-class coffee');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-09 12:30:00-05', 'Sub sandwich', 'medium', 24, 'meal', 'planned', 4, 'Lunch');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-09 15:30:00-05', 'Chips', 'high', 26, 'snack', 'boredom', 2, 'After office hours, munching');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-09 19:00:00-05', 'Rice bowl with beef', 'medium', 22, 'meal', 'planned', 4, 'Dinner');

-- === 2026-03-10 (Tue) — deadline stress ===
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-10 08:00:00-05', 'Eggs and toast', 'low', 10, 'meal', 'planned', 3, 'Breakfast');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-10 12:30:00-05', 'Pizza slice (2)', 'high', 34, 'meal', 'impulsive', 4, 'Quick lunch, deadline stress');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-10 16:00:00-05', 'Chocolate and cookies', 'high', 32, 'snack', 'stress', 2, 'Stress snacking while coding');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-10 21:30:00-05', 'Instant ramen', 'high', 30, 'meal', 'impulsive', 3, 'Late night coding fuel');

-- === 2026-03-11 (Wed) — post bad sleep ===
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-11 09:00:00-05', 'Coffee (double)', 'zero', 0, 'caffeine', 'planned', 1, 'Need caffeine desperately');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-11 10:30:00-05', 'Granola bar', 'medium', 18, 'snack', 'impulsive', 2, 'No appetite but need something');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-11 13:00:00-05', 'Sandwich', 'medium', 20, 'meal', 'planned', 3, 'Forced myself to eat lunch');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-11 16:30:00-05', 'Chips', 'high', 28, 'snack', 'boredom', 1, 'Zombie eating on the couch');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-11 19:00:00-05', 'Frozen meal', 'medium', 25, 'meal', 'impulsive', 3, 'Too tired to cook');

-- === 2026-03-12 (Thu) ===
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-12 08:00:00-05', 'Oatmeal', 'low', 13, 'meal', 'planned', 3, 'Breakfast');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-12 12:30:00-05', 'Chicken rice bowl', 'medium', 20, 'meal', 'planned', 4, 'Lunch');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-12 15:30:00-05', 'Apple', 'low', 6, 'snack', 'planned', 2, 'Healthy snack choice today');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-12 19:00:00-05', 'Pasta with meat sauce', 'high', 36, 'meal', 'planned', 4, 'Dinner');

-- === 2026-03-13 (Fri) ===
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-13 08:00:00-05', 'Eggs and avocado', 'zero', 2, 'meal', 'planned', 3, 'Breakfast');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-13 12:30:00-05', 'Burger', 'high', 38, 'meal', 'social', 4, 'Friday lunch with classmates');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-13 15:30:00-05', 'Soda and chips', 'high', 35, 'snack', 'glucose_crash', 2, 'Post-burger crash, grabbed more sugar (bad call)');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-13 19:00:00-05', 'Grilled chicken and rice', 'medium', 18, 'meal', 'planned', 4, 'Healthy dinner to compensate');

-- === 2026-03-14 (Sat) ===
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-14 10:00:00-05', 'Pancakes with syrup', 'high', 42, 'meal', 'social', 4, 'Weekend treat brunch');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-14 13:30:00-05', 'Salad with grilled chicken', 'low', 7, 'meal', 'planned', 3, 'Light lunch');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-14 17:00:00-05', 'Protein shake', 'low', 10, 'snack', 'planned', 2, 'Post-gym shake');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-14 20:00:00-05', 'Pizza with friends', 'high', 36, 'meal', 'social', 5, 'Saturday night pizza');

-- === 2026-03-15 (Sun) — great sleep, good eating ===
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-15 09:30:00-05', 'Greek yogurt parfait', 'low', 10, 'meal', 'planned', 3, 'Healthy Sunday breakfast');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-15 13:00:00-05', 'Grilled salmon wrap', 'low', 12, 'meal', 'planned', 4, 'Good lunch');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-15 16:00:00-05', 'Mixed nuts', 'low', 5, 'snack', 'planned', 1, 'Healthy snack');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-15 19:00:00-05', 'Chicken tikka with basmati', 'medium', 22, 'meal', 'planned', 4, 'Dinner');

-- === 2026-03-16 (Mon) ===
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-16 07:30:00-05', 'Oatmeal and coffee', 'low', 13, 'meal', 'planned', 3, 'Good start to the week');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-16 12:30:00-05', 'Pasta salad (cafeteria)', 'high', 32, 'meal', 'planned', 4, 'Cafeteria lunch');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-16 15:30:00-05', 'Chips and soda', 'high', 38, 'snack', 'glucose_crash', 2, 'Energy crash after pasta, made it worse');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-16 19:00:00-05', 'Stir fry with tofu', 'low', 10, 'meal', 'planned', 4, 'Good dinner');

-- === 2026-03-17 (Tue) — project proposal stress ===
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-17 08:00:00-05', 'Eggs and fruit', 'low', 8, 'meal', 'planned', 3, 'Breakfast');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-17 12:30:00-05', 'Burger and fries', 'high', 42, 'meal', 'stress', 4, 'Stress eating before SE class');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-17 15:30:00-05', 'Cookies and chips', 'high', 35, 'snack', 'glucose_crash', 2, 'Crashed hard after fries, grabbed more carbs');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-17 19:30:00-05', 'Frozen pizza', 'high', 34, 'meal', 'impulsive', 3, 'Too stressed to cook');

-- === 2026-03-18 (Wed) — terrible sleep ===
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-18 09:00:00-05', 'Coffee (triple shot)', 'zero', 0, 'caffeine', 'planned', 1, 'Survival coffee');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-18 10:30:00-05', 'Granola bar', 'medium', 20, 'snack', 'impulsive', 1, 'Not hungry but need fuel');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-18 13:00:00-05', 'Sandwich', 'medium', 22, 'meal', 'planned', 3, 'Forced lunch');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-18 16:30:00-05', 'Chips', 'high', 28, 'snack', 'boredom', 2, 'Zombie snacking');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-18 19:30:00-05', 'Instant noodles', 'high', 30, 'meal', 'impulsive', 3, 'Too tired to cook properly');

-- === 2026-03-19 (Thu) — recovering ===
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-19 08:00:00-05', 'Oatmeal', 'low', 13, 'meal', 'planned', 3, 'Back to normal breakfast');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-19 12:30:00-05', 'Rice bowl', 'medium', 20, 'meal', 'planned', 4, 'Decent lunch');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-19 15:30:00-05', 'Apple and almond butter', 'low', 8, 'snack', 'planned', 2, 'Healthier snack today');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-19 19:00:00-05', 'Chicken and vegetables', 'low', 8, 'meal', 'planned', 4, 'Healthy dinner');

-- === 2026-03-20 (Fri) — proposal deadline ===
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-20 08:00:00-05', 'Eggs and coffee', 'zero', 2, 'meal', 'planned', 3, 'Breakfast before deadline push');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-20 12:00:00-05', 'Pizza', 'high', 36, 'meal', 'impulsive', 4, 'Deadline lunch break');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-20 15:30:00-05', 'Chips', 'high', 26, 'snack', 'glucose_crash', 2, 'Post-pizza slump');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-20 20:00:00-05', 'Celebratory burger', 'high', 38, 'meal', 'social', 5, 'Submitted the proposal! Treating myself.');

-- === 2026-03-21 (Sat) — gym day, good mood ===
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-21 10:00:00-05', 'Scrambled eggs and fruit', 'low', 9, 'meal', 'planned', 3, 'Weekend breakfast');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-21 13:00:00-05', 'Chicken salad', 'low', 8, 'meal', 'planned', 4, 'Healthy lunch');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-21 17:00:00-05', 'Protein shake', 'low', 10, 'snack', 'planned', 2, 'Post-gym');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-21 20:00:00-05', 'Pasta and garlic bread', 'high', 42, 'meal', 'social', 5, 'Dinner out, treated myself');

-- === 2026-03-22 (Sun) — best sleep of month ===
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-22 09:00:00-05', 'Oatmeal with berries and chia', 'low', 11, 'meal', 'planned', 3, 'Nourishing breakfast');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-22 12:30:00-05', 'Grilled chicken salad', 'low', 7, 'meal', 'planned', 4, 'Healthy Sunday lunch');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-22 15:30:00-05', 'Mixed nuts and berries', 'low', 6, 'snack', 'planned', 1, 'Healthy snack');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-22 19:00:00-05', 'Salmon and quinoa', 'low', 10, 'meal', 'planned', 4, 'Great Sunday dinner');

-- === 2026-03-23 (Mon) ===
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-23 07:30:00-05', 'Eggs and oatmeal', 'low', 12, 'meal', 'planned', 3, 'Solid breakfast');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-23 12:30:00-05', 'Pasta salad', 'high', 32, 'meal', 'planned', 4, 'Cafeteria pasta');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-23 15:30:00-05', 'Chips', 'high', 28, 'snack', 'glucose_crash', 2, 'Crash after pasta lunch again');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-23 19:00:00-05', 'Stir fry with rice', 'medium', 20, 'meal', 'planned', 4, 'Dinner');

-- === 2026-03-24 (Tue) — project specs stress ===
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-24 08:00:00-05', 'Eggs and coffee', 'zero', 2, 'meal', 'planned', 3, 'Breakfast');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-24 12:30:00-05', 'Burger and fries', 'high', 40, 'meal', 'stress', 4, 'Stress-ate lunch after seeing project specs');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-24 15:30:00-05', 'Chocolate bar', 'high', 28, 'snack', 'glucose_crash', 2, 'Crashed after fries');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-24 19:30:00-05', 'Frozen pizza', 'high', 35, 'meal', 'impulsive', 3, 'Procrastinated cooking too');

-- === 2026-03-25 (Wed) — worst sleep of recent period ===
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-25 09:00:00-05', 'Coffee (double)', 'zero', 0, 'caffeine', 'planned', 1, 'Need caffeine');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-25 11:00:00-05', 'Granola bar', 'medium', 18, 'snack', 'impulsive', 2, 'Pre-quiz fuel');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-25 13:30:00-05', 'Sandwich', 'medium', 22, 'meal', 'planned', 3, 'Lunch');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-25 16:30:00-05', 'Chips and cookies', 'high', 38, 'snack', 'stress', 2, 'Stress eating after the quiz');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-25 19:30:00-05', 'Instant ramen', 'high', 30, 'meal', 'impulsive', 3, 'Comfort food after rough day');

-- === 2026-03-26 (Thu) ===
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-26 08:00:00-05', 'Oatmeal and fruit', 'low', 12, 'meal', 'planned', 3, 'Back to healthy breakfast');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-26 12:30:00-05', 'Rice bowl with chicken', 'medium', 20, 'meal', 'planned', 4, 'Decent lunch');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-26 15:30:00-05', 'Pretzels', 'high', 22, 'snack', 'boredom', 2, 'Afternoon snack');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-26 19:00:00-05', 'Grilled chicken and veg', 'low', 8, 'meal', 'planned', 4, 'Good dinner');

-- === 2026-03-27 (Fri) ===
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-27 08:00:00-05', 'Eggs and toast', 'low', 10, 'meal', 'planned', 3, 'Breakfast');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-27 12:30:00-05', 'Burger and salad', 'medium', 24, 'meal', 'social', 4, 'Friday lunch');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-27 15:30:00-05', 'Chips', 'high', 26, 'snack', 'glucose_crash', 2, 'Post-lunch slump');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-27 19:30:00-05', 'Pizza with friends', 'high', 36, 'meal', 'social', 5, 'Friday dinner out');

-- === 2026-03-28 (Sat) ===
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-28 10:00:00-05', 'Pancakes', 'high', 40, 'meal', 'social', 4, 'Weekend treat');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-28 13:30:00-05', 'Chicken caesar salad', 'low', 8, 'meal', 'planned', 3, 'Healthy lunch');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-28 17:00:00-05', 'Protein bar', 'medium', 14, 'snack', 'planned', 2, 'Post-gym snack');
INSERT INTO public.food_logs (user_id, timestamp, food_name, gi_category, gl_value, meal_type, eating_context, hunger_level, notes)
VALUES (v_uid, '2026-03-28 20:00:00-05', 'Spaghetti bolognese', 'high', 38, 'meal', 'planned', 5, 'Saturday evening dinner');

