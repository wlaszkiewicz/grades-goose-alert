/**
 * grades-goose-alert
 *
 * Script to monitor public course pages for changes (like grades) 🐈
 *
 * How it works:
 * 1. Checks each URL in the 'courses' array every 3 minutes.
 * 2. Compares the selected HTML content using an MD5 hash.
 * 3. Alerts if the page changes:
 *    - Terminal beep (\x07) (not always reliable)
 *    - Custom WAV sound (goose-urgent.wav)
 *
 * Features:
 * - Monitor entire page or a specific part via CSS selector (e.g., "#grades", ".grades-table").
 * - Works with public static pages (no login required, no sensitive data).
 *
 * ⚠️ IMPORTANT:
 * - Only use on public/open pages. DO NOT try to access login-protected university pages.
 * - TLS verification is disabled for broken certificates (rejectUnauthorized: false).
 *
 * Usage:
 *   node checkGrades.js
 *
 * Enjoy your grades responsibly 🦢
 */

const axios = require("axios");
const cron = require("node-cron");
const crypto = require("crypto");
const https = require("https");
const cheerio = require("cheerio");
const player = require("play-sound")();

const courses = [
  {
    name: "DSP",
    url: "https://example.com/dsp/grades",
    lastHash: null,
    selector: "body", // default whole page
  },
  {
    name: "CPS",
    url: "https://example.com/cps/grades",
    lastHash: null,
    selector: "body", // IF NEEDED: specify a CSS selector to monitor only part of the page eg ".grades-table" or "#grades-section"
  },
];

const agent = new https.Agent({ rejectUnauthorized: false });

async function checkCourse(course) {
  try {
    const headers = {
      // so we don't get blocked by basic anti-bot measures
      "User-Agent":
        "Mozilla/5.0 (X11; Linux x86_64; rv:146.0) Gecko/20100101 Firefox/146.0",
    };

    const { data } = await axios.get(course.url, {
      headers,
      httpsAgent: agent,
    });

    const $ = cheerio.load(data);
    const htmlPart = $(course.selector).html() || "";

    const hash = crypto.createHash("md5").update(htmlPart).digest("hex");

    if (course.lastHash && hash !== course.lastHash) {
      console.log(`🚨 ${course.name} PAGE CHANGED!!!!!`);
      process.stdout.write("\x07"); // terminal beep, not always reliable so we have:

      player.play("./goose-urgent.wav", (err) => {
        // inspired by our beloved glucose goose app
        if (err) console.log("Error playing sound:", err);
      });
    }

    course.lastHash = hash;
    console.log(`Checked ${course.name} at`, new Date().toLocaleTimeString());
  } catch (err) {
    console.log(`Error checking ${course.name}:`, err.message);
  }
}

cron.schedule("*/3 * * * *", async () => {
  for (const course of courses) {
    await checkCourse(course);
  }
});

courses.forEach(checkCourse);
