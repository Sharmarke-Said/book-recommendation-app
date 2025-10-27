import { useState } from "react";
import {
  View,
  Text,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constants/colors";
import { useAuthStore } from "../../store/authStore";
import styles from "../../assets/styles/settings.styles";
import {
  updateProfile,
  updatePassword,
} from "../services/settingsService";
import { pickImageFromLibrary } from "../utils/imageUtils";

export default function Settings() {
  const { user, token, updateUser, updateTokenAndUser } =
    useAuthStore();
  const router = useRouter();

  // Profile fields
  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");

  // Profile image
  const [profileImage, setProfileImage] = useState(
    user?.profileImage || null
  );
  const [imageBase64, setImageBase64] = useState(null);

  // Password fields
  const [passwordCurrent, setPasswordCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  // Loading states
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);

  const pickImage = async () => {
    const result = await pickImageFromLibrary();
    if (result) {
      setProfileImage(result.uri);
      setImageBase64(result.base64);
    }
  };

  const handleUpdateProfile = async () => {
    setLoadingProfile(true);

    const result = await updateProfile({
      username,
      email,
      profileImage,
      imageBase64,
      currentUser: user,
      token,
    });

    setLoadingProfile(false);

    if (result.success) {
      await updateUser(result.data);
      Alert.alert("Success", "Profile updated successfully!");
      router.back();
    } else {
      Alert.alert("Error", result.error);
    }
  };

  const handleUpdatePassword = async () => {
    setLoadingPassword(true);

    const result = await updatePassword({
      passwordCurrent,
      password,
      passwordConfirm,
      token,
    });

    setLoadingPassword(false);

    if (result.success) {
      await updateTokenAndUser(result.data.token, result.data.user);

      // Clear password fields
      setPasswordCurrent("");
      setPassword("");
      setPasswordConfirm("");

      Alert.alert("Success", "Password updated successfully!");
    } else {
      Alert.alert("Error", result.error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* HEADER */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons
                name="arrow-back-outline"
                size={28}
                color={COLORS.textPrimary}
              />
            </TouchableOpacity>
            <Text style={styles.headerText}>Settings</Text>
          </View>

          {/* UPDATE PROFILE SECTION */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              📝 Profile Information
            </Text>

            {/* Profile Image */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Profile Image</Text>
              <TouchableOpacity
                style={styles.imagePicker}
                onPress={pickImage}
              >
                {profileImage ?
                  <Image
                    source={{ uri: profileImage }}
                    style={styles.selectedImage}
                  />
                : <View style={styles.placeholderContainer}>
                    <Ionicons
                      name="person-outline"
                      size={40}
                      color={COLORS.textSecondary}
                    />
                    <Text style={styles.placeholderText}>
                      Tap to select
                    </Text>
                  </View>
                }
              </TouchableOpacity>
            </View>

            {/* Username */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Username</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={COLORS.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter username"
                  placeholderTextColor={COLORS.placeholderText}
                  value={username}
                  onChangeText={setUsername}
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={COLORS.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter email"
                  placeholderTextColor={COLORS.placeholderText}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={handleUpdateProfile}
              disabled={loadingProfile}
            >
              {loadingProfile ?
                <ActivityIndicator color={COLORS.white} />
              : <>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={20}
                    color={COLORS.white}
                    style={styles.buttonIcon}
                  />
                  <Text style={styles.buttonText}>
                    Update Profile
                  </Text>
                </>
              }
            </TouchableOpacity>
          </View>

          {/* CHANGE PASSWORD SECTION */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              🔐 Change Password
            </Text>

            {/* Current Password */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Current Password</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={COLORS.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter current password"
                  placeholderTextColor={COLORS.placeholderText}
                  value={passwordCurrent}
                  onChangeText={setPasswordCurrent}
                  secureTextEntry
                />
              </View>
            </View>

            {/* New Password */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>New Password</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={COLORS.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter new password"
                  placeholderTextColor={COLORS.placeholderText}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>
            </View>

            {/* Confirm Password */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Confirm New Password</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={COLORS.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm new password"
                  placeholderTextColor={COLORS.placeholderText}
                  value={passwordConfirm}
                  onChangeText={setPasswordConfirm}
                  secureTextEntry
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={handleUpdatePassword}
              disabled={loadingPassword}
            >
              {loadingPassword ?
                <ActivityIndicator color={COLORS.white} />
              : <>
                  <Ionicons
                    name="key-outline"
                    size={20}
                    color={COLORS.white}
                    style={styles.buttonIcon}
                  />
                  <Text style={styles.buttonText}>
                    Change Password
                  </Text>
                </>
              }
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}
