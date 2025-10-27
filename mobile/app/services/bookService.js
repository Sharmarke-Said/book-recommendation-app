import { API_URL } from "../../constants/api";

/**
 * Fetch all books with pagination
 * @param {string} token - Auth token
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @param {Object} options - Additional query options
 * @param {string} options.search - Search term
 * @param {string} options.sort - Sort option
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const fetchBooks = async (
  token,
  page = 1,
  limit = 2,
  options = {}
) => {
  try {
    // Build query string
    let queryString = `page=${page}&limit=${limit}`;

    if (options.search) {
      queryString += `&title=${encodeURIComponent(options.search)}`;
    }

    if (options.sort) {
      queryString += `&sort=${options.sort}`;
    }

    const response = await fetch(`${API_URL}/books?${queryString}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch books");
    }

    return {
      success: true,
      data: {
        books: data.data.books,
        currentPage: data.data.currentPage || page,
        totalPages: data.data.totalPages,
        totalBooks: data.data.totalBooks,
      },
    };
  } catch (error) {
    console.error("Error fetching books:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch books",
    };
  }
};

/**
 * Fetch user's books
 * @param {string} token - Auth token
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export const fetchUserBooks = async (token) => {
  try {
    const response = await fetch(`${API_URL}/books/user`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch user books");
    }

    return {
      success: true,
      data: data.data,
    };
  } catch (error) {
    console.error("Error fetching user books:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch user books",
    };
  }
};

/**
 * Delete a book
 * @param {string} bookId - Book ID to delete
 * @param {string} token - Auth token
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteBook = async (bookId, token) => {
  try {
    const response = await fetch(`${API_URL}/books/${bookId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to delete book");
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting book:", error);
    return {
      success: false,
      error: error.message || "Failed to delete book",
    };
  }
};

/**
 * Process unique books array
 * @param {Array} currentBooks - Current books array
 * @param {Array} newBooks - New books from API
 * @param {boolean} isRefresh - Whether this is a refresh
 * @returns {Array} - Unique books array
 */
export const processUniqueBooks = (
  currentBooks,
  newBooks,
  isRefresh = false
) => {
  if (isRefresh || currentBooks.length === 0) {
    return newBooks;
  }

  // Create unique books array
  const uniqueIds = new Set(
    [...currentBooks, ...newBooks].map((book) => book._id)
  );
  return Array.from(uniqueIds).map((id) =>
    [...currentBooks, ...newBooks].find((book) => book._id === id)
  );
};
