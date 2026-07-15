# APPSC Group-2 Geography Mock Test

Online mock test web application for **జ్యోతిరావు ఫూలే స్టడీ సర్కిల్, శ్రీకాకుళం** (Jyotirao Phule Study Circle, Srikakulam). Subject: **Geography (భౌగోళిక శాస్త్రం)**. Interface, questions and options are entirely in **Telugu**.

- 100-question exam (currently 20 sample questions loaded — see "Adding questions" below)
- 150-minute timer with auto-submit, 15-min and 5-min warnings
- 1 mark per correct answer, **1/3 negative marking** for wrong answers
- **Single attempt per student**, enforced by unique mobile number in the database
- Results automatically written to `results.xlsx`

## Tech stack
Flask (Python) · SQLite · vanilla HTML/CSS/JS · openpyxl for Excel export · Noto Sans Telugu font.

## Project structure
```
Mock test/
├── app.py               # Flask backend (routes, scoring, DB, xlsx export)
├── questions.json       # Question bank — edit this to add questions
├── requirements.txt
├── Procfile             # for gunicorn hosting
├── templates/
│   ├── register.html    # student registration
│   ├── instructions.html
│   ├── test.html        # exam interface
│   └── result.html      # score summary
├── static/
│   ├── css/style.css
│   └── js/test.js       # timer, navigator, fullscreen, submit
├── mocktest.db          # SQLite DB (auto-created on first run)
└── results.xlsx         # results export (auto-created after first submission)
```

## Run locally
```bash
pip install -r requirements.txt
python app.py
```
Then open **http://127.0.0.1:5000** in a browser.

> **First run:** if a `mocktest.db` file already exists in this folder, delete it once before starting so the app creates a fresh database. The database and `results.xlsx` are created automatically.

## Adding questions (reaching 100)
Open `questions.json` and add more objects to the `questions` array, following this exact format:
```json
{
  "id": 21,
  "topic": "ఆర్థిక భౌగోళికం",
  "question": "ప్రశ్న తెలుగులో…?",
  "options": { "A": "…", "B": "…", "C": "…", "D": "…" },
  "correct": "B",
  "explanation": "వివరణ తెలుగులో…"
}
```
- Keep each `id` unique and sequential.
- `correct` must be one of `A`, `B`, `C`, `D`. On screen these show as **అ, బ, స, ద**.
- Suggested topic distribution: 25 Physical, 25 Economic, 25 Human, 25 AP-specific.
- The app automatically uses however many questions are in the file. The navigator and total are driven by the data.

## Downloading results
Results are appended to `results.xlsx` in this folder after each submission — open it directly.
There is also a protected download route:
```
http://127.0.0.1:5000/download-results?key=admin123
```
Change the key by setting the `ADMIN_KEY` environment variable before running.

## Deployment
This is a **stateful Flask + SQLite** app, so it needs a host that runs a persistent Python server with a writable disk.

**Note on Netlify:** Netlify is a static/JAMstack host and **cannot run this app as-is** — it has no persistent Python server and no persistent database (serverless functions have an ephemeral filesystem, so SQLite data and the single-attempt lock would be lost). Use one of these instead:

- **Render** (free tier): New → Web Service → connect repo → Build `pip install -r requirements.txt` → Start `gunicorn app:app`. Add a persistent disk for `mocktest.db`/`results.xlsx`.
- **Railway**: deploy the repo; it detects the `Procfile` (`gunicorn app:app`).
- **PythonAnywhere**: upload files, set up a Flask web app pointing to `app.py`.

Before any public deployment: set a strong `SECRET_KEY` and `ADMIN_KEY` via environment variables, and turn off debug mode (`app.run(debug=False)` or run via gunicorn as above).

If Netlify hosting is a hard requirement, the app would need to be rebuilt as a static front-end plus an external database (e.g. Netlify Functions + a hosted DB like Supabase/Firebase) — happy to do that as a separate version, but it changes the architecture from what was specified.
```
