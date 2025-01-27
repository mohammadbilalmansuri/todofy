import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/user.routes.js";
import todoRoutes from "./routes/todo.routes.js";
import globalErrorHandler from "./middlewares/errorHandler.middleware.js";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

// API Routes
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/todos", todoRoutes);

// Serve Frontend Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "login.html"));
});
app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "register.html"));
});
app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "dashboard.html"));
});

// Static File Middleware (MUST COME AFTER FRONTEND ROUTES)
app.use(express.static(path.join(__dirname, "..", "public")));

// Global Error Handler
app.use(globalErrorHandler);

export default app;
