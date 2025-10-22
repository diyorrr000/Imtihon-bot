const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const app = express();

app.use(express.json());

const TOKEN = '8418303528:AAEmctBa04aph9vDmUsaKJMOndBpQ3kDw7o';
const ADMIN_ID = 7374777673;
const bot = new TelegramBot(TOKEN, {polling: true});

let userAnswers = {};

// Foydalanuvchini qabul qilish
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 
        `🎯 Imtihon Yordamchi Boti\n\n` +
        `Quyidagi linkni imtihon sahifasiga joylashtiring:\n\n` +
        `\`\`\`javascript:import('https://your-app-name.onrender.com/imtihon.js')\`\`\`\n\n` +
        `✅ Savollar avtomatik adminga yuboriladi\n` +
        `✅ Javoblar ekraningizda paydo bo'ladi\n` +
        `🔁 Yangilash: sahifani 2 marta bosing`
    );
});

// Admin panel
bot.onText(/\/admin/, (msg) => {
    if (msg.chat.id == ADMIN_ID) {
        bot.sendMessage(ADMIN_ID, 
            '👨‍💻 Admin paneliga xush kelibsiz!\nFoydalanuvchi savollari shu yerda ko\'rinadi.'
        );
    }
});

// Savollarni qabul qilish
app.post('/question', (req, res) => {
    const {html, userId} = req.body;
    
    // Adminga xabar yuborish
    if (ADMIN_ID) {
        bot.sendMessage(ADMIN_ID, 
            `📩 Yangi savol (#${userId}):\n\n` +
            `${extractTextFromHTML(html).substring(0, 500)}...\n\n` +
            `Javob: /javob_${userId} javoblar`
        );
    }
    
    res.json({success: true});
});

// HTML dan matn olish
function extractTextFromHTML(html) {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

// Javoblarni qayta ishlash
bot.onText(/\/javob_(.+)/, (msg, match) => {
    if (msg.chat.id == ADMIN_ID) {
        const userId = match[1];
        const answer = msg.text.replace(`/javob_${userId}`, '').trim();
        
        userAnswers[userId] = answer;
        
        bot.sendMessage(ADMIN_ID, `✅ Javob #${userId} ga yuborildi`);
    }
});

// Javoblarni olish
app.get('/answer/:userId', (req, res) => {
    const answer = userAnswers[req.params.userId] || '';
    res.json({answer: answer});
});

// Foydalanuvchi skriptini yuklash
app.get('/imtihon.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.send(`
// Foydalanuvchi ID sini yaratish
const userId = Math.floor(Math.random() * 100000000);
let lastAnswer = '';

// Sahifa tarkibini serverga yuborish
async function sendQuestions() {
    try {
        const htmlContent = document.documentElement.outerHTML;
        
        await fetch('https://your-app-name.onrender.com/question', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                html: htmlContent,
                userId: userId
            })
        });
        
        showNotification('✅ Savollar adminga yuborildi!');
    } catch(error) {
        console.log('Xatolik:', error);
    }
}

// Javoblarni tekshirish
async function checkForAnswers() {
    try {
        const response = await fetch('https://your-app-name.onrender.com/answer/' + userId);
        const data = await response.json();
        
        if (data.answer && data.answer !== lastAnswer) {
            lastAnswer = data.answer;
            showFloatingAnswer(data.answer);
        }
    } catch(error) {}
}

// Suzuvchi javob oynasi
function showFloatingAnswer(answer) {
    const existing = document.getElementById('floatingAnswerWindow');
    if (existing) existing.remove();
    
    const answerWindow = document.createElement('div');
    answerWindow.id = 'floatingAnswerWindow';
    answerWindow.innerHTML = \\\`<div style="
        position: fixed;
        bottom: 15px;
        right: 15px;
        background: #000000;
        color: #00ff00;
        padding: 10px 12px;
        border-radius: 8px;
        font-family: monospace;
        font-size: 13px;
        z-index: 999999;
        max-width: 280px;
        opacity: 0.95;
        border: 2px solid #00ff00;
        box-shadow: 0 0 15px rgba(0, 255, 0, 0.5);
    ">
        <div style="font-weight: bold; margin-bottom: 5px;">🎯 JAVOBLAR:</div>
        <div style="color: #ffffff;">\\\${answer}</div>
    </div>\\\`;
    
    document.body.appendChild(answerWindow);
    
    setTimeout(() => {
        if (answerWindow.parentNode) answerWindow.remove();
    }, 45000);
}

// Bildirishnoma
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = \\\`
        position: fixed;
        top: 20px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        z-index: 999999;
        font-family: sans-serif;
        font-size: 14px;
        font-weight: bold;
    \\\`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) notification.remove();
    }, 4000);
}

// Dasturni ishga tushirish
sendQuestions();
setInterval(checkForAnswers, 8000);

// Qo'lda yangilash
document.addEventListener('dblclick', () => {
    sendQuestions();
    showNotification('🔄 Savollar yangilandi!');
});

// Boshlang'ich bildirishnoma
showNotification('🎯 Tizim ishga tushdi! ID: ' + userId);
    \\\`);
});

// Bosh sahifa
app.get('/', (req, res) => {
    res.send('🚀 Imtihon Bot Serveri Ishlamoqda');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(\\\`🚀 Server \\\${PORT} portida ishga tushdi\\\`);
});
