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
 * 4. Sends Telegram alerts to all subscribed chat IDs with the course name and URL.
 *
 * Features:
 * - Monitor entire page or a specific part via CSS selector (e.g., "#grades", ".grades-table").
 * - Works with public static pages (no login required, no sensitive data).
 * - Telegram bot sends updates to multiple users and supports interactive commands.
 * - Telegram bot commands:
 *   /help - Show available commands
 *   /courses - List monitored courses
 *   /goose - Get a random goose GIF 🦢
 *   /rps - Play Rock Paper Scissors with the bot
 *
 * ⚠️ IMPORTANT:
 * - Only use on public/open pages. DO NOT try to access login-protected university pages!!
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
const telegramBot = require("node-telegram-bot-api");
require("dotenv").config();

const courses = [
  {
    name: "DSP",
    url: process.env.DSP_URL,
    lastHash: null,
    selector: "body", // default whole page
  },
  {
    name: "CPS",
    url: process.env.CPS_URL,
    lastHash: null,
    selector: "body", // IF NEEDED: specify a CSS selector to monitor only part of the page eg ".grades-table" or "#grades-section"
  },
];

const agent = new https.Agent({ rejectUnauthorized: false });
const bot = new telegramBot(process.env.TELEGRAM_TOKEN, {
  polling: true,
});
const chatIds = []; // hardcoded chat IDs of friends

const adminChatId = process.env.ADMIN_CHAT_ID; // optional for error alerts

bot.on("message", (msg) => {
  const newChatId = msg.chat.id;
  if (!chatIds.includes(newChatId)) {
    chatIds.push(newChatId); // store new friend
    console.log("New Telegram subscriber:", newChatId);
    bot.sendMessage(
      newChatId,
      `Hi! You're now subscribed to Zielu Grades alerts 🦢 Here’s what I can do:\n\n` +
        `/courses - List the courses I'm monitoring for grade updates\n` +
        `/goose - Get a random goose GIF  🦢\n` +
        `/rps - Play Rock Paper Scissors \n` +
        `/help - Show this message again\n\n`,
    );
  }
});

bot.on("polling_error", (err) => {
  console.log(`Telegram Polling Error: ${err.code}`);
});

bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    `Here’s what I can do:\n\n` +
      `/courses - List the courses I'm monitoring for grade updates\n` +
      `/goose - Get a random goose GIF  🦢\n` +
      `/rps - Play Rock Paper Scissors \n` +
      `/help - Show this message again`,
  );
});

bot.onText(/\/courses/, (msg) => {
  const chatId = msg.chat.id;
  const list = courses.map((c) => c.name).join(", ");
  bot.sendMessage(chatId, `Currently monitoring: ${list}`);
});

bot.onText(/\/goose/, (msg) => {
  const chatId = msg.chat.id;
  const gifs = [
    "https://i.pinimg.com/originals/1b/2d/f9/1b2df90a53fbe60c22706b854207d5c3.gif",
    "https://media.tenor.com/xLnKqOCPjKoAAAAM/cute-duck.gif", // external links
    "./assets/geese.gif", // or local files
    "./assets/goose.gif",
  ];
  const randomGif = gifs[Math.floor(Math.random() * gifs.length)];

  const animation = randomGif.startsWith("http")
    ? randomGif
    : require("fs").createReadStream(randomGif);

  bot.sendAnimation(chatId, animation, {
    caption: "🦢 Honk honk!",
  });
});

const choices = ["🪨 Rock", "📄 Paper", "✂️ Scissors"];

bot.onText(/\/rps/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "Choose your move:", {
    reply_markup: {
      inline_keyboard: [choices.map((c) => ({ text: c, callback_data: c }))],
    },
  });
});

bot.on("callback_query", (query) => {
  const userChoice = query.data;
  const botChoice = choices[Math.floor(Math.random() * choices.length)];
  let result = "";

  if (userChoice === botChoice) result = "It's a tie! 🤝";
  else if (
    (userChoice.includes("Rock") && botChoice.includes("Scissors")) ||
    (userChoice.includes("Paper") && botChoice.includes("Rock")) ||
    (userChoice.includes("Scissors") && botChoice.includes("Paper"))
  )
    result = "You win! 🦢";
  else result = "You lose! 😿";

  const finalMessage = `You chose: ${userChoice}\nI chose: ${botChoice}\n\n**${result}**`;

  bot.answerCallbackQuery(query.id);

  bot.editMessageText(finalMessage, {
    chat_id: query.message.chat.id,
    message_id: query.message.message_id,
    parse_mode: "Markdown",
  });
});

async function alertTelegram(courseName) {
  const message = `🚨 ${courseName} page updated!!!!!\nCheck it here: ${courses.find((c) => c.name === courseName).url}`;
  try {
    for (const chatId of chatIds) {
      await bot.sendMessage(chatId, message);
    }
  } catch (err) {
    console.log("Telegram alert failed:", err.message);
  }
}

async function checkCourse(course) {
  try {
    const headers = {
      // so we don't get blocked by basic anti-bot measures (like universities would have ones ahahaha their servers are broken anyway)
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

      player.play("./assets/goose-urgent.wav", (err) => {
        // inspired by our beloved glucose goose app
        if (err) console.log("Error playing sound:", err);
      });

      alertTelegram(course.name);
    }

    course.lastHash = hash;
    console.log(`Checked ${course.name} at`, new Date().toLocaleTimeString());
  } catch (err) {
    console.log(`Error checking ${course.name}:`, err.message);
    if (adminChatId) {
      // optional Telegram alert for errors
      bot.sendMessage(
        adminChatId,
        `Error checking ${course.name}: ${err.message}`,
      );
    }
  }
}

cron.schedule("*/3 * * * *", async () => {
  for (const course of courses) {
    await checkCourse(course);
  }
});

courses.forEach(checkCourse);
