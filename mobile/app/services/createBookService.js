import { API_URL } from "../../constants/api";

/**
 * Pick image from library (UI-agnostic version)
 * Returns image data that can be used by the component
 * Note: Image picking logic should be handled in the component
 * This function only provides a template for the data structure
 *
 * @param {string} imageUri - Image URI
 * @param {string} imageBase64 - Image base64 string
 * @returns {Object|null} - Image data object or null
 */
export const formatImageData = (imageUri, imageBase64) => {
  if (!imageBase64) return null;

  // Get file extension from URI or default to jpeg
  const uriParts = imageUri.split(".");
  const fileType = uriParts[uriParts.length - 1];
  const imageType =
    fileType ? `image/${fileType.toLowerCase()}` : "image/jpeg";

  const imageDataUrl = `data:${imageType};base64,${imageBase64}`;

  return {
    uri: imageUri,
    base64: imageBase64,
    dataUrl: imageDataUrl,
  };
};

/**
 * Validate book creation data
 * @param {Object} data - Book data to validate
 * @param {string} data.title - Book title
 * @param {string} data.caption - Book caption
 * @param {number} data.rating - Book rating
 * @param {string} data.imageBase64 - Image base64
 * @returns {Object|null} - Error object or null if valid
 */
export const validateBookData = ({
  title,
  caption,
  rating,
  imageBase64,
}) => {
  if (!title || !caption || !imageBase64 || !rating) {
    return {
      field: "all",
      message: "Please fill in all fields",
    };
  }

  return null;
};

/**
 * Create a book recommendation
 * @param {Object} bookData - Book data
 * @param {string} bookData.title - Book title
 * @param {string} bookData.caption - Book caption
 * @param {number} bookData.rating - Book rating
 * @param {string} bookData.image - Image data URL
 * @param {string} token - Auth token
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const createBook = async (
  { title, caption, rating, image },
  token
) => {
  try {
    const validationError = validateBookData({
      title,
      caption,
      rating,
      imageBase64: image,
    });

    if (validationError) {
      return {
        success: false,
        error: validationError.message,
      };
    }

    const response = await fetch(`${API_URL}/books`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        caption,
        rating: rating.toString(),
        image,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Something went wrong");
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("Error creating book:", error);
    return {
      success: false,
      error: error.message || "Something went wrong",
    };
  }
};
