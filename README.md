# HR Seating Chart

A lightweight GitHub Pages seating-chart search for guests.

## What it does

- Search by first name, last name, or full name
- Shows the guest's assigned table
- Shows everyone listed at that table
- Handles duplicate full names by letting the user choose the correct table
- Works on phones and desktops
- Uses only static HTML/CSS/JavaScript, so there is no server or database to maintain

## Files

- `index.html` — page structure
- `styles.css` — visual design
- `app.js` — search and result behavior
- `seating-data.js` — seating data generated from the provided Excel workbook
- `.github/workflows/pages.yml` — GitHub Pages deployment workflow

## GitHub Pages

The included workflow deploys the repository to GitHub Pages whenever `main` is updated.

Expected site URL:

`https://hpatel1101.github.io/HRSeatingChart/`

If the first workflow asks for Pages to be enabled, open the repository's **Settings → Pages** and choose **GitHub Actions** as the source, then re-run the workflow.

## Updating the seating chart

Update `seating-data.js` with the final table assignments and push to `main`. The Pages workflow will redeploy automatically.
