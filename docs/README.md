# TapDarts

A darts scorer for 01 games, Mickey Mouse, Killer and Footy, plus a Practice mode that tracks your routine. It runs entirely in the browser, needs no
server and no sign-in, and keeps your stats in **your own Google Sheet** (optional).

## Run it

- **Locally:** open `index.html` in Chrome, Edge or Safari. No install.
- **On Cloudflare Pages:** run `./deploy.sh` from the repo root. It builds a copy of `docs/` (without
  `sampleImages`), stamps a `version.txt` and a `?v=` on every script and stylesheet, and deploys it with
  Wrangler. Open copies of the app notice the new version when they come back on screen and reload (or offer
  an Update button mid-game), so phones don't stay on an old version.
- **On GitHub Pages:** push this folder to a public repo, then Settings, Pages, deploy from the main
  branch. All links are relative, so it works under `https://<you>.github.io/<repo>/`.

## What is where

```
index.html            the page: loads the files below in order
img/logo.svg          the TapDarts logo (header and browser tab icon)
css/app.css           all of the app's own styling (colours and dark theme are the variables at the top)
vendor/               third-party libraries, unchanged: Bootstrap 5.3.3 (CSS) and Chart.js 4.4.7
js/                   the app, one job per file (see below)
```

### The JavaScript, in load order

| File | Job |
| --- | --- |
| `state.js` | shared variables and small helpers |
| `storage.js` | IndexedDB helpers (visits and the unsynced queue) |
| `theme.js` | light / dark / auto |
| `dart-maths.js` | dart values and checkout routes |
| `board.js` | the dartboard SVG |
| `voice.js` | spoken announcements |
| `apps-script.js` | the Google Apps Script shown in Setup |
| `stats-calc.js` | averages, first 9, doubles, finishes, game results |
| `party-common.js` | shared pieces of the party games and their Sheet tables |
| `game-flow.js` | start and undo, for every game type |
| `game-01.js` | 01 games: dart by dart, total entry, legs |
| `game-mickey-mouse.js`, `game-killer.js`, `game-footy.js` | one file per party game |
| `game-practice.js` | Practice mode: warm-up, 30 at 20, doubles countdown, 3 in a bed, 10 down |
| `sync.js` | sync with the Sheet, CSV export |
| `views-*.js` | one file per screen: play, lobby, stats, history, party stats, setup |
| `render.js` | draws the page, applies the Bootstrap classes |
| `actions.js` | what each button does (`data-a="name"` calls `A.name`) |
| `events.js` | page-level listeners (clicks, keyboard, speech) |
| `boot.js` | start-up; must be the last script |

The scripts are plain classic scripts, not ES modules, so the app still opens from a folder (browsers
block modules on `file://`). They share one global scope: a file can use anything defined in a file
above it at load time, and anything at all once the page has loaded.

## Common changes

- **Colours:** the variables at the top of `css/app.css` (`:root` for light, `[data-bs-theme=dark]` for dark).
- **A new game:** add `js/game-yourgame.js` with a `yourgameThr` and a `yourgameView`, then add it to
  `startGame` (`game-flow.js`), the type routing in `thr` (`game-01.js`) and `game` (`views-play.js`),
  the tiles in `views-lobby.js`, and a script tag in `index.html` before `sync.js`.
- **The Sheet script:** edit `js/apps-script.js`. After changing it, paste the new text into Apps Script
  and deploy a **New version**. Keep it free of backticks and `${}`.
- **Sheet columns:** `HEAD`, `toRow`, `fromRow` in `sync.js`, and the matching lists in `apps-script.js`.

## Data

Everything is stored in the browser (IndexedDB and localStorage) and, if you set it up, in a Google Sheet
with one worksheet per kind of game: Visits, Mickey Mouse, Killer, Footy and Practice. The Sheet is the master copy.
Local data is per address: a new browser or a new address starts empty and refills on the first Sync.

## Third-party code

Bootstrap 5.3.3 and Chart.js 4.4.7 are included unmodified, under the MIT licence, in `vendor/`.
