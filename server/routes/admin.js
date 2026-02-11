import { Router } from "express";
import { db, toList, toJSON } from "../db.js";
import { verifyFirebaseToken, requireAuth, requireSupreme } from "../security.js";

const r = Router();

r.post("/login-firebase", verifyFirebaseToken, (req, res) => {
  res.json({ ok: true, user: req.session.user });
});

r.post("/logout", (req, res) => {
  req.session.destroy();
  res.json({ ok: true });
});

r.get("/me", requireAuth, (req, res) => {
  res.json({ me: req.session.user });
});

r.post("/me/profile", requireAuth, async (req, res) => {
  const { name, photo_url } = req.body || {};
  if (!name) return res.status(400).json({ error: "name_required" });

  await db.collection("users").doc(req.session.user.id).update({
    name,
    photo_url: photo_url || null
  });

  req.session.user.name = name;
  req.session.user.photo_url = photo_url || null;

  res.json({ ok: true });
});

r.post("/posts", requireAuth, async (req, res) => {
  const { title, cover_url, content_html, images } = req.body || {};

  if (!title || title.trim().length < 3)
    return res.status(400).json({ error: "invalid_title" });

  if (!content_html || content_html.trim().length < 10)
    return res.status(400).json({ error: "invalid_content" });

  const now = new Date().toISOString();

  const docRef = await db.collection("posts").add({
    title: title.trim().slice(0, 160),
    cover_url: cover_url || null,
    content_html,
    author_id: req.session.user.id,
    author_name: req.session.user.name,
    images: Array.isArray(images) ? images : [],
    created_at: now,
    updated_at: now
  });

  res.json({ ok: true, id: docRef.id });
});

r.put("/posts/:id", requireAuth, async (req, res) => {
  const id = req.params.id;
  const { title, cover_url, content_html, images } = req.body || {};

  const postRef = db.collection("posts").doc(id);
  const postDoc = await postRef.get();
  
  if (!postDoc.exists) return res.status(404).json({ error: "not_found" });
  const post = postDoc.data();

  const isOwner = post.author_id === req.session.user.id;
  const isSupreme = req.session.user.role === "supreme";
  if (!isOwner && !isSupreme)
    return res.status(403).json({ error: "forbidden" });

  const now = new Date().toISOString();

  await postRef.update({
    title: title?.trim().slice(0, 160) || post.title,
    cover_url: cover_url ?? post.cover_url,
    content_html: content_html || post.content_html,
    images: Array.isArray(images) ? images : (post.images || []),
    updated_at: now
  });

  res.json({ ok: true });
});

r.delete("/posts/:id", requireAuth, async (req, res) => {
  const id = req.params.id;
  const postRef = db.collection("posts").doc(id);
  const postDoc = await postRef.get();

  if (!postDoc.exists) return res.status(404).json({ error: "not_found" });
  const post = postDoc.data();

  const isOwner = post.author_id === req.session.user.id;
  const isSupreme = req.session.user.role === "supreme";
  if (!isOwner && !isSupreme)
    return res.status(403).json({ error: "forbidden" });

  await postRef.delete();
  res.json({ ok: true });
});

r.get("/curators", requireSupreme, async (req, res) => {
  const snapshot = await db.collection("users").where("role", "==", "curator").get();
  res.json(toList(snapshot));
});

r.post("/curators", requireSupreme, async (req, res) => {
  const { username, name } = req.body || {};
  if (!username) return res.status(400).json({ error: "username_required" });

  const now = new Date().toISOString();
  // No Firestore, usamos o username (email) como ID ou verificamos existência
  const userRef = db.collection("users").doc(username);
  const existing = await userRef.get();
  
  if (existing.exists) return res.status(400).json({ error: "username_exists" });

  await userRef.set({
    username,
    role: "curator",
    name: name || username.split("@")[0],
    created_at: now
  });

  res.json({ ok: true });
});

r.delete("/curators/:id", requireSupreme, async (req, res) => {
  const id = req.params.id;
  await db.collection("users").doc(id).delete();
  res.json({ ok: true });
});

export default r;
