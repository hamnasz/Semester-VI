# Semester VI — Field Journal

A static "academic diary" frontend for [`hamnasz/Semester-VI`](https://github.com/hamnasz/Semester-VI) —
every lecture slide, lab manual, scanned note, and half-finished assignment from the term,
browsable, searchable, and previewable straight in the browser.

**There is no manifest, no build step, and no copy of the course files in this repo.**
On every visit, the app calls the GitHub REST API live to fetch the *current* file tree of
`Semester-VI`, then renders it. Push a new file to that repo and it shows up here the next
time someone opens the journal — nothing to regenerate, nothing to redeploy.

```
index.html          the app shell — cover page + archive + file-viewer overlay
css/style.css        the entire design system (paper texture, cards, states, responsive rules)
js/github-api.js      the ONLY file that talks to GitHub — tree fetch, raw/blob URL builders
js/viewers.js         file-type detection + all inline renderers and "clean fallback" cards
js/app.js             routing, search/filter, card rendering, the viewer overlay, downloads
test/                 an optional headless smoke test (see "Running the tests" below)
```

## How it works

1. **On load**, `js/app.js` calls `GitHubAPI.fetchTree()`, which hits
   `GET /repos/hamnasz/Semester-VI/git/trees/main?recursive=1` — one API call returns the
   *entire* file tree (every folder and file, with path + size). That single response is kept
   in memory for the rest of the session; every click, search, and filter afterwards is pure
   client-side filtering of that array. No manifest file, no per-folder round trips.
2. If a repository is ever too large for GitHub's recursive-tree response, the app
   automatically falls back to walking the (non-recursive) `contents` API folder by folder,
   so it keeps working rather than silently truncating.
3. **File previews** are fetched on demand, straight from
   `raw.githubusercontent.com/hamnasz/Semester-VI/main/<path>`, only when you open a file —
   nothing is pre-downloaded.

### The subject allow-list

`js/app.js` filters the live tree down to a fixed set of top-level folders, so the journal
only ever shows the actual coursework subjects — not stray root files or scratch folders that
might land in the repo later:

```js
const ALLOWED_SUBJECTS = [
  'Computer Networks',
  'Computer Vision',
  'Data Mining',
  'Deep Learning',
  'Multivariable Calculus',
  'Theory of Automata',
];
```

The repository's `Others` folder and root `README.md` are intentionally left off this list, so
they never appear in the journal. Matching is case-insensitive and trims whitespace. If a new
subject folder is added to the repo, add its name here too, or it won't appear in the journal.

### Repointing this at a different repository

Everything else is driven by one object at the top of `js/github-api.js`:

```js
const CONFIG = { owner: 'hamnasz', repo: 'Semester-VI', branch: 'main' };
```

Change those three values (and the `ALLOWED_SUBJECTS` list above) and the whole app — cover
page, subjects, search, viewers — repoints itself at any public repo with zero other edits.

## What renders inline vs. what falls back

| Type | Behavior |
|---|---|
| `.pdf` | fetched and shown inline via the browser's native PDF viewer (very large PDFs — over 20 MB — skip the inline fetch and open directly in a new tab instead, so a huge textbook scan doesn't stall the page) |
| `.png` `.jpg` `.jpeg` `.gif` `.webp` `.svg` | shown directly |
| `.md` | rendered with a small built-in Markdown renderer (headings, lists, tables, links, images, code fences — no external library) |
| `.txt` / code files (`.js` `.py` `.json` `.css` `.html` …) | shown as plain formatted text |
| `.csv` | parsed and shown as a table (first 500 rows) |
| `.ipynb` | rendered cell-by-cell (markdown cells + code cells with their captured output) |
| `.docx` `.doc`, `.ppt` `.pptx`, `.xlsx` `.xls` | loads straight into Microsoft's online Office viewer — no click needed — alongside **View on GitHub** and **Download** actions |
| anything else | a generic download card |

Every file — inline or fallback — also gets **View** and **Download** actions in its card and
in the full-screen viewer.

## Local development

No build tooling is required — it's plain HTML/CSS/JS. Because the app makes real `fetch()`
calls to the GitHub API, serve it over `http://`, rather than opening `index.html` directly
as a `file://` URL:

```bash
npm start
# or, without npm: python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

## Running the tests

There's an optional headless smoke test (using [jsdom](https://github.com/jsdom/jsdom)) that
loads the real app, fetches the live repo tree, and clicks through cover → browse → search →
filter → every file-viewer path, failing on any uncaught JS error:

```bash
npm install     # installs jsdom as a dev dependency (not needed to run the site itself)
npm test
```

The GitHub API's unauthenticated rate limit is 60 requests/hour per IP — the test caches the
first successful response in `test/.fixture-cache.json` and reuses it on later runs if you hit
that limit while iterating.

## Deploying to GitHub Pages

1. Push the contents of this folder (`index.html`, `css/`, `js/`) to the root of a repository —
   this can be its own small repo, or the `docs/` folder of an existing one.
2. In that repository: **Settings → Pages → Build and deployment → Source: Deploy from a
   branch**, pick the branch (and `docs/` folder if you used one), and save.
3. The site goes live at `https://<your-username>.github.io/<repo-name>/` within a minute or
   two. All asset paths in this project are relative, so it works whether it's served from the
   domain root or a sub-path.
4. That's the entire deployment. There's no manifest to regenerate afterwards — new files
   pushed to `hamnasz/Semester-VI` just appear the next time the journal is opened.

### A note on API rate limits

The unauthenticated GitHub API allows 60 requests/hour per visitor IP, and this app uses only
one or two of them per page load (one for the file tree, one for repo metadata). That's ample
for a personal archive. If you ever deploy this in front of heavy traffic and start seeing the
"GitHub's asking us to slow down" error state, the standard fix is routing requests through a
small authenticated proxy — out of scope for a static personal site, but worth knowing about.

## Accessibility & responsiveness

Keyboard focus is visible throughout, the file viewer is a proper modal dialog (closes on
<kbd>Esc</kbd> or backdrop click), animations respect `prefers-reduced-motion`, and the layout
is responsive from phone widths up.
