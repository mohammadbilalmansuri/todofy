import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  deleteUser,
  refreshAccessToken,
} from "../controllers/user.controllers.js";
import verifyAccess from "../middlewares/auth.middlewares.js";

const userRoutes = Router();

userRoutes.post("/register", registerUser);
userRoutes.post("/login", loginUser);
userRoutes.post("/logout", verifyAccess, logoutUser);
userRoutes.delete("/delete", verifyAccess, deleteUser);
userRoutes.patch("/refresh-access-token", refreshAccessToken);

export default userRoutes;
