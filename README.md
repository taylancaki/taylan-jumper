# Taylan Jumper

A real playable browser runner game inspired by the classic offline dino runner. Jump over obstacles, keep the run alive, and beat your best score.

## Files

- `index.html` is the website page.
- `app.js` contains the game loop, controls, scoring, drawing, and collision logic.
- `styles.css` controls the responsive layout and arcade styling.
- `server.mjs` runs the local website server.
- `start-taylan-jumper.ps1` starts the local server on this Windows machine.
- `package.json` describes the app scripts.
- `favicon.svg` is the browser-tab icon.
- `.nojekyll` tells GitHub Pages to publish the files exactly as they are.

## Play Locally

Run this in PowerShell:

```powershell
.\start-taylan-jumper.ps1
```

Then open:

```text
http://localhost:5173
```

Controls:

- Space, up arrow, tap the canvas, or press Jump to jump.
- Reset clears the current run.

## Put It Online With GitHub Pages

1. Go to https://github.com and sign in or make a free account.
2. Create a new public repository named `taylan-jumper`.
3. Upload these files into the repository:
   - `index.html`
   - `app.js`
   - `styles.css`
   - `favicon.svg`
   - `site.webmanifest`
   - `.nojekyll`
   - `README.md`
4. Open the repository's `Settings`.
5. Go to `Pages`.
6. Under `Build and deployment`, choose:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/root`
7. Save.

After GitHub finishes publishing, the website will usually be available at:

```text
https://YOUR-GITHUB-USERNAME.github.io/taylan-jumper/
```
