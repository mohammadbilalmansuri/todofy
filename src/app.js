import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

import userRoutes from "./routes/user.routes.js";
import todoRoutes from "./routes/todo.routes.js";
import frontendRoutes from "./routes/frontend.routes.js";
import globalErrorHandler from "./middlewares/errorHandler.middleware.js";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Serve static files (CSS, images, JS) BEFORE frontend routes
app.use(express.static(path.join(__dirname, "..", "public")));

app.use(
  cors({
    origin: ["http://localhost:3000"],
    credentials: true,
  })
);
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

// API & Frontend Routes
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/todos", todoRoutes);
app.use("/", frontendRoutes);

// Error Handler Middleware
app.use(globalErrorHandler);

export default app;
