// 1. Import the Telegraf library
console.log("1. The Script Starts here....");
const { Telegraf } = require('telegraf');

// 2. Your bot token - IMPORTANT: Use environment variables for production!
require('dotenv').config();
const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
    console.error("Error: BOT_TOKEN is not defined. Please set it as an environment variable or in a .env file.");
    process.exit(1);
}
console.log("2. Bot token loaded."); // Added log

// 3. Create a new bot instance
const bot = new Telegraf(BOT_TOKEN);
console.log("3. Telegraf instance created."); // Added log

// 4. Define what your bot should do

// Respond to the /start command
bot.start((ctx) => {
    console.log(`[DEBUG] Received /start from ${ctx.from.username || ctx.from.first_name}`); // Added log
    ctx.reply('Welcome! Send me any text message.');
});

// Respond to the /help command
bot.help((ctx) => {
    console.log(`[DEBUG] Received /help from ${ctx.from.username || ctx.from.first_name}`); // Added log
    ctx.reply('I am a simple echo bot. Type anything, and I will repeat it!');
});

// Respond to any text message
bot.on('text', (ctx) => {
    const userMessage = ctx.message.text;
    console.log(`[DEBUG] Received text: "${userMessage}" from user ${ctx.from.username || ctx.from.first_name}`); // Added log
    ctx.reply(`You said: "${userMessage}"`);
});

// Respond to stickers (just for fun)
bot.on('sticker', (ctx) => {
    console.log(`[DEBUG] Received sticker from ${ctx.from.username || ctx.from.first_name}`); // Added log
    ctx.reply('Nice sticker! 👍');
});

// 5. Launch the bot
console.log("4. Attempting to launch bot..."); // Added log
bot.launch()
  .then(() => {
    console.log('5. Bot is running using long polling. Go to Telegram and interact with your bot!'); // Modified log
  })
  .catch((err) => {
    console.error('Failed to launch bot:', err);
  });

// Enable graceful stop
process.once('SIGINT', () => {
    console.log('Received SIGINT. Stopping bot...'); // Added log
    bot.stop('SIGINT');
});
process.once('SIGTERM', () => {
    console.log('Received SIGTERM. Stopping bot...'); // Added log
    bot.stop('SIGTERM');
});