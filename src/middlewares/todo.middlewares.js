import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import Todo from "../models/todo.models.js";

const validateTodo = asyncHandler(async (req, _, next) => {
  const { id } = req.params;
  const todo = await Todo.findById(id);

  if (!todo) {
    throw new ApiError(404, "Todo not found");
  }

  req.todo = todo;
  next();
});

export default validateTodo;
