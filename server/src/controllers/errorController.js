import AppError from "../utils/appError.js";

// Handle Mongoose CastError
const handleCastErrorDB = (err) =>
  new AppError(`Invalid ${err.path}: ${err.value}`, 400);

// Handle duplicate fields error
const handleDuplicateFieldsDB = (err) => {
  const value = err.keyValue
    ? JSON.stringify(err.keyValue)
    : "Duplicate field value";
  return new AppError(
    `Duplicate field value: ${value}. Please use another!`,
    400
  );
};

// Handle Mongoose validation error
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors || {}).map(
    (el) => el.message || "Invalid input"
  );
  return new AppError(
    `Invalid input data. ${errors.join(". ")}`,
    400
  );
};

// Handle JWT errors
const handleJWTError = () =>
  new AppError("Invalid token. Please log in again!", 401);

const handleJWTExpiredError = () =>
  new AppError("Your token has expired! Please log in again.", 401);

// Global error handler
const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  const env = process.env.NODE_ENV || "development";

  if (env === "development") {
    console.error("💥 ERROR:", err);
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }

  // Production
  let error = { ...err, message: err.message };

  if (error.name === "CastError") error = handleCastErrorDB(error);
  if (error.code === 11000) error = handleDuplicateFieldsDB(error);
  if (error.name === "ValidationError")
    error = handleValidationErrorDB(error);
  if (error.name === "JsonWebTokenError") error = handleJWTError();
  if (error.name === "TokenExpiredError")
    error = handleJWTExpiredError();

  if (error.isOperational) {
    return res.status(error.statusCode).json({
      status: error.status,
      message: error.message,
    });
  }

  console.error("💥 UNKNOWN ERROR:", error);
  return res.status(500).json({
    status: "error",
    message: "Something went very wrong!",
  });
};

export { globalErrorHandler };
