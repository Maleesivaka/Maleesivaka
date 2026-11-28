# Campus Arts Fest — quiz module setup

This add-on keeps your existing GitHub Pages website and existing festival data intact. It creates separate quiz pages and separate quiz_* database tables.

## Files
- quiz-live.html: public read-only scoreboard
- quiz-admin.html: admin portal
- quiz.js: Supabase client, CRUD and Realtime subscriptions
- quiz.css: responsive styling
- supabase-quiz-setup.sql: tables, RLS and score audit trigger

## 1. Supabase setup
1. Create a project at https://supabase.com/.
2. Copy the Project URL and publishable key (or legacy anon key) from Project Settings/API.
3. Replace PASTE_SUPABASE_PROJECT_URL and PASTE_SUPABASE_PUBLISHABLE_OR_ANON_KEY in quiz.js.
4. Never place a service-role/secret key in browser files.
5. Run supabase-quiz-setup.sql in Supabase SQL Editor.
6. In Supabase Authentication > Users, create the first admin user.
7. Copy that user's UUID and run: insert into public.quiz_admins(user_id) values ('YOUR-AUTH-USER-UUID');
8. In Supabase Database > Publications, enable Realtime for quiz_teams, quiz_rounds, quiz_scores, and quiz_settings if not already enabled.
9. Disable public sign-ups if only invited admins should access the portal.

## 2. GitHub Pages
The files are added beside your existing index.html. After Supabase is configured, open /quiz-live.html for the public board and /quiz-admin.html for administrator login.

## 3. Add website navigation
Add links to these two pages in the existing sidebar if desired:
<a href="quiz-live.html">Live Quiz</a>
<a href="quiz-admin.html">Quiz Admin</a>

## 4. Test before the event
Sign in with the admin account, add test teams and rounds, enter marks, then open the public page on another device and verify live updates. Confirm anonymous visitors cannot write and non-admin accounts cannot modify scores.

## Scope
Dynamic teams and rounds, score entry/correction, non-negative decimal marks, automatic totals/ranking, competition status and live Realtime updates. Score history is recorded, but a history viewer is not included. These files are not ready for live scoring until Supabase setup and testing are complete.