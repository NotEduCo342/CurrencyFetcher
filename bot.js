console.log("1. The Script Starts here....");
const { Telegraf } = require("telegraf");
const { Markup } = require("telegraf");

require("dotenv").config();
const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error(
    "Error: BOT_TOKEN is not defined. Please set it as an environment variable or in a .env file."
  );
  process.exit(1);
}
console.log("2. Bot token loaded.");

const bot = new Telegraf(BOT_TOKEN);
console.log("3. Telegraf instance created.");

//daryafte arz az api
const axios = require('axios');
const API_KEY = 'free4ytAE8muSkoKbKBpNMy4CjtSJgDL'; 
const API_URL = 'http://api.navasan.tech/latest/';
const ITEMS_TO_FETCH = {
  CURRENCY_1: { key: "btc", label: "بیت کوین" },
  CURRENCY_2: { key: "dirham_dubai", label: "درهم دبی" },
  CURRENCY_3: { key: "rob", label: "ربع سکه" },
  CURRENCY_4: { key: "nim", label: "نیم سکه" },
};



// Await : Montazer tamam shodan request bemoon che fail beshe che success
async function fetchNavasanData() {
    try {
        const response = await axios.get(API_URL, {
            params: {
                api_key: API_KEY
            }
        });

        const allData = response.data;
        const extractedData = {};

        // Be Dakhel value har item boro va etelaat json eshon ro fetch kon.
for (const [code, { key, label }] of Object.entries(ITEMS_TO_FETCH)) {
  if (allData[key]) {
    extractedData[code] = {
      name: label,
      value: parseFloat(allData[key].value).toLocaleString(),
      change: parseFloat(allData[key].change).toLocaleString(),
      date: allData[key].date,
    };
  } else {
    extractedData[code] = null;
  }
}


        console.log("Dataye Fetch shode:");
        console.log(JSON.stringify(extractedData, null, 2)); // Khoshgel kardan value json daryaft shode

        return extractedData; // Return kardan value ha
    } catch (error) {
        if (error.response) {

            console.error(`Error fetching data: ${error.response.status}`);
            console.error('Response Data:', error.response.data);
        } else if (error.request) {

            console.error('Error fetching data : Server returned nothing (Timeout)');
            console.error(error.request);
        } else {

            console.error('Error:', error.message);
        }
        return null; 
    }
}


fetchNavasanData();

//end


bot.start((ctx) => {
  console.log(
    `[DEBUG] Received /start from ${ctx.from.username || ctx.from.first_name}`
  );
ctx.reply(
  `سلام ${ctx.from.first_name} به بات Currency Fetcher خوش اومدی! 😁\n\nلطفا ارز مورد نظرت رو انتخاب کن:`,
  Markup.inlineKeyboard([
    [Markup.button.callback("💰 بیت کوین", "CURRENCY_1")],
    [Markup.button.callback("💵 درهم دبی", "CURRENCY_2")],
    [Markup.button.callback("💶 ربع سکه", "CURRENCY_3")],
    [Markup.button.callback("💷 نیم سکه", "CURRENCY_4")],
  ])
);


});
bot.action(/CURRENCY_\d/, async (ctx) => {
  const currencyCode = ctx.match[0];
  await ctx.answerCbQuery();

  const data = await fetchNavasanData();
  if (!data || !data[currencyCode]) {
    return ctx.reply("❌ اطلاعات این ارز در دسترس نیست. لطفاً بعداً تلاش کنید.");
  }

  const currency = data[currencyCode];
ctx.reply(
  `💸 اطلاعات مربوط به *${currency.name}*:\n\n` +
  `📍 *قیمت:* ${currency.value} تومان\n` +
  `📊 *تغییرات:* ${currency.change} تومان\n` +
  `📅 *تاریخ:* ${currency.date}\n` +
  `\n━━━━━━━━━━━━━━━`,
  { parse_mode: "Markdown" }
);


});


bot.help((ctx) => {
  console.log(
    `[DEBUG] Received /help from ${ctx.from.username || ctx.from.first_name}`
  );
  ctx.reply(
    "شما با انتخاب هر ارز میتونید اطلاعاتی مانند قیمت ارز رو چک کنید و اون رو مشاهده کنید"
  );
});




console.log("4. Attempting to launch bot...");
bot.launch()
  .then(() => {
    console.log(
      "5. Bot is running using long polling. Go to Telegram and interact with your bot!"
    );
  })
  .catch((err) => {
    console.error("Failed to launch bot:", err);
  });

process.once("SIGINT", () => {
  console.log("Received SIGINT. Stopping bot...");
  bot.stop("SIGINT");
});
process.once("SIGTERM", () => {
  console.log("Received SIGTERM. Stopping bot...");
  bot.stop("SIGTERM");
});
