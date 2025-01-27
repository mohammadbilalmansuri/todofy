import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import {
  todoValidation,
  todoStatusValidation,
  doValidation,
} from "../utils/zod.js";
import Todo from "../models/todo.models.js";

export const getTodos = asyncHandler(async (req, res) => {
  const todos = await Todo.find({ owner: req.user?.id });

  if (todos.length === 0) {
    return new ApiResponse(200, "No todos found", []).send(res);
  }

  return new ApiResponse(200, "Todos fetched successfully", todos).send(res);
});

export const addTodo = asyncHandler(async (req, res) => {
  const { title, description, dueTime } = doValidation(
    todoValidation,
    req.body
  );

  const createdTodo = await Todo.create({
    title,
    description: description || "",
    dueTime,
    owner: req.user?.id,
  });

  return new ApiResponse(201, "Todo created successfully", createdTodo).send(
    res
  );
});

export const updateTodo = asyncHandler(async (req, res) => {
  const { title, description, dueTime } = doValidation(
    todoValidation,
    req.body
  );

  const todoToUpdate = req.todo;

  todoToUpdate.title = title;
  todoToUpdate.description = description || "";
  todoToUpdate.dueTime = dueTime;

  const updatedTodo = await todoToUpdate.save();

  return new ApiResponse(200, "Todo updated successfully", updatedTodo).send(
    res
  );
});

export const toggleTodoStatus = asyncHandler(async (req, res) => {
  const { status } = doValidation(todoStatusValidation, req.body);

  const todoToUpdate = req.todo;
  todoToUpdate.status = status;
  const updatedTodo = await todoToUpdate.save();

  return new ApiResponse(
    200,
    "Todo status updated successfully",
    updatedTodo
  ).send(res);
});

export const deleteTodo = asyncHandler(async (req, res) => {
  await req.todo.deleteOne();
  return new ApiResponse(200, "Todo deleted successfully").send(res);
});
