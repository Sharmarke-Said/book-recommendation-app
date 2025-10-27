import express from "express";
import protect from "../middleware/auth.middleware.js";
import {
  createBook,
  getAllBooks,
  getUserBooks,
  deleteBook,
} from "../controllers/bookController.js";

const router = express.Router();

router.post("/", protect, createBook);
router.get("/", protect, getAllBooks);
router.get("/user", protect, getUserBooks);
router.delete("/:id", protect, deleteBook);

export default router;
