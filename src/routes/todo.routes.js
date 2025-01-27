import { Router } from "express";
import verifyAccess from "../middlewares/auth.middlewares.js";
import validateTodo from "../middlewares/todo.middlewares.js";
import {
  getTodos,
  addTodo,
  updateTodo,
  toggleTodoStatus,
  deleteTodo,
} from "../controllers/todo.controllers.js";

const todoRoutes = Router();

todoRoutes.get("/", verifyAccess, getTodos);
todoRoutes.post("/add", verifyAccess, addTodo);
todoRoutes.put("/update/:id", verifyAccess, validateTodo, updateTodo);
todoRoutes.patch("/status/:id", verifyAccess, validateTodo, toggleTodoStatus);
todoRoutes.delete("/delete/:id", verifyAccess, validateTodo, deleteTodo);

export default todoRoutes;
