import "dotenv/config";
import express from "express";
import path from "node:path";
import { applySecurity } from "./security.js";

const app = express();

// Segurança
applySecurity(app, { sessionSecret: process.env.SESSION_SECRET || "dev_secret" });

// ✅ AUMENTADO: base64 em JSON é grande
app.use(express.json({ limit: "60mb" }));
app.use(express.urlencoded({ extended: true, limit: "60mb" }));

// Redirect /admin
app.get("/admin", (req, res) => res.redirect("/admin/login.html"));

// Static público
app.use("/", express.static(path.join(process.cwd(), "public"), {
  setHeaders: (res) => {
    res.setHeader("Cache-Control", "no-cache");
  }
}));

// Rotas dinâmicas (Importação assíncrona para compatibilidade Vercel se necessário)
import publicRoutes from "./routes/public.js";
import contactRoutes from "./routes/contact.js";
import adminRoutes from "./routes/admin.js";

app.use("/api", publicRoutes);
app.use("/api", contactRoutes);
app.use("/api/admin", adminRoutes);

const port = process.env.PORT || 5000;
app.listen(port, "0.0.0.0", () => {
  console.log("================================");
  console.log("VINDICATUS ONLINE (FIREBASE)");
  console.log(`Porta → ${port}`);
  console.log("================================");
});

export default app;
