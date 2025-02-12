import express from "express";
import verifyAccess from "../middlewares/auth.middlewares.js";
import { getTodos } from "../controllers/todo.controllers.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.render("index");
});

router.get("/login", (req, res) => {
  res.render("login");
});

router.get("/register", (req, res) => {
  res.render("register");
});

router.get("/dashboard", verifyAccess, getTodos, (req, res) => {
  res.render("dashboard", { todos: req.todos });
});

export default router;
