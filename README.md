# `grades-goose-alert`

**🚨 Alert script for obsessively checking course pages 🚨**

This Node.js script checks your course pages every few minutes and alerts you **audibly** if anything changes, because waiting for grades is making me go insane and geese are reliable.

---

## Features

* Checks multiple public course pages
* Compares page content using MD5 hashes
* Alerts when content changes

  * Terminal bell
  * Custom WAV sound (`goose-urgent.wav`)
* Works on Linux/macOS (Windows may need a different sound player)
* Monitor specific parts of the page with CSS selectors
  * Only check the `\<div>`, `\<table>`, or section that actually changes

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

## Usage

```bash
node checkGrades.js
```

* The script checks each course page every 3 minutes (or your chosen interval).
* If a page changes, it **plays your sound and beeps in the terminal**.
* You can modify:

  * `courses[].url` → page URL
  * `courses[].selector` → CSS selector to monitor
  * Example selectors: `"body"`, `"#grades"`, `".lecture-links"`

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

* Only use this on **publicly accessible static pages**.
* The script disables TLS verification (`rejectUnauthorized: false`) for broken certificates, but **don’t use it for sensitive sites**.
* Selecting the right CSS selector can prevent false positives from headers, footers, or timestamps that change constantly.
