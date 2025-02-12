import { Schema, model } from "mongoose";

const todoSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      maxlength: [100, "Title cannot be more than 100 characters"],
      trim: true,
    },
    description: {
      type: String,
      maxlength: [200, "Description cannot be more than 200 characters"],
      trim: true,
    },
    status: {
      type: Boolean,
      default: false,
    },
    dueTime: {
      type: String,
      required: [true, "Due time is required"],
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Owner id is required"],
    },
  },
  { timestamps: true }
);

const Todo = model("Todo", todoSchema);

export default Todo;
