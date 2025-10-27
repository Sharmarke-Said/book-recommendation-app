import { API_URL } from "../../constants/api";

/**
 * Update user profile (username, email, profile image)
 * @param {Object} params - Profile update parameters
 * @param {string} params.username - New username
 * @param {string} params.email - New email
 * @param {string} params.profileImage - Profile image URI
 * @param {string} params.imageBase64 - Profile image base64
 * @param {Object} params.currentUser - Current user object
 * @param {string} params.token - Auth token
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const updateProfile = async ({
  username,
  email,
  profileImage,
  imageBase64,
  currentUser,
  token,
}) => {
  try {
    // Create FormData for multipart form
    const formData = new FormData();

    // Add username if changed
    if (username && username !== currentUser.username) {
      formData.append("username", username);
    }

    // Add email if changed
    if (email && email !== currentUser.email) {
      formData.append("email", email);
    }

    // Add photo if selected
    if (imageBase64 && profileImage) {
      const uriParts = profileImage.split(".");
      const fileType = uriParts[uriParts.length - 1];
      const filename = `user-${Date.now()}.${fileType || "jpeg"}`;

      formData.append("photo", {
        uri: profileImage,
        type: `image/${fileType || "jpeg"}`,
        name: filename,
      });
    }

    const response = await fetch(`${API_URL}/users/update-me`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || data.message || "Failed to update profile"
      );
    }

    return {
      success: true,
      data: data.data.user,
    };
  } catch (error) {
    console.error("Error updating profile:", error);
    return {
      success: false,
      error: error.message || "Failed to update profile",
    };
  }
};

/**
 * Validate password fields
 * @param {Object} params - Password validation parameters
 * @param {string} params.passwordCurrent - Current password
 * @param {string} params.password - New password
 * @param {string} params.passwordConfirm - Password confirmation
 * @returns {Object|null} - Error object or null if valid
 */
export const validatePassword = ({
  passwordCurrent,
  password,
  passwordConfirm,
}) => {
  if (!passwordCurrent || !password || !passwordConfirm) {
    return {
      field: "all",
      message: "Please fill in all password fields",
    };
  }

  if (password.length < 6) {
    return {
      field: "password",
      message: "Password should be at least 6 characters long",
    };
  }

  if (password !== passwordConfirm) {
    return {
      field: "passwordConfirm",
      message: "Password and password confirmation do not match",
    };
  }

  return null;
};

/**
 * Update user password
 * @param {Object} params - Password update parameters
 * @param {string} params.passwordCurrent - Current password
 * @param {string} params.password - New password
 * @param {string} params.passwordConfirm - Password confirmation
 * @param {string} params.token - Auth token
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const updatePassword = async ({
  passwordCurrent,
  password,
  passwordConfirm,
  token,
}) => {
  try {
    const validationError = validatePassword({
      passwordCurrent,
      password,
      passwordConfirm,
    });

    if (validationError) {
      return {
        success: false,
        error: validationError.message,
      };
    }

    const response = await fetch(
      `${API_URL}/users/updateMyPassword`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          passwordCurrent,
          password,
          passwordConfirm,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || data.message || "Failed to update password"
      );
    }

    return {
      success: true,
      data: {
        token: data.token,
        user: data.user,
      },
    };
  } catch (error) {
    console.error("Error updating password:", error);
    return {
      success: false,
      error: error.message || "Failed to update password",
    };
  }
};
