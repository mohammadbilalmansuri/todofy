import { ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET } from "../constants.js";
import jwt from "jsonwebtoken";
import ApiError from "../utils/ApiError.js";
import User from "../models/user.model.js";
import generateAccessAndRefreshTokens from "../utils/generateTokens.js";

export const verifyApi = async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return next(new ApiError(401, "Unauthorized request! No token provided"));
    }

    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
    req.user = { id: decoded._id, email: decoded.email };
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(new ApiError(401, "Access token expired. Please refresh."));
    } else if (err instanceof jwt.JsonWebTokenError) {
      return next(
        new ApiError(401, "Invalid access token. Please log in again.")
      );
    }
    return next(new ApiError(500, "Authentication error occurred"));
  }
};

export const verifyPage = async (req, res, next) => {
  try {
    const accessToken =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (accessToken) {
      const decoded = jwt.verify(accessToken, ACCESS_TOKEN_SECRET);
      req.user = { id: decoded._id, email: decoded.email };
      return next();
    }
  } catch (error) {}

  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) {
    return res
      .clearCookie("accessToken")
      .clearCookie("refreshToken")
      .redirect("/login?message=session_expired");
  }

  try {
    const decodedRefresh = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
    const user = await User.findById(decodedRefresh._id);

    if (!user || user.refreshToken !== refreshToken) {
      return res
        .clearCookie("accessToken")
        .clearCookie("refreshToken")
        .redirect("/login?message=invalid_session");
    }

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshTokens(user);

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
    };

    res.cookie("accessToken", newAccessToken, {
      ...cookieOptions,
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24),
    });

    res.cookie("refreshToken", newRefreshToken, {
      ...cookieOptions,
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    });

    req.user = { id: user._id, email: user.email };
    return next();
  } catch (err) {
    return res
      .clearCookie("accessToken")
      .clearCookie("refreshToken")
      .redirect("/login?message=session_expired");
  }
};
