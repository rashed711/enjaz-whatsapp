import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "change_me";
const FORWARD_NUMBER = process.env.FORWARD_NUMBER || ""; // رقمك الشخصي مع كود البلد، مثال: 201XXXXXXXXX
const CALLMEBOT_KEY = process.env.CALLMEBOT_API_KEY || ""; // لو هترسل لإشعار واتساب عبر CallMeBot
const ENABLE_FORWARD = process.env.ENABLE_FORWARD === "true"; // "true" لتفعيل إعادة التوجيه

// Verification endpoint (Meta webhook verification)
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook verified");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Receive incoming messages (Meta will POST here)
let messages = []; // مؤقت - لا يخزن بعد إعادة تشغيل السيرفر
app.post("/webhook", async (req, res) => {
  try {
    const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (message) {
      const from = message.from || "unknown";
      const text = message.text?.body || message?.type || "<no-text>";
      const timestamp = message.timestamp || Date.now() / 1000;

      const msgObj = { from, text, timestamp };
      messages.push(msgObj);
      console.log("New message:", msgObj);

      // إعادة توجيه للواتساب الشخصي عبر CallMeBot (اختياري)
      if (ENABLE_FORWARD && CALLMEBOT_KEY && FORWARD_NUMBER) {
        const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(FORWARD_NUMBER)}&text=${encodeURIComponent(`From:${from}\n${text}`)}&apikey=${encodeURIComponent(CALLMEBOT_KEY)}`;
        // لا ننتظر النتيجة لإسراع الاستجابة للـMeta
        fetch(url).catch(e => console.error("Forward error:", e.message));
      }
    }
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

// Simple UI endpoint to view messages
app.get("/messages", (req, res) => {
  res.json(messages.slice().reverse()); // آخر الرسائل أولاً
});

app.get("/", (req, res) => {
  res.send("Webhook active. GET /messages to see stored messages.");
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
