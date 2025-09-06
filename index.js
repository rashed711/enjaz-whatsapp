import express from "express";
import qrcode from "qrcode-terminal";
import pkg from "whatsapp-web.js";
const { Client, LocalAuth } = pkg;

const app = express();
app.use(express.json());

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: { headless: true }
});

client.on("qr", qr => {
  console.log("Scan this QR code:");
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  console.log("✅ WhatsApp bot is ready!");
});

client.on("message", msg => {
  console.log(`📩 Message from ${msg.from}: ${msg.body}`);
  if (msg.body.toLowerCase() === "hi") {
    msg.reply("Hello! WhatsApp bot here 🚀");
  }
});

app.post("/send", async (req, res) => {
  const { number, message } = req.body;
  if (!number || !message) return res.status(400).send("Missing number or message");
  try {
    const chatId = number.includes("@c.us") ? number : `${number}@c.us`;
    await client.sendMessage(chatId, message);
    res.send({ status: "sent" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error sending message");
  }
});

app.listen(3000, () => console.log("🌐 Server running on port 3000"));
client.initialize();
