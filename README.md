# Yachi University – Student Management

A small web app for managing students, courses, enrollments and grades.
Built with plain HTML and JavaScript, [Supabase](https://supabase.com)
(database and sign-in) and GitHub Pages (hosting).

Live site: https://istabraq59.github.io/yachi-univ/

## What it does

- Three roles: **administrator**, **teacher** and **student**. Each sees only what it should.
- **Administrator:** students, enrollments and rosters, courses, academic years and
  semesters, teachers and course assignments, approving new sign-ups, and reports with CSV download.
- **Teacher:** sees the students in their own courses and enters grades for them.
- **Student:** sees their own record, enrollments, grades and transcript (letter grade and GPA).
- New people sign up themselves; an administrator links each account to a student or teacher record.

## Security

Access rules are enforced by the database (Supabase Row Level Security), not by the page.
Hiding a button is only cosmetic. The page contains only the public "publishable" key.
Never put a secret or `service_role` key in this repository.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Page layout, sign-in, students, enrollments and roster |
| `config.js` | Supabase project URL and publishable key |
| `grades.js` | Grade entry and transcript |
| `roles.js` | Hides controls by role, phone layout, typed confirmations |
| `signup.js` | Sign-up form, pending accounts, "waiting for approval" notice |
| `reports-page.js` | Reports and CSV export |
| `teachers.js` | Teachers, course assignments, approving teachers |
| `courses.js` | Courses, academic years and semesters |

## Run it locally

```
npx --yes http-server -a 127.0.0.1 -p 8080
```

Then open http://127.0.0.1:8080

## Publish

Commit and push to the `main` branch. GitHub Pages updates in about a minute.

## Notes

- Free Supabase projects can pause after a period of no use. If the site stops
  loading, open the Supabase dashboard and restore the project.
- The built-in Supabase email sender allows only a few emails per hour. Connect
  your own email service (SMTP) before many people sign up.
---

## Features and files (updated 2026-10-26)

### What each role sees
- **Administrator:** everything: pending accounts, teachers, courses and semesters, students, enrollments, grades, reports with CSV, attendance, announcements (post and delete), grade audit log, accounts (deactivate / reactivate).
- **Teacher:** only students and courses assigned to them: class roster, grades, attendance, announcements meant for teachers or everyone.
- **Student:** only their own record: grades, transcript, attendance, announcements meant for students or everyone.
- **New sign-up (not yet approved):** sees a "waiting for approval" message and no data until the school office links or approves the account.

### Files
- `index.html`: the page and the sign-in box. It loads the scripts below, in this order.
- `config.js`: the Supabase address and the **publishable** key (safe to be public). Never put a secret key here.
- `grades.js`, `roles.js`, `signup.js`, `reports-page.js`, `teachers.js`, `courses.js`: students, roles, sign-up and approval, reports, teachers, courses and semesters.
- `forgot.js`: "Forgot password?" link and the new-password box.
- `google.js`: "Continue with Google" button.
- `attendance.js`: take attendance, view a summary, download CSV; students see their own.
- `auditlog.js`: admin-only list of grade changes.
- `announcements.js`: post and read announcements.
- `accounts.js`: admin-only list of logins with Deactivate / Reactivate.
- `authmsg.js`: shows sign-in errors that come back in the web address (for example a deactivated account after Google sign-in).
- `privacy.html`: the privacy policy page (linked from the bottom of the main page and from Google Cloud).

### How a feature is added
Each feature is one small file plus one `<script>` line in `index.html`. All of them use the shared `db` object from `index.html` and read the signed-in role from `body[data-role]`. Security is **not** in these files: it is enforced by the database rules (see the `sms` repository, `db/functions.sql`). Hiding a card in the browser is only for convenience.

### Deploy
`git add`, `git commit`, `git push`. GitHub Pages publishes in about a minute. If a push times out, run `git push` again when the network is better; the commit is safe on the phone.

### Web addresses that are written into the code
If the site address ever changes (for example a custom domain), update these:
- `forgot.js` and `google.js`: the `redirectTo` address.
- `signup.js`: the `emailRedirectTo` check for `github.io`.
- `privacy.html`: the website line.
- Supabase: Authentication, URL Configuration (Site URL and Redirect URLs).
- Google Cloud: Auth Platform, Branding (home page, privacy link, authorised domain).

### Known limits
- Confirmation and reset emails are sent through Gmail (about 500 per day).
- Google sign-in branding verification is still pending; the sign-in screen may look plain.
- Do not delete the login of a real teacher or student: it breaks the link to their record. Use **Deactivate** instead.
