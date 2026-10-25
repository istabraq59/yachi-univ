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