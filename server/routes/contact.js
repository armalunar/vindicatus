import express from "express";

const r = express.Router();

r.post("/contact", async (req, res) => {
  const { name, contact, topic, message } = req.body || {};

  if (!name || String(name).trim().length < 2) return res.status(400).json({ error: "invalid_name" });
  if (!message || String(message).trim().length < 10) return res.status(400).json({ error: "invalid_message" });

  const webhookUrl = process.env.CONTACT_WEBHOOK_URL;
  if (!webhookUrl) return res.status(500).json({ error: "webhook_not_configured" });

  const payload = {
    content: null,
    embeds: [{
      title: "Novo contato — Vindicatus",
      description: String(message).slice(0, 3500),
      fields: [
        { name: "Nome", value: String(name).slice(0, 200) },
        { name: "Contato", value: String(contact || "não informado").slice(0, 200) },
        { name: "Tema", value: String(topic || "não informado").slice(0, 200) }
      ],
      timestamp: new Date().toISOString()
    }]
  };

  const resp = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!resp.ok) return res.status(502).json({ error: "delivery_failed" });

  res.json({ ok: true });
});

export default r;
