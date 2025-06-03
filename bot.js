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

// --- Cache Configuration ---
let cache = {
    data: null,        // Will store the extractedData object
    lastFetchTime: 0   // Timestamp of the last successful fetch
};
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour in milliseconds
// const CACHE_DURATION_MS = 30 * 1000; // For testing: 30 seconds

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

// --- Navasan API Data Fetching Function with Caching ---
async function fetchNavasanData() {
  const currentTime = Date.now();
  console.log(`[CACHE_CHECK] Current time: ${new Date(currentTime).toISOString()}, Last fetch: ${cache.lastFetchTime ? new Date(cache.lastFetchTime).toISOString() : 'N/A'}`);

  // Check if valid cache exists
  if (cache.data && (currentTime - cache.lastFetchTime < CACHE_DURATION_MS)) {
    console.log("[CACHE_HIT] fetchNavasanData: Returning data from cache.");
    return cache.data;
  }
  console.log("[CACHE_MISS_OR_STALE] fetchNavasanData: Cache miss or stale. Attempting to fetch new data from API.");

  console.log("[API_CALL] fetchNavasanData: Initiating API call to Navasan.");
  try {
    console.log(`[API_CALL] fetchNavasanData: Requesting URL: ${API_URL} with API_KEY.`);
    const response = await axios.get(API_URL, {
      params: {
        api_key: API_KEY
      },
      timeout: 10000 // Add a timeout for API requests (e.g., 10 seconds)
    });
    console.log(`[API_CALL] fetchNavasanData: Received response with status ${response.status}.`);

    const allData = response.data;
    if (allData) {
        console.log("[API_CALL] fetchNavasanData: Successfully received raw data from API (keys: " + Object.keys(allData).join(", ") + ").");
    } else {
        console.warn("[API_CALL] fetchNavasanData: Received no data or undefined data from API.");
    }

    const extractedData = {};
    console.log("[API_CALL] fetchNavasanData: Processing items to extract relevant data...");

    for (const [code, { key, label }] of Object.entries(ITEMS_TO_FETCH)) {
      console.log(`[API_CALL] fetchNavasanData: Checking for item '${label}' (key: '${key}') in API response.`);
      if (allData && allData[key]) {
        extractedData[code] = {
          name: label,
          value: parseFloat(allData[key].value).toLocaleString(), // Reverted to default toLocaleString()
          change: parseFloat(allData[key].change).toLocaleString(), // Reverted to default toLocaleString()
          date: allData[key].date,
        };
        console.log(`[API_CALL] fetchNavasanData: Extracted data for '${label}':`, extractedData[code]);
      } else {
        extractedData[code] = null; // Ensure it's null if not found
        console.warn(`[API_CALL] fetchNavasanData: Item '${label}' (key: '${key}') not found or allData is null in API response.`);
      }
    }
    
    const hasExtractedValues = Object.values(extractedData).some(item => item !== null);

    if (hasExtractedValues) {
        console.log("[API_CALL] fetchNavasanData: Successfully processed and extracted data.");
        console.log(JSON.stringify(extractedData, null, 2));
        
        cache.data = extractedData;
        cache.lastFetchTime = Date.now(); 
        console.log(`[CACHE_UPDATE] fetchNavasanData: Updated cache with new data. Next refresh after ${new Date(cache.lastFetchTime + CACHE_DURATION_MS).toISOString()}`);
        return extractedData;
    } else {
        console.warn("[API_CALL] fetchNavasanData: No meaningful data was extracted from the API response. Not updating cache with empty/null data.");
        return null;
    }

  } catch (error) {
    console.error("[API_CALL_ERROR] fetchNavasanData: An error occurred while fetching data.");
    if (error.response) {
      console.error(`[API_CALL_ERROR] fetchNavasanData: Server responded with status ${error.response.status}.`);
      console.error('[API_CALL_ERROR] fetchNavasanData: Response Data (summary):', error.response.data ? JSON.stringify(error.response.data).substring(0, 200) + "..." : "No data");
    } else if (error.request) {
      console.error('[API_CALL_ERROR] fetchNavasanData: No response received from server (e.g., timeout or network issue).');
    } else {
      console.error('[API_CALL_ERROR] fetchNavasanData: Error in request setup:', error.message);
    }
    console.error(`[API_CALL_ERROR] fetchNavasanData: Error message: ${error.message}`);
    console.log("[API_CALL_ERROR] fetchNavasanData: API call failed. Returning null. Old cache (if any) will persist until its expiry.");
    return null; 
  }
}

// --- Helper function to create the inline keyboard ---
function getCurrencyKeyboard(promptMessage = "لطفا ارز مورد نظرت رو انتخاب کن:") {
    console.log("[KEYBOARD] Generating currency inline keyboard.");
    return {
        text: promptMessage,
        options: Markup.inlineKeyboard([
            [Markup.button.callback("💰 بیت کوین", "CURRENCY_1")],
            [Markup.button.callback("💵 درهم دبی", "CURRENCY_2")],
            [Markup.button.callback("💶 ربع سکه", "CURRENCY_3")],
            [Markup.button.callback("💷 نیم سکه", "CURRENCY_4")],
        ])
    };
}

// --- Bot Event Handlers ---

// /start command
bot.start((ctx) => {
  const userInfo = ctx.from;
  console.log(
    `[BOT_EVENT] Received /start command from user: ${userInfo.username || userInfo.first_name} (ID: ${userInfo.id})`
  );
  const welcomeMessage = `سلام ${userInfo.first_name || userInfo.username} به بات Currency Fetcher خوش اومدی! 😁`;
  ctx.reply(welcomeMessage); // Send welcome message first

  const keyboard = getCurrencyKeyboard();
  console.log(`[BOT_EVENT] Replying to /start with inline keyboard: "${keyboard.text.substring(0,50)}..."`);
  ctx.reply(keyboard.text, keyboard.options);
});

// Action handler for currency buttons
bot.action(/CURRENCY_(\d)/, async (ctx) => {
  const currencyCode = ctx.match[0]; 
  const userInfo = ctx.from;

  console.log(
    `[BOT_EVENT] Received action '${currencyCode}' from user: ${userInfo.username || userInfo.first_name} (ID: ${userInfo.id})`
  );

  await ctx.answerCbQuery();
  console.log(`[BOT_EVENT] Answered callback query for action '${currencyCode}'.`);

  console.log(`[BOT_EVENT] Requesting data for currency code: ${currencyCode} (will use cache if available).`);
  const data = await fetchNavasanData(); 

  if (!data) {
    const errorMessage = "❌ متاسفانه در حال حاضر امکان دریافت اطلاعات از سرور وجود ندارد یا اطلاعات معتبری دریافت نشد. لطفاً کمی بعد دوباره تلاش کنید.";
    console.error(`[BOT_EVENT] API/Cache data fetch failed or returned null/invalid for action '${currencyCode}'. Replying with error.`);
    await ctx.reply(errorMessage); // Send error message
    // Optionally, resend keyboard even on error if desired
    // const keyboardOnError = getCurrencyKeyboard("مجدداً تلاش کنید یا ارز دیگری انتخاب نمایید:");
    // return ctx.reply(keyboardOnError.text, keyboardOnError.options);
    return;
  }
  
  if (!data[currencyCode]) {
    const errorMessage = `❌ اطلاعات ارز با کد ${currencyCode} در داده‌های موجود یافت نشد. ممکن است مشکلی در دریافت یا پردازش اطلاعات این ارز خاص وجود داشته باشد.`;
    console.warn(`[BOT_EVENT] Data for specific currency_code '${currencyCode}' not found in fetched/cached data. Replying with error.`);
    console.log("[BOT_EVENT] Available data keys in (cached) data:", Object.keys(data));
    await ctx.reply(errorMessage); // Send error message
    // Resend keyboard to allow another selection
    const keyboardAfterNotFound = getCurrencyKeyboard("لطفاً ارز دیگری را انتخاب کنید:");
    return ctx.reply(keyboardAfterNotFound.text, keyboardAfterNotFound.options);
  }

  const currency = data[currencyCode];
  console.log(`[BOT_EVENT] Successfully retrieved data for '${currency.name}' (from API or cache).`);
  console.log(JSON.stringify(currency, null, 2)); 

  const replyMessage = `💸 اطلاعات مربوط به *${currency.name}*:\n\n` +
    `📍 *قیمت:* ${currency.value} تومان\n` +
    `📊 *تغییرات:* ${currency.change} تومان\n` +
    `📅 *تاریخ:* ${currency.date}\n` +
    `\n━━━━━━━━━━━━━━━\n` +
    `🕒 _آخرین بروزرسانی سرور: ${new Date(cache.lastFetchTime).toLocaleTimeString()} ${new Date(cache.lastFetchTime).toLocaleDateString()}_`;


  console.log(`[BOT_EVENT] Replying with currency info for '${currency.name}'.`);
  await ctx.reply(replyMessage, { parse_mode: "Markdown" });

  // Re-send the inline keyboard for another selection
  const keyboardAfterReply = getCurrencyKeyboard("ارز دیگری را انتخاب کنید یا برای شروع مجدد /start را بزنید:");
  console.log(`[BOT_EVENT] Re-sending inline keyboard: "${keyboardAfterReply.text.substring(0,50)}..."`);
  ctx.reply(keyboardAfterReply.text, keyboardAfterReply.options);
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

// Generic text message handler for logging
bot.on('text', (ctx) => {
  const userInfo = ctx.from;
  const messageText = ctx.message.text;
  console.log(
    `[USER_MESSAGE] Received text message from user: ${userInfo.username || userInfo.first_name} (ID: ${userInfo.id}): "${messageText}"`
  );
  if (!messageText.startsWith('/')) { 
     console.log("[BOT_EVENT] No specific handler for this text message. No reply sent.");
  }
});


// --- Bot Launch & Shutdown ---
console.log("[MAIN] 4. Attempting to launch bot...");

bot.launch()
  .then(() => {
    console.log(
      "[MAIN] 5. Bot is running successfully using long polling. Go to Telegram and interact with your bot!"
    );
    if (bot.botInfo && bot.botInfo.username) {
        console.log(`[MAIN] Bot username: @${bot.botInfo.username}`);
    } else {
        console.warn("[MAIN] Bot username could not be determined at this point.");
    }
  })
  .catch((err) => {
    console.error("[MAIN_ERROR] Critical: Failed to launch bot.", err);
    process.exit(1); 
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
