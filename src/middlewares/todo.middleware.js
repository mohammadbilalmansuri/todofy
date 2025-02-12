import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import Todo from "../models/todo.model.js";
import mongoose from "mongoose";

const validateTodo = asyncHandler(async (req, _, next) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, "Invalid Todo ID format");
  }

  const todo = await Todo.findById(id);
  if (!todo) throw new ApiError(404, "Todo not found");

  if (todo.owner.toString() !== req.user.id) {
    throw new ApiError(403, "You do not have permission to access this todo");
  }

  req.todo = todo;
  next();
});

export default validateTodo;
