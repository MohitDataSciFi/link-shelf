# Link Shelf

A small website for the links you use all the time **and the tasks you need to get done**. Everything is saved in **your own Google Sheet** (a `Links` tab and a `Tasks` tab), and the site is hosted for free on **GitHub Pages**.

There are two files:

| File | What it is | Where it goes |
|---|---|---|
| `Code.gs` | The "backend" that reads and writes your Google Sheet | Google Apps Script (inside your sheet) |
| `index.html` | The website you use | GitHub (GitHub Pages) |

Setup takes about 10 minutes, and you only do it once.

---

## Part 1: Set up the Google Sheet (5 min)

1. Go to **sheets.new** to create a new Google Sheet. Name it something like `Link Shelf`.
2. In the sheet's menu, open **Extensions → Apps Script**.
3. Delete everything in the editor, then paste in the full contents of `Code.gs`.
4. On line 10, change `change-me-to-a-long-secret` to your own password, for example `mohit-links-7f3k9q2x`. **Remember it.**
5. Click **Save** (the disk icon).
6. Click **Deploy → New deployment**.
   - Click the gear ⚙ next to "Select type" and choose **Web app**.
   - **Execute as:** *Me*
   - **Who has access:** *Anyone*
   - Click **Deploy**.
7. Google asks you to **Authorize access**. Choose your account.
   - If you see "Google hasn't verified this app", click **Advanced → Go to (project name) (unsafe)**. This is normal because it's your own script.
8. Copy the **Web app URL**. It looks like `https://script.google.com/macros/s/AKfy…/exec`.

> "Anyone" only means the URL can be called from your website. Without your secret key, nobody can read or change your links.

## Part 2: Put the website on GitHub (5 min)

1. Sign in at **github.com** and click **+ → New repository**.
   - Name: `link-shelf`
   - Choose **Public**. GitHub Pages is free for public repos, and your links still stay private in your sheet.
   - Click **Create repository**.
2. On the new repo page, click **uploading an existing file**, drag in `index.html`, and click **Commit changes**.
3. Go to **Settings → Pages**.
   - **Source:** *Deploy from a branch*
   - **Branch:** `main`, folder `/ (root)`. Click **Save**.
4. After 1–2 minutes your site is live at:
   **`https://<your-github-username>.github.io/link-shelf/`**

## Part 3: Connect them

1. Open your site.
2. Paste the **Web app URL** from Part 1, step 8, and your **secret key**.
3. Click **Connect**. You're done.

Do this once on each device or browser (phone, laptop). After that, the site remembers the connection.

> **Already set up before Tasks existed?** Paste the new `Code.gs` into Apps Script, then **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy**. Your URL stays the same. Until you do this, the Tasks page shows a reminder.

---

## Using Tasks

Switch to **Tasks** in the sidebar.

- **Add fast.** Type in the box and press **Enter**. You can include:
  - a date: `today`, `tomorrow`, `fri`, `next week`, `in 3 days`, `25/10` (day/month), `5 nov` or `2026-12-01`
  - a priority: `!high`, `!med` or `!low`
  - tags: `#work`, `#home`

  For example, `Pay rent fri !high #home`. A preview under the box shows what was understood. Use the sliders button for the full form.
- **Update progress.** Click a task's progress bar and pick 25 / 50 / 75 / 100% or drag the slider. Reaching 100% marks it done.
- **Break it into steps.** Open a task and add steps. Ticking them off fills in the progress automatically, and the last tick completes the task.
- **Tick the circle** to finish a task. Click it again to reopen it.
- **Views:** *All open* (grouped into Overdue, Today, Tomorrow, Next 7 days, Later), *Today*, *Upcoming*, *In progress* and *Completed*. The four tiles at the top show what's overdue, due today, in progress and done this week. Click a tile to jump there.
- **Board:** the board button next to *Sort* shows To do / In progress / Done columns. On a computer, drag cards between columns.
- **In the sheet:** each task is one row in the `Tasks` tab. You can edit it there too. Status is `todo`, `doing` or `done`, and dates are `yyyy-mm-dd`.

---

## Good to know

- **Your data is in the sheet.** You can also edit links and tasks directly in Google Sheets, then press **Refresh** on the site.
- **Changing `Code.gs` later?** Use **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy**. This keeps the same URL. A *New deployment* would give you a new URL.
- **Forgot the key, or want to change it?** Edit `SECRET` in Apps Script, redeploy as above, then use **Connection settings** on the site.
- **Add to your phone's home screen.** Open the site in Chrome, then choose **⋮ → Add to Home screen**. It will work like an app.
- **Shortcuts:** `/` or `Ctrl+K` jumps to search, **Enter** opens the top result, **Esc** clears the search, **N** adds a new link (or jumps to the task box on the Tasks page).
- **Views:** switch between grid and list with the buttons next to *Sort*, and pick light, dark or device theme with the sun/moon button. Site icons are loaded from Google's favicon service; if one can't load, a coloured letter is shown instead.
