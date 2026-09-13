# Zainuddin — Interior Design Portfolio

Static portfolio website (HTML, CSS, JavaScript with GSAP + Lenis). No build step.

## Publish on GitHub Pages

1. Create a new **public** repository on GitHub (e.g. `zainuddin-portfolio`).
2. Unzip the downloaded file, then on the repo page click **Add file → Upload files** and drag in **everything inside** the unzipped folder (`index.html`, `css`, `js`, `assets`, `google-apps-script`, `README.md`, `.nojekyll`). Commit.
   - `index.html` must be at the top level of the repo, not inside a sub-folder.
3. Go to **Settings → Pages** → Source: **Deploy from a branch** → Branch: `main` / `(root)` → **Save**.
4. After 1–2 minutes the site is live at `https://<your-username>.github.io/<repo-name>/`.

## Connect the enquiry form to Google Sheets

Enquiries are saved to the sheet
`https://docs.google.com/spreadsheets/d/1dUEpKnrcF4w_9pynzEl7k2q_ir7KujR-GXqzwmROrEg`.

1. Open the sheet → **Extensions → Apps Script**.
2. Paste the contents of `google-apps-script/Code.gs`, save.
3. **Deploy → New deployment → Web app** — Execute as: **Me**, Who has access: **Anyone** → Deploy → approve permissions.
4. Copy the Web app URL (ends in `/exec`).
5. In `js/main.js`, set:
   ```js
   const SHEET_ENDPOINT = "https://script.google.com/macros/s/XXXX/exec";
   ```
   (On GitHub you can edit the file in the browser with the pencil icon and commit.)

Each submission adds a row (Timestamp, Name, Email, Phone, Project Type, Message, Source, Page) to an **Enquiries** tab, and sends a notification email. Until the URL is set, the form falls back to opening the visitor's email app.

## Structure

```
index.html
css/style.css
js/main.js
assets/img/…            optimised WebP images per project
google-apps-script/Code.gs   Google Sheet receiver (not used by the site at runtime)
```
