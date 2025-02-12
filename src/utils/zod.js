import { z } from "zod";
import ApiError from "./ApiError.js";

const nameValidation = z
  .string()
  .min(3, "Name must be at least 3 characters long.")
  .max(50, "Name must not exceed 50 characters.");

const emailValidation = z.string().email("Please enter a valid email address.");

const passwordValidation = z
  .string()
  .min(8, "Password must be at least 8 characters long.")
  .max(24, "Password must not exceed 24 characters.")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[\W_]).*$/,
    "Password must include at least one lowercase letter, one uppercase letter, one number, and one special character."
  );

const todoTitleValidation = z
  .string()
  .min(1, "Title is required and cannot be empty.")
  .max(100, "Title must not exceed 100 characters.");

const todoDescriptionValidation = z
  .string()
  .max(200, "Description must not exceed 200 characters.")
  .optional();

const dueTimeValidation = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/,
    "Due time must be in the format YYYY-MM-DDTHH:MM."
  );

export const registerUserValidation = z.object({
  name: nameValidation,
  email: emailValidation,
  password: passwordValidation,
});

export const loginUserValidation = z.object({
  email: emailValidation,
  password: passwordValidation,
});

export const deleteUserValidation = z.object({
  password: passwordValidation,
});

export const todoValidation = z.object({
  title: todoTitleValidation,
  description: todoDescriptionValidation,
  dueTime: dueTimeValidation,
});

export const todoStatusValidation = z.object({
  status: z.boolean(),
});

export const doValidation = (validator, data) => {
  const result = validator.safeParse(data);

  if (!result.success) {
    throw new ApiError(
      422,
      result.error.errors.map((e) => e.message).join(", "),
      result.error.errors.map((e) => e.message)
    );
  }

  return result.data;
};
