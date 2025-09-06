const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const express = require('express');
const fs = require('fs');

const app = express();
app.use(express.json());

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] }
});

// Generate QR code as image
client.on('qr', qr => {
    qrcode.toFile('qr.png', qr, { width: 300 }, (err) => {
        if (err) throw err;
        console.log('✅ QR code saved as qr.png');
    });
});

// Ready event
client.on('ready', () => {
    console.log('✅ WhatsApp client is ready!');
});

// Auto-reply example
client.on('message', message => {
    console.log(`📩 New message: ${message.body}`);
    if (message.body.toLowerCase() === 'hi') {
        message.reply('Hello from your WhatsApp bot!');
    }
});

// Send message API
app.post('/send', async (req, res) => {
    const { number, message } = req.body;
    if (!number || !message) return res.status(400).send('Number and message required');
    try {
        const chatId = number.includes('@c.us') ? number : `${number}@c.us`;
        await client.sendMessage(chatId, message);
        res.send('✅ Message sent');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error sending message');
    }
});

// Start server
app.listen(3000, () => console.log('🌐 Server running on port 3000'));

client.initialize();
