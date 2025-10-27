import User from "../models/User.js";
import jwt from "jsonwebtoken";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "15d",
  });
};

export const register = catchAsync(async (req, res, next) => {
  const { email, username, password } = req.body;

  if (!username || !email || !password) {
    return next(new AppError("All fields are required", 400));
  }

  if (password.length < 6) {
    return next(
      new AppError(
        "Password should be at least 6 characters long",
        400
      )
    );
  }

  if (username.length < 3) {
    return next(
      new AppError(
        "Username should be at least 3 characters long",
        400
      )
    );
  }

  // check if user already exists
  const existingEmail = await User.findOne({ email });
  if (existingEmail) {
    return next(new AppError("Email already exists", 400));
  }

  const existingUsername = await User.findOne({ username });
  if (existingUsername) {
    return next(new AppError("Username already exists", 400));
  }

  const user = new User({
    email,
    username,
    password,
  });

  await user.save();

  const token = generateToken(user._id);

  res.status(201).json({
    status: "success",
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      profileImage: user.profileImage,
      createdAt: user.createdAt,
    },
  });
});

export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError("All fields are required", 400));
  }

  // check if user exists and select password
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return next(new AppError("Invalid credentials", 400));
  }

  // check if password is correct
  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    return next(new AppError("Invalid credentials", 400));
  }

  const token = generateToken(user._id);

  res.status(200).json({
    status: "success",
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      profileImage: user.profileImage,
      createdAt: user.createdAt,
    },
  });
});

export const updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from the collection
  const user = await User.findById(req.user._id).select("+password");
  if (!user) {
    return next(new AppError("User not found.", 404));
  }

  const { passwordCurrent, password, passwordConfirm } = req.body;

  // Validate input
  if (!passwordCurrent || !password || !passwordConfirm) {
    return next(
      new AppError("All password fields are required.", 400)
    );
  }

  if (password.length < 6) {
    return next(
      new AppError(
        "Password should be at least 6 characters long.",
        400
      )
    );
  }

  if (password !== passwordConfirm) {
    return next(
      new AppError(
        "Password and password confirmation do not match.",
        400
      )
    );
  }

  // 2) Check if posted current password is correct
  const isCorrect = await user.comparePassword(passwordCurrent);

  if (!isCorrect) {
    return next(new AppError("Current password is incorrect.", 401));
  }

  // 3) If so, update the password
  user.password = password;
  await user.save(); // user.save() triggers password hashing middleware

  // 4) Log the user in and send the JWT token
  const token = generateToken(user._id);

  res.status(200).json({
    status: "success",
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      profileImage: user.profileImage,
      createdAt: user.createdAt,
    },
  });
});
