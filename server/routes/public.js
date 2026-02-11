import express from "express";
import { db, toList, toJSON } from "../db.js";

const r = express.Router();

r.get("/curators", async (req, res) => {
  const snapshot = await db.collection("users")
    .where("role", "==", "curator")
    .orderBy("created_at", "desc")
    .limit(50)
    .get();
  res.json(toList(snapshot));
});

r.get("/posts", async (req, res) => {
  const snapshot = await db.collection("posts")
    .orderBy("created_at", "desc")
    .get();
  res.json(toList(snapshot));
});

r.get("/posts/:id", async (req, res) => {
  const id = req.params.id;
  const doc = await db.collection("posts").doc(id).get();

  if (!doc.exists) return res.status(404).json({ error: "not_found" });
  res.json(toJSON(doc));
});

export default r;
