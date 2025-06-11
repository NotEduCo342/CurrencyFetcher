// =================================================
// Made by NotEduCo342 (Mahan) And Eilya_Master (Eilya)
// =================================================
// Fetching From the API And returning a clean object value = NotEduCo342
// Making a user entractable bot and show our value to the user = Eilya

// Ta jaye emkan talash shode ke code ghabel toozih bashe.
// @NotEduCo342
// Comment english toye in code didi? baraye khoodam gozashtam




// No Caching process is done in this code. This code Fetches the API values 
// everytime a user clicks on a button so expect the API-key to get limited
// Version 2 bot_Refined.js contains a caching system but for now i will not explain it
// ==========================================================

console.log("1. Start Script !");
const { Telegraf } = require("telegraf");
const { Markup } = require("telegraf");

require("dotenv").config();
const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error(
    "Error: Variable BOT_TOKEN Moshakhas nashode! BOT_TOKEN Ra moshakhas konid."
  );
  process.exit(1);
}
console.log("2. Token Bot Load shod.");

const bot = new Telegraf(BOT_TOKEN);
console.log("3. Session Telegraf sakhte shod.");

//Import kardan library axios
const axios = require("axios");
// az env khareji ham estefade kon Mahan.
// Why external env? For more security, it will be hard coded and if the code leaks
// our api-key is safe.
// const API_KEY = process.env.API_KEY;
const API_KEY = "free4ytAE8muSkoKbKBpNMy4CjtSJgDL";
const API_URL = "http://api.navasan.tech/latest/";

// in variable dar marhale aval yek OBJECT hast. Mahan
const ITEMS_TO_FETCH = {
  CURRENCY_1: { key: "btc", label: "بیت کوین" },
  CURRENCY_2: { key: "dirham_dubai", label: "درهم دبی" },
  CURRENCY_3: { key: "rob", label: "ربع سکه" },
  CURRENCY_4: { key: "nim", label: "نیم سکه" },
};



// In Function OBJECT ITEMS_TO_FETCH ro be array tabdil mikone va be halghe for of mide
// halghe for of ba tekrar roye array haye ma Dataye API Ro sava mikone va doobare dakhel object
// extractedData mirize.
// pas ==> ITEMS_TO_FETCH (OBJECT) ==> Tabdil be Array be esm code (baraye loop for)
// Va sepas doobare tabdil be object tavasot if 
// OBJECT (ITEMS_TO_FETCH) => Array (code) => OBJECT (extarctedDara)

// Async & Await (Mesal CoffeeShop ro bezan.)
// Try & Catch (Bomb Squad Ro mesal bezan)
// Try & Catch Http request handling in case the request goes BOOM.
async function fetchNavasanData() {

  // Anti-Crash (if http request fails, Bomb explodes)
  try {
    const response = await axios.get(API_URL, {
      // Params? Just inserts the API_KEY query into our request to Navasan API :D
      // Ba Tahghighat man benazar mirese params zir majmoe Axios hast.
      // Query ha ba ye ? Shoro mishan va key=value daran age dota key=value darid ba & joda konid.
      // Final thing send to the navsan api will look like this :
      // http://api.navasan.tech/latest/?api_key=free4ytAE8muSkoKbKBpNMy4CjtSJgDL
      params: {
        api_key: API_KEY,
      },
    });

    // response.data contains all the data that we brought from Navasan API
    const allData = response.data;
    // Empty object of extractedData
    // This is the object that will be handed to Eilya
    const extractedData = {};


    // ============ FOR .... OF .... ==============
    // Halghe for ashegh Nazm va Tartibe 
    // Baraye hamin ma az Object.entries ke ye built-in function hast estefade mikonim ta
    // OBJECT items to fetch ro tabdil be ye array ba joft key va value konim.
    // ============ const [code, {key, label}] =============
    // Destructring : kharab kardan sakhtar array items to fetch va jaygozary 
    // Anha be Tartib.

    for (const [code, { key, label }] of Object.entries(ITEMS_TO_FETCH)) {
      if (allData[key]) {
        extractedData[code] = {
          name: label,
          value: parseFloat(allData[key].value).toLocaleString(),
          change: parseFloat(allData[key].change).toLocaleString(),
          date: allData[key].date,
        };
      } else {
        // Agar har kodam az Item haye Array ma undefined bod 
        // on item ro null bokon va az crash jelogiry kon.
        extractedData[code] = null;
      }
    }

    // Neshoon dadan value fetch shode baraye debug or ....
    console.log("Dataye Fetch shode:");

    // json stringify accepts three values (information) : The Value, The Replacer, The Space
    // purpose of null? it is in the replacer seat and says don't change anything from the extractedDara.
    // 2? just adds two white-spaces. nothing to worry about
    // Overall purpose ? just khoshglyfing the extractedData for the developer. Easy to read.
    console.log(JSON.stringify(extractedData, null, 2)); // Khoshgel kardan value json daryaft shode

    return extractedData; // Return kardan value ha, baraye eilya


    // ========= Catch =========
    // Worst case senario : Bomb explodes (http request stalls)
    // Catch will try to show the root of the error and save the script from crashing
    // will show the error code of the request too.
  } catch (error) {
    if (error.response) {
      console.error(`Error fetching data: ${error.response.status}`);
      console.error("Response Data:", error.response.data);
    } else if (error.request) {
      console.error("Error Dar marhale Fetch : Server hich pasokhy nadad! (Timeout)");
      console.error(error.request);
    } else {
      console.error("Error:", error.message);
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

// Sabr baraye tamoom shodan function FetchNasanData
  const data = await fetchNavasanData();

  // data ? agar return null dar function fetchNavasanData ejra beshe =>
  // in if ma True mishe va error user-friendly maro be karbar neshoon mide.

  // Double-Check : !data[currencyCode]
  // hata age catch ma null bar Nagardond bazam etelaat bargashty ro check kon!
  // This makes sure no bugs happens during the recall process
  if (!data || !data[currencyCode]) {
    return ctx.reply(
      "❌ اطلاعات این ارز در دسترس نیست. لطفاً بعداً تلاش کنید."
    );
  }

  const currency = data[currencyCode];
  ctx.reply(
    `💸 اطلاعات مربوط به *${currency.name}*:\n\n` +
      `📍 *قیمت:* ${currency.value} تومان\n\n` +
      `📊 *تغییرات:* ${currency.change} تومان\n\n` +
      `📅 *تاریخ:* ${currency.date}\n` +
      `\n━━━━━━━━━━━━━━━`,
    { parse_mode: "Markdown" }
  );
  await ctx.reply(
    "🔄 لطفاً ارز دیگری را انتخاب کن:",
    Markup.inlineKeyboard([
      [Markup.button.callback("💰 بیت کوین", "CURRENCY_1")],
      [Markup.button.callback("💵 درهم دبی", "CURRENCY_2")],
      [Markup.button.callback("💶 ربع سکه", "CURRENCY_3")],
      [Markup.button.callback("💷 نیم سکه", "CURRENCY_4")],
    ])
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
bot
  .launch()
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
