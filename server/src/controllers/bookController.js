import cloudinary from "../lib/cloudinary.js";
import Book from "../models/Book.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import ApiFeatures from "../utils/apiFeatures.js";

export const createBook = catchAsync(async (req, res, next) => {
  const { title, caption, rating, image } = req.body;

  if (!image || !title || !caption || !rating) {
    return next(new AppError("Please provide all fields", 400));
  }

  // upload the image to cloudinary
  const uploadResponse = await cloudinary.uploader.upload(image);
  const imageUrl = uploadResponse.secure_url;

  // save to the database
  const newBook = new Book({
    title,
    caption,
    rating,
    image: imageUrl,
    user: req.user._id,
  });

  await newBook.save();

  res.status(201).json({
    status: "success",
    data: newBook,
  });
});

export const getAllBooks = catchAsync(async (req, res, next) => {
  const apiFeatures = new ApiFeatures(
    Book.find().populate("user", "username profileImage"),
    req.query
  );

  const books = await apiFeatures
    .filter()
    .sort()
    .limitFields()
    .paginate().query;

  const totalBooks = await Book.countDocuments();

  res.status(200).json({
    status: "success",
    results: books.length,
    data: {
      books,
      currentPage: req.query.page * 1 || 1,
      totalBooks,
      totalPages: Math.ceil(
        totalBooks / (req.query.limit * 1 || 100)
      ),
    },
  });
});

export const getUserBooks = catchAsync(async (req, res, next) => {
  const books = await Book.find({ user: req.user._id }).sort({
    createdAt: -1,
  });

  res.status(200).json({
    status: "success",
    results: books.length,
    data: books,
  });
});

export const deleteBook = catchAsync(async (req, res, next) => {
  const book = await Book.findById(req.params.id);

  if (!book) {
    return next(new AppError("Book not found", 404));
  }

  // check if user is the creator of the book
  if (book.user.toString() !== req.user._id.toString()) {
    return next(new AppError("Unauthorized", 401));
  }

  // delete image from cloudinary as well
  if (book.image && book.image.includes("cloudinary")) {
    try {
      const publicId = book.image.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(publicId);
    } catch (deleteError) {
      console.log(
        "Error deleting image from cloudinary",
        deleteError
      );
    }
  }

  await book.deleteOne();

  res.status(200).json({
    status: "success",
    message: "Book deleted successfully",
  });
});
