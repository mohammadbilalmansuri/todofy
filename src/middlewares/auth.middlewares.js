import ApiError from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import { ACCESS_TOKEN_SECRET } from "../constants.js";

const verifyAccess = (req, res, next) => {
  const token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    if (req.path === "/dashboard") {
      return res.redirect("/login");
    }
    throw new ApiError(401, "Unauthorized request! No token provided");
  }

  jwt.verify(token, ACCESS_TOKEN_SECRET, (err, decodedInfo) => {
    if (err) {
      console.error("JWT verification error:", err);
      if (req.path === "/dashboard") {
        return res.redirect("/login");
      }
      throw new ApiError(401, "Invalid or expired access token");
    }

    req.user = {
      id: decodedInfo._id,
      email: decodedInfo.email,
    };
    next();
  });
};

export default verifyAccess;
