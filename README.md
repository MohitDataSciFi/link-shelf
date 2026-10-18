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

## AI assistant (optional, uses your DeepSeek API key)

On the Tasks page, click **✨ Ask AI** (or press **A**). Type or tap the 🎤 and speak naturally:

- *"Call the bank tomorrow, pay rent on the 1st and finish the report by Friday, it's urgent"* creates three tasks with dates, priority and steps.
- *"Mark the electricity bill as done"*, *"Move the dentist to next Monday"* or *"Set slides to 60%"* updates existing tasks.
- *"Break the report into steps"*, *"Plan my day"*, *"What's overdue?"* or *"Weekly review"* gets advice and suggested changes.
- Paste meeting notes after **Notes → tasks** to turn them into a task list.

The assistant **never changes anything by itself**. It shows each proposed change with a checkbox, and you click **Apply**. You can also type in the quick-add box and press the ✨ button there.

**Setup (one time, about 3 minutes):**

1. Make sure Apps Script has the latest `Code.gs` (see the note in Part 3).
2. In Apps Script, click the **gear (Project Settings)**. Under **Script properties**, click **Add script property**:
   - Property: `DEEPSEEK_API_KEY`, Value: your key (`sk-…`)
   - Optional: `DEEPSEEK_MODEL`, Value: `deepseek-v4-pro` for the stronger model. The default is the faster, cheaper `deepseek-flash`.
   
   Click **Save script properties**. **Never put the key in `Code.gs` or `index.html`.** Both are public on GitHub, but script properties are not.
3. Back in the editor, choose **testAi** in the function dropdown and click **Run**. Google asks for permission to "connect to an external service". Allow it. The log should say *"The assistant is working."*
4. **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy.**

**Voice** works in Chrome, Edge and Safari. Pick the language (English India / हिन्दी / English US / UK) under the chat box. Speech is turned into text by your browser's speech service. Your open tasks (titles, dates, notes) are sent to DeepSeek with each message, so the assistant knows what you're talking about.

---

## Good to know

- **Your data is in the sheet.** You can also edit links and tasks directly in Google Sheets, then press **Refresh** on the site.
- **Changing `Code.gs` later?** Use **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy**. This keeps the same URL. A *New deployment* would give you a new URL.
- **Forgot the key, or want to change it?** Edit `SECRET` in Apps Script, redeploy as above, then use **Connection settings** on the site.
- **Add to your phone's home screen.** Open the site in Chrome, then choose **⋮ → Add to Home screen**. It will work like an app.
- **Shortcuts:** `/` or `Ctrl+K` jumps to search, **Enter** opens the top result, **Esc** clears the search, **N** adds a new link (or jumps to the task box on the Tasks page), **A** opens the AI assistant.
- **Views:** switch between grid and list with the buttons next to *Sort*, and pick light, dark or device theme with the sun/moon button. Site icons are loaded from Google's favicon service; if one can't load, a coloured letter is shown instead.
