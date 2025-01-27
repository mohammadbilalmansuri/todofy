import ApiError from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import { ACCESS_TOKEN_SECRET } from "../constant.js";

const verifyAccess = (req, _, next) => {
  const token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    throw new ApiError(401, "Unauthorized request! No token provided");
  }

  jwt.verify(token, ACCESS_TOKEN_SECRET, (err, decodedInfo) => {
    if (err) {
      console.error("JWT verification error:", err);
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
