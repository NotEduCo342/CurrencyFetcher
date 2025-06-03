// telegram_bot.js
// This script implements a Telegram bot that fetches currency and commodity prices
// from the Navasan API, caches the results, and provides them to users via inline buttons.

console.log("[MAIN] 1. The Script Starts here....");

// ===================================================================================
// I. MODULE IMPORTS & ENVIRONMENT SETUP
// ===================================================================================
const { Telegraf, Markup } = require("telegraf"); // Telegraf for Telegram Bot API interaction, Markup for inline keyboards
const axios = require('axios'); // Axios for making HTTP requests to the Navasan API
require("dotenv").config(); // Loads environment variables from a .env file (e.g., BOT_TOKEN, NAVASAN_API_KEY)

// ===================================================================================
// II. CONFIGURATION CONSTANTS & VARIABLES
// ===================================================================================

// --- Telegram Bot Configuration ---
const BOT_TOKEN = process.env.BOT_TOKEN; // Telegram Bot Token from .env file

// --- Navasan API Configuration ---
const API_KEY = process.env.NAVASAN_API_KEY || 'free4ytAE8muSkoKbKBpNMy4CjtSJgDL'; // Navasan API Key from .env, with a public fallback
const API_URL = 'http://api.navasan.tech/latest/'; // Base URL for the Navasan API

// --- Items to Fetch from API ---
// Defines the specific items we are interested in from the API response
const ITEMS_TO_FETCH = {
  CURRENCY_1: { key: "btc", label: "بیت کوین" },          // Bitcoin
  CURRENCY_2: { key: "dirham_dubai", label: "درهم دبی" }, // Dubai Dirham
  CURRENCY_3: { key: "rob", label: "ربع سکه" },           // Rob'e Sekeh (Quarter Gold Coin)
  CURRENCY_4: { key: "nim", label: "نیم سکه" },           // Nim Sekeh (Half Gold Coin)
};

// --- Cache Configuration ---
// In-memory cache to store API responses and reduce redundant calls
let cache = {
    data: null,        // Stores the successfully fetched and processed data (ITEMS_TO_FETCH)
    lastFetchTime: 0   // Timestamp (milliseconds) of the last successful data fetch
};
const CACHE_DURATION_MS = 60 * 60 * 1000; // Cache validity duration: 1 hour in milliseconds
// const CACHE_DURATION_MS = 30 * 1000; // For testing cache expiry: 30 seconds

// ===================================================================================
// III. INITIAL VALIDATIONS & SETUP
// ===================================================================================

// --- Bot Token Validation ---
// Ensures the bot token is provided, otherwise exits the script
if (!BOT_TOKEN) {
  console.error(
    "[ERROR] Critical: BOT_TOKEN is not defined. Please set it as an environment variable or in a .env file."
  );
  process.exit(1); // Exit script if BOT_TOKEN is missing
}
console.log("[CONFIG] 2. Bot token loaded successfully.");

// --- API Key Check ---
// Warns if the default public API key is being used
if (API_KEY === 'free4ytAE8muSkoKbKBpNMy4CjtSJgDL') {
    console.warn("[CONFIG] Warning: Using a default Navasan API key. Consider setting NAVASAN_API_KEY in your .env file for better security and management.");
} else {
    console.log("[CONFIG] Navasan API key loaded.");
}

// --- Telegraf Bot Instance Creation ---
const bot = new Telegraf(BOT_TOKEN); // Initialize the Telegraf bot object
console.log("[INIT] 3. Telegraf bot instance created.");

// ===================================================================================
// IV. API DATA FETCHING & CACHING LOGIC
// ===================================================================================

/**
 * Fetches data from the Navasan API, utilizing an in-memory cache.
 * If valid cached data exists (less than CACHE_DURATION_MS old), it's returned.
 * Otherwise, a new API call is made, and the cache is updated on success.
 * @returns {Promise<Object|null>} A promise that resolves to the extracted data object, or null if fetching/processing fails.
 */
async function fetchNavasanData() {
  const currentTime = Date.now();
  console.log(`[CACHE_CHECK] Current time: ${new Date(currentTime).toISOString()}, Last fetch: ${cache.lastFetchTime ? new Date(cache.lastFetchTime).toISOString() : 'N/A'}`);

  // --- Step 1: Check Cache ---
  if (cache.data && (currentTime - cache.lastFetchTime < CACHE_DURATION_MS)) {
    console.log("[CACHE_HIT] fetchNavasanData: Returning data from cache.");
    return cache.data; // Return data from cache if fresh
  }
  console.log("[CACHE_MISS_OR_STALE] fetchNavasanData: Cache miss or stale. Attempting to fetch new data from API.");

  // --- Step 2: API Call (if cache miss or stale) ---
  console.log("[API_CALL] fetchNavasanData: Initiating API call to Navasan.");
  try {
    console.log(`[API_CALL] fetchNavasanData: Requesting URL: ${API_URL} with API_KEY.`);
    const response = await axios.get(API_URL, {
      params: { api_key: API_KEY },
      timeout: 10000 // 10-second timeout for the API request
    });
    console.log(`[API_CALL] fetchNavasanData: Received response with status ${response.status}.`);

    const allData = response.data; // Raw data from API
    if (allData) {
        console.log("[API_CALL] fetchNavasanData: Successfully received raw data from API (keys: " + Object.keys(allData).join(", ") + ").");
    } else {
        console.warn("[API_CALL] fetchNavasanData: Received no data or undefined data from API.");
        // If API returns no data, we don't want to proceed with extraction based on potentially undefined 'allData'
        return null;
    }

    // --- Step 3: Extract Relevant Data ---
    const extractedData = {};
    console.log("[API_CALL] fetchNavasanData: Processing items to extract relevant data...");
    for (const [code, { key, label }] of Object.entries(ITEMS_TO_FETCH)) {
      console.log(`[API_CALL] fetchNavasanData: Checking for item '${label}' (key: '${key}') in API response.`);
      if (allData[key]) { // Check if the specific item key exists in the API response
        extractedData[code] = {
          name: label,
          value: parseFloat(allData[key].value).toLocaleString(), // Format number for readability
          change: parseFloat(allData[key].change).toLocaleString(), // Format number for readability
          date: allData[key].date,
        };
        console.log(`[API_CALL] fetchNavasanData: Extracted data for '${label}':`, extractedData[code]);
      } else {
        extractedData[code] = null; // Mark as null if not found in API response
        console.warn(`[API_CALL] fetchNavasanData: Item '${label}' (key: '${key}') not found in API response.`);
      }
    }
    
    // --- Step 4: Update Cache (if data extraction was successful) ---
    const hasExtractedValues = Object.values(extractedData).some(item => item !== null); // Check if any item was successfully extracted
    if (hasExtractedValues) {
        console.log("[API_CALL] fetchNavasanData: Successfully processed and extracted data.");
        console.log(JSON.stringify(extractedData, null, 2)); // Log the summary of extracted data
        
        // Update cache with the newly fetched and processed data
        cache.data = extractedData;
        cache.lastFetchTime = Date.now(); // Record the time of this successful fetch
        console.log(`[CACHE_UPDATE] fetchNavasanData: Updated cache with new data. Next refresh after ${new Date(cache.lastFetchTime + CACHE_DURATION_MS).toISOString()}`);
        return extractedData;
    } else {
        // If no meaningful data was extracted (e.g., API response structure changed or all items were missing)
        console.warn("[API_CALL] fetchNavasanData: No meaningful data was extracted from the API response. Not updating cache with empty/null data.");
        return null; // Return null to indicate failure to get useful data
    }

  } catch (error) { // Handle errors during the API call or data processing
    console.error("[API_CALL_ERROR] fetchNavasanData: An error occurred while fetching data.");
    if (error.response) { // Server responded with an error status (4xx, 5xx)
      console.error(`[API_CALL_ERROR] fetchNavasanData: Server responded with status ${error.response.status}.`);
      console.error('[API_CALL_ERROR] fetchNavasanData: Response Data (summary):', error.response.data ? JSON.stringify(error.response.data).substring(0, 200) + "..." : "No data");
    } else if (error.request) { // Request was made but no response received (e.g., network issue, timeout)
      console.error('[API_CALL_ERROR] fetchNavasanData: No response received from server (e.g., timeout).');
    } else { // Other errors (e.g., setup issue)
      console.error('[API_CALL_ERROR] fetchNavasanData: Error in request setup:', error.message);
    }
    console.error(`[API_CALL_ERROR] fetchNavasanData: Error message: ${error.message}`);
    console.log("[API_CALL_ERROR] fetchNavasanData: API call failed. Returning null. Old cache (if any) will persist until its expiry.");
    return null; // Return null to indicate failure
  }
}

// ===================================================================================
// V. TELEGRAM BOT HELPER FUNCTIONS
// ===================================================================================

/**
 * Generates the inline keyboard markup for currency selection.
 * @param {string} [promptMessage="لطفا ارز مورد نظرت رو انتخاب کن:"] - The message to display above the keyboard.
 * @returns {object} An object containing the prompt text and Telegraf Markup options for the keyboard.
 */
function getCurrencyKeyboard(promptMessage = "لطفا ارز مورد نظرت رو انتخاب کن:") {
    console.log("[KEYBOARD] Generating currency inline keyboard.");
    return {
        text: promptMessage,
        options: Markup.inlineKeyboard([ // Defines the layout of the inline buttons
            [Markup.button.callback("💰 بیت کوین", "CURRENCY_1")],
            [Markup.button.callback("💵 درهم دبی", "CURRENCY_2")],
            [Markup.button.callback("💶 ربع سکه", "CURRENCY_3")],
            [Markup.button.callback("💷 نیم سکه", "CURRENCY_4")],
        ])
    };
}

// ===================================================================================
// VI. TELEGRAM BOT EVENT HANDLERS
// ===================================================================================

// --- Handler for the /start command ---
bot.start((ctx) => {
  const userInfo = ctx.from; // Information about the user who sent the command
  console.log(
    `[BOT_EVENT] Received /start command from user: ${userInfo.username || userInfo.first_name} (ID: ${userInfo.id})`
  );
  const welcomeMessage = `سلام ${userInfo.first_name || userInfo.username} به بات Currency Fetcher خوش اومدی! 😁`;
  ctx.reply(welcomeMessage); // Send the initial welcome message

  // Send the currency selection keyboard
  const keyboard = getCurrencyKeyboard();
  console.log(`[BOT_EVENT] Replying to /start with inline keyboard: "${keyboard.text.substring(0,50)}..."`);
  ctx.reply(keyboard.text, keyboard.options);
});

// --- Handler for inline button presses (actions) ---
// Matches actions like "CURRENCY_1", "CURRENCY_2", etc.
bot.action(/CURRENCY_(\d)/, async (ctx) => {
  const currencyCode = ctx.match[0]; // The full action string, e.g., "CURRENCY_1"
  const userInfo = ctx.from;

  console.log(
    `[BOT_EVENT] Received action '${currencyCode}' from user: ${userInfo.username || userInfo.first_name} (ID: ${userInfo.id})`
  );

  // Acknowledge the button press to remove the "loading" state on the button in Telegram client
  await ctx.answerCbQuery();
  console.log(`[BOT_EVENT] Answered callback query for action '${currencyCode}'.`);

  // Fetch data (from cache or API)
  console.log(`[BOT_EVENT] Requesting data for currency code: ${currencyCode} (will use cache if available).`);
  const data = await fetchNavasanData(); 

  // Handle cases where data fetching failed
  if (!data) {
    const errorMessage = "❌ متاسفانه در حال حاضر امکان دریافت اطلاعات از سرور وجود ندارد یا اطلاعات معتبری دریافت نشد. لطفاً کمی بعد دوباره تلاش کنید.";
    console.error(`[BOT_EVENT] API/Cache data fetch failed or returned null/invalid for action '${currencyCode}'. Replying with error.`);
    await ctx.reply(errorMessage);
    // Optionally, resend keyboard even on critical error to allow user to try again later
    // const keyboardOnError = getCurrencyKeyboard("مجدداً تلاش کنید یا ارز دیگری انتخاب نمایید:");
    // return ctx.reply(keyboardOnError.text, keyboardOnError.options);
    return; // Stop further processing for this action
  }
  
  // Handle cases where the specific currency data is not available in the fetched data
  if (!data[currencyCode]) {
    const errorMessage = `❌ اطلاعات ارز با کد ${currencyCode} در داده‌های موجود یافت نشد. ممکن است مشکلی در دریافت یا پردازش اطلاعات این ارز خاص وجود داشته باشد.`;
    console.warn(`[BOT_EVENT] Data for specific currency_code '${currencyCode}' not found in fetched/cached data. Replying with error.`);
    console.log("[BOT_EVENT] Available data keys in (cached) data:", Object.keys(data));
    await ctx.reply(errorMessage);
    // Resend keyboard to allow another selection if specific item is not found
    const keyboardAfterNotFound = getCurrencyKeyboard("لطفاً ارز دیگری را انتخاب کنید:");
    return ctx.reply(keyboardAfterNotFound.text, keyboardAfterNotFound.options);
  }

  // If data is available, format and send the reply
  const currency = data[currencyCode];
  console.log(`[BOT_EVENT] Successfully retrieved data for '${currency.name}' (from API or cache).`);
  console.log(JSON.stringify(currency, null, 2)); // Log the specific currency data being sent

  const replyMessage = `💸 اطلاعات مربوط به *${currency.name}*:\n\n` +
    `📍 *قیمت:* ${currency.value} تومان\n` +
    `📊 *تغییرات:* ${currency.change} تومان\n` +
    `📅 *تاریخ:* ${currency.date}\n` +
    `\n━━━━━━━━━━━━━━━\n` +
    `🕒 _آخرین بروزرسانی سرور: ${new Date(cache.lastFetchTime).toLocaleTimeString()} ${new Date(cache.lastFetchTime).toLocaleDateString()}_`; // Show data freshness

  console.log(`[BOT_EVENT] Replying with currency info for '${currency.name}'.`);
  await ctx.reply(replyMessage, { parse_mode: "Markdown" }); // Send data using Markdown for formatting

  // Re-send the inline keyboard to allow the user to make another selection
  const keyboardAfterReply = getCurrencyKeyboard("ارز دیگری را انتخاب کنید یا برای شروع مجدد /start را بزنید:");
  console.log(`[BOT_EVENT] Re-sending inline keyboard: "${keyboardAfterReply.text.substring(0,50)}..."`);
  ctx.reply(keyboardAfterReply.text, keyboardAfterReply.options);
});

// --- Handler for the /help command ---
bot.help((ctx) => {
  const userInfo = ctx.from;
  console.log(
    `[BOT_EVENT] Received /help command from user: ${userInfo.username || userInfo.first_name} (ID: ${userInfo.id})`
  );
  const helpMessage = "شما با انتخاب هر ارز میتونید اطلاعاتی مانند قیمت ارز رو چک کنید و اون رو مشاهده کنید. برای شروع /start را بزنید.";
  console.log(`[BOT_EVENT] Replying to /help with: "${helpMessage}"`);
  ctx.reply(helpMessage);
});

// --- Handler for generic text messages (for logging purposes) ---
bot.on('text', (ctx) => {
  const userInfo = ctx.from;
  const messageText = ctx.message.text;
  console.log(
    `[USER_MESSAGE] Received text message from user: ${userInfo.username || userInfo.first_name} (ID: ${userInfo.id}): "${messageText}"`
  );
  // No specific reply for generic text messages to avoid interrupting command flow or seeming unresponsive to non-commands.
  // Only log if it's not a command (which are handled by other handlers like /start, /help)
  if (!messageText.startsWith('/')) { 
     console.log("[BOT_EVENT] No specific handler for this text message. No reply sent by 'text' handler.");
  }
});


// ===================================================================================
// VII. BOT LAUNCH & PROCESS SIGNAL HANDLING
// ===================================================================================
console.log("[MAIN] 4. Attempting to launch bot...");

// Launch the bot using long polling
bot.launch()
  .then(() => {
    console.log(
      "[MAIN] 5. Bot is running successfully using long polling. Go to Telegram and interact with your bot!"
    );
    // Log bot's username if available
    if (bot.botInfo && bot.botInfo.username) {
        console.log(`[MAIN] Bot username: @${bot.botInfo.username}`);
    } else {
        console.warn("[MAIN] Bot username could not be determined at this point (bot.botInfo might be populated slightly later).");
    }
  })
  .catch((err) => { // Handle errors during bot launch
    console.error("[MAIN_ERROR] Critical: Failed to launch bot.", err);
    process.exit(1); // Exit script if launch fails
  });

// --- Graceful Shutdown Handling ---
// Listen for termination signals to stop the bot gracefully

process.once("SIGINT", () => { // Ctrl+C
  console.log("[MAIN] Received SIGINT. Stopping bot...");
  bot.stop("SIGINT");
  console.log("[MAIN] Bot stopped due to SIGINT.");
  process.exit(0);
});

process.once("SIGTERM", () => { // Kill command
  console.log("[MAIN] Received SIGTERM. Stopping bot...");
  bot.stop("SIGTERM");
  console.log("[MAIN] Bot stopped due to SIGTERM.");
  process.exit(0);
});

console.log("[MAIN] Script setup complete. Bot launch initiated.");
