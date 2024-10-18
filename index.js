require("dotenv").config();
const fetch = require("node-fetch");
const telegramApi = require("node-telegram-bot-api");

const token = process.env.TELEGRAM_TOKEN;
const bot = new telegramApi(token, { polling: true });

class CliptechBot {
  constructor() {
    this.sentQuotes = [];
    this.maxQuotes = 50;

    bot.setMyCommands([{ command: "/start", description: "Menu" }]);
    this.mainMenu();
  }

  mainMenu() {
    bot.on("message", (msg) => {
      const chatId = msg.chat.id;
      const text = msg.text;

      switch (text) {
        case "/start":
          bot.sendMessage(chatId, "Co cię interesuje?", {
            reply_markup: {
              keyboard: [
                ["Kurs walut", "API Aforyzmy"],
                ["Кнопка 3", "O nas"],
              ],
              resize_keyboard: true,
              one_time_keyboard: true,
            },
          });
          break;
        case "Kurs walut":
          break;
        case "API Aforyzmy":
          this.apiFetch(chatId); // Теперь используем FavQs
          break;
        case "Кнопка 3":
          break;
        case "O nas":
          break;
        default:
          break;
      }
    });
  }

  async apiFetch(chatId) {
    if (this.sentQuotes.length >= this.maxQuotes) this.sentQuotes = [];

    for (let attempts = 0; attempts < 5; attempts++) {
        try {
            const response = await fetch("http://api.forismatic.com/api/1.0/?method=getQuote&format=json&lang=en");
            if (!response.ok) continue;

            const text = (await response.text()).replace(/\\'/g, "'");
            const data = JSON.parse(text);

            if (data?.quoteText && !this.sentQuotes.includes(data.quoteLink)) {
                this.sentQuotes.push(data.quoteLink);
                const author = data.quoteAuthor || "Anonimus";

                return bot.sendMessage(chatId, `"${data.quoteText}"\n\n— ${author}`, {
                    reply_markup: {
                        keyboard: [["Kurs walut", "API Aforyzmy"], ["Кнопка 3", "O nas"]],
                        resize_keyboard: true, one_time_keyboard: true,
                    },
                });
            }
        } catch (error) {
            console.error("Ошибка запроса/парсинга:", error);
        }
    }
    bot.sendMessage(chatId, "Ошибка получения цитаты. Попробуйте позже.");
}


}

const cliptechBot = new CliptechBot();
