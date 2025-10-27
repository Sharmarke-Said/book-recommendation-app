import { Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";

/**
 * Request image picker permissions
 */
export const requestImagePermissions = async () => {
  if (Platform.OS === "web") return true;

  const { status } =
    await ImagePicker.requestMediaLibraryPermissionsAsync();
  return status === "granted";
};

/**
 * Pick image from library
 * @returns {Promise<{uri: string, base64: string} | null>}
 */
export const pickImageFromLibrary = async (options = {}) => {
  try {
    const hasPermission = await requestImagePermissions();
    if (!hasPermission) return null;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: options.aspect || [1, 1],
      quality: options.quality || 0.7,
      base64: true,
    });

    if (result.canceled) return null;

    const imageUri = result.assets[0].uri;
    let base64 = result.assets[0].base64;

    // If base64 not provided, convert from file
    if (!base64) {
      base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: "base64",
      });
    }

    return {
      uri: imageUri,
      base64,
    };
  } catch (error) {
    console.error("Error picking image:", error);
    return null;
  }
};
