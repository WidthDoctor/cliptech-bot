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
    if (this.sentQuotes.length >= this.maxQuotes) {
        this.sentQuotes = [];
    }

    let data = null;
    let attempts = 0;
    const maxAttempts = 5;  // Ограничение на количество попыток

    // Цикл для повторных попыток
    while (!data && attempts < maxAttempts) {
        attempts++;
        try {
            // Получаем ответ от API как текст
            const response = await fetch(
                "http://api.forismatic.com/api/1.0/?method=getQuote&format=json&lang=en"
            );

            if (!response.ok) {
                throw new Error('Ошибка на стороне сервера: ' + response.status);
            }

            // Получаем текст ответа
            let text = await response.text();

            // Исправляем некорректное экранирование апострофов
            text = text.replace(/\\'/g, "'");

            // Пробуем распарсить текст в JSON вручную
            try {
                data = JSON.parse(text);

                // Проверяем, есть ли текст цитаты (основное поле)
                if (!data || !data.quoteText) {
                    throw new Error('Некорректный JSON: отсутствует текст цитаты');
                }
            } catch (jsonError) {
                console.error("Ошибка при парсинге JSON:", jsonError);
                console.error("Ответ от API:", text);
                data = null;  // Сбрасываем данные для повторной попытки запроса
            }
        } catch (error) {
            console.error("Ошибка получения данных или битый JSON, повтор запроса:", error);
            data = null;  // Сбрасываем данные для повторной попытки запроса
        }
    }

    if (data) {
        // Проверка на уникальность цитаты
        if (!this.sentQuotes.includes(data.quoteLink)) {
            this.sentQuotes.push(data.quoteLink);

            // Если автор пустой, подставляем значение по умолчанию
            const author = data.quoteAuthor ? data.quoteAuthor : "Anonimus";

            // Отправляем цитату в чат
            bot.sendMessage(chatId, `"${data.quoteText}"\n\n— ${author}`, {
                reply_markup: {
                    keyboard: [
                        ["Kurs walut", "API Aforyzmy"],
                        ["Кнопка 3", "O nas"],
                    ],
                    resize_keyboard: true,
                    one_time_keyboard: true,
                },
            });
        } else {
            // Если цитата уже была, пробуем снова
            this.apiFetch(chatId);
        }
    } else {
        // Если после всех попыток не удалось получить корректный JSON
        bot.sendMessage(chatId, "Произошла ошибка при получении цитаты. Попробуйте снова позже.");
    }
}


}

const cliptechBot = new CliptechBot();
