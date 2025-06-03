// telegram_bot.js

console.log("[MAIN] 1. The Script Starts here....");

// Import necessary modules
const { Telegraf, Markup } = require("telegraf");
const axios = require('axios');
require("dotenv").config(); // For loading environment variables from a .env file

// --- Configuration ---
const BOT_TOKEN = process.env.BOT_TOKEN;
const API_KEY = process.env.NAVASAN_API_KEY || 'free4ytAE8muSkoKbKBpNMy4CjtSJgDL'; // Prefer environment variable
const API_URL = 'http://api.navasan.tech/latest/';

const ITEMS_TO_FETCH = {
  CURRENCY_1: { key: "btc", label: "بیت کوین" },
  CURRENCY_2: { key: "dirham_dubai", label: "درهم دبی" },
  CURRENCY_3: { key: "rob", label: "ربع سکه" },
  CURRENCY_4: { key: "nim", label: "نیم سکه" },
};

// --- Bot Token Validation ---
if (!BOT_TOKEN) {
  console.error(
    "[ERROR] Critical: BOT_TOKEN is not defined. Please set it as an environment variable or in a .env file."
  );
  process.exit(1); // Exit if no token
}
console.log("[CONFIG] 2. Bot token loaded successfully.");
if (API_KEY === 'free4ytAE8muSkoKbKBpNMy4CjtSJgDL') {
    console.warn("[CONFIG] Warning: Using a default Navasan API key. Consider setting NAVASAN_API_KEY in your .env file for better security and management.");
} else {
    console.log("[CONFIG] Navasan API key loaded.");
}


// --- Telegraf Bot Instance ---
const bot = new Telegraf(BOT_TOKEN);
console.log("[INIT] 3. Telegraf bot instance created.");

// --- Navasan API Data Fetching Function ---
async function fetchNavasanData() {
  console.log("[API_CALL] fetchNavasanData: Initiating API call to Navasan.");
  try {
    console.log(`[API_CALL] fetchNavasanData: Requesting URL: ${API_URL} with API_KEY.`);
    const response = await axios.get(API_URL, {
      params: {
        api_key: API_KEY
      }
    });
    console.log(`[API_CALL] fetchNavasanData: Received response with status ${response.status}.`);

    const allData = response.data;
    console.log("[API_CALL] fetchNavasanData: Raw data received from API:");
    console.log(JSON.stringify(allData, null, 2));

    const extractedData = {};
    console.log("[API_CALL] fetchNavasanData: Processing items to extract relevant data...");

    for (const [code, { key, label }] of Object.entries(ITEMS_TO_FETCH)) {
      console.log(`[API_CALL] fetchNavasanData: Checking for item '${label}' (key: '${key}') in API response.`);
      if (allData[key]) {
        extractedData[code] = {
          name: label,
          value: parseFloat(allData[key].value).toLocaleString('fa-IR'), // Using 'fa-IR' for Persian number formatting
          change: parseFloat(allData[key].change).toLocaleString('fa-IR'),
          date: allData[key].date,
        };
        console.log(`[API_CALL] fetchNavasanData: Extracted data for '${label}':`, extractedData[code]);
      } else {
        extractedData[code] = null;
        console.warn(`[API_CALL] fetchNavasanData: Item '${label}' (key: '${key}') not found in API response.`);
      }
    }

    console.log("[API_CALL] fetchNavasanData: Successfully processed and extracted data:");
    console.log(JSON.stringify(extractedData, null, 2));
    return extractedData;

  } catch (error) {
    console.error("[API_CALL_ERROR] fetchNavasanData: An error occurred while fetching data.");
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error(`[API_CALL_ERROR] fetchNavasanData: Server responded with status ${error.response.status}.`);
      console.error('[API_CALL_ERROR] fetchNavasanData: Response Data:', JSON.stringify(error.response.data, null, 2));
      console.error('[API_CALL_ERROR] fetchNavasanData: Response Headers:', JSON.stringify(error.response.headers, null, 2));
    } else if (error.request) {
      // The request was made but no response was received
      console.error('[API_CALL_ERROR] fetchNavasanData: No response received from server (e.g., timeout or network issue).');
      // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
      // http.ClientRequest in node.js
      // console.error('[API_CALL_ERROR] fetchNavasanData: Request details:', error.request); // This can be very verbose
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('[API_CALL_ERROR] fetchNavasanData: Error in request setup:', error.message);
    }
    console.error('[API_CALL_ERROR] fetchNavasanData: Full error object:', error);
    return null; // Return null to indicate failure
  }
}

// --- Bot Event Handlers ---

// /start command
bot.start((ctx) => {
  const userInfo = ctx.from;
  console.log(
    `[BOT_EVENT] Received /start command from user: ${userInfo.username || userInfo.first_name} (ID: ${userInfo.id})`
  );
  const welcomeMessage = `سلام ${userInfo.first_name || userInfo.username} به بات Currency Fetcher خوش اومدی! 😁\n\nلطفا ارز مورد نظرت رو انتخاب کن:`;
  console.log(`[BOT_EVENT] Replying to /start with: "${welcomeMessage.substring(0, 50)}..." and inline keyboard.`);

  ctx.reply(
    welcomeMessage,
    Markup.inlineKeyboard([
      [Markup.button.callback("💰 بیت کوین", "CURRENCY_1")],
      [Markup.button.callback("💵 درهم دبی", "CURRENCY_2")],
      [Markup.button.callback("💶 ربع سکه", "CURRENCY_3")],
      [Markup.button.callback("💷 نیم سکه", "CURRENCY_4")],
    ])
  );
});

// Action handler for currency buttons
bot.action(/CURRENCY_(\d)/, async (ctx) => {
  const currencyCode = ctx.match[0]; // e.g., CURRENCY_1
  const currencyNumber = ctx.match[1]; // e.g., 1
  const userInfo = ctx.from;

  console.log(
    `[BOT_EVENT] Received action '${currencyCode}' from user: ${userInfo.username || userInfo.first_name} (ID: ${userInfo.id})`
  );

  // Answer callback query to remove the "loading" state on the button
  await ctx.answerCbQuery();
  console.log(`[BOT_EVENT] Answered callback query for action '${currencyCode}'.`);

  console.log(`[BOT_EVENT] Fetching data for currency code: ${currencyCode}.`);
  const data = await fetchNavasanData();

  if (!data) {
    const errorMessage = "❌ متاسفانه در حال حاضر امکان دریافت اطلاعات از سرور وجود ندارد. لطفاً کمی بعد دوباره تلاش کنید.";
    console.error(`[BOT_EVENT] API data fetch failed or returned null for action '${currencyCode}'. Replying with error.`);
    return ctx.reply(errorMessage);
  }
  
  if (!data[currencyCode]) {
    const errorMessage = `❌ اطلاعات ارز با کد ${currencyCode} در دسترس نیست یا در پاسخ API یافت نشد. لطفاً بعداً تلاش کنید یا از صحت کد مطمئن شوید.`;
    console.warn(`[BOT_EVENT] Data for specific currency_code '${currencyCode}' not found in fetched data. Replying with error.`);
    console.log("[BOT_EVENT] Available data keys:", Object.keys(data));
    return ctx.reply(errorMessage);
  }

  const currency = data[currencyCode];
  console.log(`[BOT_EVENT] Successfully fetched data for '${currency.name}'.`);
  console.log(JSON.stringify(currency, null, 2));

  const replyMessage = `💸 اطلاعات مربوط به *${currency.name}*:\n\n` +
    `📍 *قیمت:* ${currency.value} تومان\n` +
    `📊 *تغییرات:* ${currency.change} تومان\n` +
    `📅 *تاریخ:* ${currency.date}\n` +
    `\n━━━━━━━━━━━━━━━`;

  console.log(`[BOT_EVENT] Replying with currency info for '${currency.name}':`);
  console.log(replyMessage);

  ctx.reply(replyMessage, { parse_mode: "Markdown" });
});

// /help command
bot.help((ctx) => {
  const userInfo = ctx.from;
  console.log(
    `[BOT_EVENT] Received /help command from user: ${userInfo.username || userInfo.first_name} (ID: ${userInfo.id})`
  );
  const helpMessage = "شما با انتخاب هر ارز میتونید اطلاعاتی مانند قیمت ارز رو چک کنید و اون رو مشاهده کنید. برای شروع /start را بزنید.";
  console.log(`[BOT_EVENT] Replying to /help with: "${helpMessage}"`);
  ctx.reply(helpMessage);
});

// --- Bot Launch & Shutdown ---
console.log("[MAIN] 4. Attempting to launch bot...");
bot.launch()
  .then(() => {
    console.log(
      "[MAIN] 5. Bot is running successfully using long polling. Go to Telegram and interact with your bot!"
    );
    console.log(`[MAIN] Bot username: @${bot.botInfo.username}`);
  })
  .catch((err) => {
    console.error("[MAIN_ERROR] Critical: Failed to launch bot.", err);
    process.exit(1); // Exit if launch fails
  });

// Graceful shutdown
process.once("SIGINT", () => {
  console.log("[MAIN] Received SIGINT. Stopping bot...");
  bot.stop("SIGINT");
  console.log("[MAIN] Bot stopped due to SIGINT.");
  process.exit(0);
});

process.once("SIGTERM", () => {
  console.log("[MAIN] Received SIGTERM. Stopping bot...");
  bot.stop("SIGTERM");
  console.log("[MAIN] Bot stopped due to SIGTERM.");
  process.exit(0);
});

console.log("[MAIN] Script setup complete. Bot launch initiated.");
