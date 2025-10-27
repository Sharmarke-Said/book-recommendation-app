import User from "../models/User.js";
import cloudinary from "../lib/cloudinary.js";
import multer from "multer";
import sharp from "sharp";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";

// Configure multer to use memory storage
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(
      new Error("Not an image! Please upload an image.", 400),
      false
    );
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

export const uploadUserPhoto = upload.single("photo");

export const resizeUserPhoto = async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user._id}-${Date.now()}.jpeg`;

  // Resize image in memory and update the buffer
  const resizedBuffer = await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toBuffer();

  req.file.buffer = resizedBuffer;

  next();
};

export const getUserProfile = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id).select("-password");

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: user,
  });
});

export const updateMe = catchAsync(async (req, res, next) => {
  // 1) Block password updates via this route
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        "This route is not for password updates. Please use /updateMyPassword.",
        400
      )
    );
  }

  // 2) Filter out fields not allowed to be updated
  const filteredBody = {};
  if (req.body.username) filteredBody.username = req.body.username;
  if (req.body.email) filteredBody.email = req.body.email;

  // Check if username or email already exists for another user
  if (filteredBody.username || filteredBody.email) {
    const existingUser = await User.findOne({
      $or: [
        ...(filteredBody.username
          ? [{ username: filteredBody.username }]
          : []),
        ...(filteredBody.email
          ? [{ email: filteredBody.email }]
          : []),
      ],
      _id: { $ne: req.user._id },
    });

    if (existingUser) {
      if (existingUser.username === filteredBody.username) {
        return next(new AppError("Username already exists", 400));
      }
      if (existingUser.email === filteredBody.email) {
        return next(new AppError("Email already exists", 400));
      }
    }
  }

  // 3) Handle photo upload to Cloudinary if file exists
  if (req.file) {
    // Convert buffer to base64 data URL for Cloudinary
    const base64Image = `data:image/jpeg;base64,${req.file.buffer.toString(
      "base64"
    )}`;

    // Upload image to Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(
      base64Image
    );
    filteredBody.profileImage = uploadResponse.secure_url;

    // Get current user to delete old avatar
    const currentUser = await User.findById(req.user._id);

    // Delete old avatar from Cloudinary if it exists and is from Cloudinary
    if (
      currentUser.profileImage &&
      currentUser.profileImage.includes("cloudinary")
    ) {
      try {
        const publicId = currentUser.profileImage
          .split("/")
          .pop()
          .split(".")[0];
        await cloudinary.uploader.destroy(publicId);
      } catch (deleteError) {
        console.log(
          "Error deleting old avatar from cloudinary",
          deleteError
        );
      }
    }
  }

  // 4) Update user document
  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    filteredBody,
    {
      new: true,
      runValidators: true,
    }
  ).select("-password");

  if (!updatedUser) {
    return next(new AppError("User not found", 404));
  }

  // 5) Send response
  res.status(200).json({
    status: "success",
    data: {
      user: updatedUser,
    },
  });
});
