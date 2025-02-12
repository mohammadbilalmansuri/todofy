import { Router } from "express";
import { verifyPage } from "../middlewares/auth.middleware.js";
import { getTodos } from "../controllers/todo.controllers.js";

const frontendRoutes = Router();

frontendRoutes.get("/", (req, res) => res.render("index"));
frontendRoutes.get("/login", (req, res) => res.render("login"));
frontendRoutes.get("/register", (req, res) => res.render("register"));
frontendRoutes.get("/dashboard", verifyPage, getTodos, (req, res) =>
  res.render("dashboard", { todos: req.todos })
);

export default frontendRoutes;
