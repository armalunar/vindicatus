import admin from "firebase-admin";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import session from "express-session";
import { db } from "./db.js";

// Inicializar Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: "vindicatus-ce514"
  });
}

export async function verifyFirebaseToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const token = authHeader.split("Bearer ")[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    const email = decodedToken.email;

    // Buscar usuário no banco local pelo email (username)
    let user = db.prepare("SELECT * FROM users WHERE username = ?").get(email);

    if (!user) {
      // Se não existe, e é o primeiro usuário, torná-lo supreme
      const count = db.prepare("SELECT COUNT(*) as total FROM users").get().total;
      const role = count === 0 ? "supreme" : "curator";
      
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO users (username, password_hash, role, name, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(email, "firebase_managed", role, decodedToken.name || email.split("@")[0], now);
      
      user = db.prepare("SELECT * FROM users WHERE username = ?").get(email);
    }

    req.session.user = user;
    next();
  } catch (error) {
    console.error("Firebase auth error:", error);
    return res.status(401).json({ error: "invalid_token" });
  }
}

export function applySecurity(app, { sessionSecret }) {
  app.disable("x-powered-by");

  app.set("trust proxy", 1);

  app.use(helmet({
    contentSecurityPolicy: false, 
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false
  }));

  app.use(rateLimit({
    windowMs: 60_000,
    limit: 180,
    standardHeaders: "draft-7",
    legacyHeaders: false
  }));

  app.use(session({
    name: "vx_session",
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: false, 
      maxAge: 1000 * 60 * 60 * 8
    }
  }));
}

export function requireAuth(req, res, next) {
  if (req.session?.user?.id) return next();
  return res.status(401).json({ error: "unauthorized" });
}

export function requireSupreme(req, res, next) {
  if (req.session?.user?.role === "supreme") return next();
  return res.status(403).json({ error: "forbidden" });
}
