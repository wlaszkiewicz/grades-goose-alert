# `grades-goose-alert`

**🚨 Alert script for obsessively checking course pages, now with Telegram notifications and mini-games**

This Node.js script checks your course pages every few minutes and alerts you **audibly** if anything changes, because waiting for grades is making me go insane and geese are reliable.

---

## Features

- Checks multiple public course pages
- Compares page content using MD5 hashes
- Alerts when content changes
  - Terminal bell
  - Custom WAV sound (`goose-urgent.wav`)

- Works on Linux/macOS (Windows may need a different sound player)
- Monitor specific parts of the page with CSS selectors
  - Only check the `\<div>`, `\<table>`, or section that actually changes
- Telegram bot integration
  - Sends instant alerts when a course page changes
  - Supports multiple subscribers
  - Fun commands:
    - `/courses` → List monitored courses
    - `/goose` → Random goose GIF
    - `/rps` → Play Rock Paper Scissors
    - `/help` → Show commands

---

## Installation

1. Clone the repository

```bash
git clone https://github.com/wlaszkiewicz/grades-goose-alert.git
cd grades-goose-alert
```

2. Install dependencies

```bash
npm install
```

3. Add your sound file (or leave the geese to their work)

Place a `.wav` file for alerts (default: `goose-urgent.wav`) in the project folder.

---

## Environment Variables

Create a `.env` file in the root folder, using .env.example as a template:

```env
TELEGRAM_TOKEN=your_telegram_bot_token
DSP_URL=https://example.com/dsp
CPS_URL=https://example.com/cps

ADMIN_CHAT_ID=your_telegram_chat_id_here # optional, for receiving error alerts from the bot
```

You can get a Telegram bot token from @BotFather.

---

## Telegram Setup

1. Create a bot using @BotFather on Telegram
2. Copy the token
3. Add it to your `.env` file
4. Start the script
5. Send any message to the bot to subscribe

---

## Usage

```bash
node checkGrades.js
```

- The script checks each course page every 3 minutes (or your chosen interval).
- If a page changes, it **plays your sound and beeps in the terminal**.
- You can modify:
  - `courses[].url` → page URL
  - `courses[].selector` → CSS selector to monitor
  - Example selectors: `"body"`, `"#grades"`, `".lecture-links"`

---

### Example course configuration

```js
const courses = [
  {
    name: "DSP",
    url: "https://example/dsp/grades/",
    lastHash: null,
    selector: "body", // default: entire page
  },
  {
    name: "CPS",
    url: "https://example/cps/grades/",
    lastHash: null,
    selector: "#grades", // only monitor the grades section
  },
];
```

## Notes / Warnings

- Only use this on **publicly accessible static pages**.
- The script disables TLS verification (`rejectUnauthorized: false`) for broken certificates, but **don’t use it for sensitive sites**.
- Selecting the right CSS selector can prevent false positives from headers, footers, or timestamps that change constantly.
