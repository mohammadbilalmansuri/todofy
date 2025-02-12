import { Router } from "express";
import { verifyApi } from "../middlewares/auth.middleware.js";
import validateTodo from "../middlewares/todo.middleware.js";
import {
  getTodos,
  addTodo,
  updateTodo,
  toggleTodoStatus,
  deleteTodo,
} from "../controllers/todo.controllers.js";

const todoRoutes = Router();

todoRoutes.get("/", verifyApi, getTodos);
todoRoutes.get("/dashboard", verifyApi, getTodos);
todoRoutes.post("/add", verifyApi, addTodo);
todoRoutes.put("/update/:id", verifyApi, validateTodo, updateTodo);
todoRoutes.patch("/status/:id", verifyApi, validateTodo, toggleTodoStatus);
todoRoutes.delete("/delete/:id", verifyApi, validateTodo, deleteTodo);

export default todoRoutes;
