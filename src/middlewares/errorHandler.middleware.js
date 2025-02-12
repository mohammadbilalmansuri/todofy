import ApiError from "../utils/ApiError.js";

const globalErrorHandler = (err, req, res, next) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      statusCode: err.statusCode,
      message: err.message,
      ...(err.errors.length > 0 && { errors: err.errors }),
      success: err.success,
    });
  }
  console.error("Unhandled error:", err);
  res.status(500).json({
    statusCode: 500,
    message: "Internal Server Error",
    success: false,
  });
};

export default globalErrorHandler;
