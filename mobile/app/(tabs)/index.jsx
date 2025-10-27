import {
  View,
  Text,
  TextInput,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { useAuthStore } from "../../store/authStore";

import { Image } from "expo-image";
import { useEffect, useState, useCallback } from "react";

import styles from "../../assets/styles/home.styles";
import { Ionicons } from "@expo/vector-icons";
import { formatPublishDate } from "../../lib/utils";
import COLORS from "../../constants/colors";
import Loader from "../../components/Loader";
import {
  fetchBooks,
  processUniqueBooks,
} from "../services/bookService";

export const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export default function Home() {
  const { token } = useAuthStore();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("newest");

  const loadBooks = useCallback(
    async (
      pageNum = 1,
      refresh = false,
      searchTerm = "",
      sort = "newest"
    ) => {
      if (refresh) setRefreshing(true);
      else if (pageNum === 1) setLoading(true);

      // Convert sort option to backend sort format
      const sortMap = {
        newest: "-createdAt",
        oldest: "createdAt",
        "rating-desc": "-rating",
        "rating-asc": "rating",
      };
      const backendSort = sortMap[sort] || "-createdAt";

      const result = await fetchBooks(token, pageNum, 2, {
        search: searchTerm,
        sort: backendSort,
      });

      if (result.success) {
        setBooks((prevBooks) => {
          const uniqueBooks = processUniqueBooks(
            prevBooks,
            result.data.books,
            refresh || pageNum === 1
          );
          return uniqueBooks;
        });
        setHasMore(pageNum < result.data.totalPages);
        setPage(pageNum);
      } else {
        console.log("Error fetching books", result.error);
      }

      if (refresh) {
        await sleep(800);
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    },
    [token]
  );

  // Load books on mount
  useEffect(() => {
    loadBooks(1, false, searchQuery, sortOption);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLoadMore = async () => {
    if (hasMore && !loading && !refreshing) {
      await loadBooks(page + 1, false, searchQuery, sortOption);
    }
  };

  const handleSearchChange = (text) => {
    setSearchQuery(text);
  };

  const handleSort = (sort) => {
    setSortOption(sort);
  };

  const handleSearch = () => {
    setPage(1);
    loadBooks(1, false, searchQuery, sortOption);
  };

  // Trigger refetch when sort option changes
  useEffect(() => {
    if (!loading) {
      setPage(1);
      loadBooks(1, false, searchQuery, sortOption);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortOption]);

  // Trigger refetch when search changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!loading) {
        setPage(1);
        loadBooks(1, false, searchQuery, sortOption);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const renderItem = ({ item }) => (
    <View style={styles.bookCard}>
      <View style={styles.bookHeader}>
        <View style={styles.userInfo}>
          <Image
            source={{ uri: item.user.profileImage }}
            style={styles.avatar}
          />
          <Text style={styles.username}>{item.user.username}</Text>
        </View>
      </View>

      <View style={styles.bookImageContainer}>
        <Image
          source={{ uri: item.image }}
          style={styles.bookImage}
          contentFit="cover"
        />
      </View>

      <View style={styles.bookDetails}>
        <Text style={styles.bookTitle}>{item.title}</Text>
        <View style={styles.ratingContainer}>
          {renderRatingStars(item.rating)}
        </View>
        <Text style={styles.caption}>{item.caption}</Text>
        <Text style={styles.date}>
          Shared on {formatPublishDate(item.createdAt)}
        </Text>
      </View>
    </View>
  );

  const renderRatingStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? "star" : "star-outline"}
          size={16}
          color={i <= rating ? "#f4b400" : COLORS.textSecondary}
          style={{ marginRight: 2 }}
        />
      );
    }
    return stars;
  };

  if (loading) return <Loader />;

  return (
    <View style={styles.container}>
      <FlatList
        data={books}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() =>
              loadBooks(1, true, searchQuery, sortOption)
            }
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>BookWorm 🐛</Text>
              <Text style={styles.headerSubtitle}>
                Discover great reads from the community👇
              </Text>
            </View>

            {/* Search Bar */}
            <View style={styles.searchBar}>
              <Ionicons
                name="search-outline"
                size={20}
                color={COLORS.textSecondary}
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by title..."
                placeholderTextColor={COLORS.placeholderText}
                value={searchQuery}
                onChangeText={handleSearchChange}
                onSubmitEditing={handleSearch}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setSearchQuery("");
                  }}
                >
                  <Ionicons
                    name="close-circle"
                    size={20}
                    color={COLORS.textSecondary}
                  />
                </TouchableOpacity>
              )}
            </View>

            {/* Sort Options */}
            <View style={styles.sortContainer}>
              <TouchableOpacity
                style={[
                  styles.sortButton,
                  sortOption === "newest" && styles.sortButtonActive,
                ]}
                onPress={() => handleSort("newest")}
              >
                <Ionicons
                  name="time-outline"
                  size={16}
                  color={
                    sortOption === "newest" ?
                      COLORS.white
                    : COLORS.textPrimary
                  }
                />
                <Text
                  style={[
                    styles.sortButtonText,
                    sortOption === "newest" &&
                      styles.sortButtonTextActive,
                  ]}
                >
                  Newest
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.sortButton,
                  sortOption === "oldest" && styles.sortButtonActive,
                ]}
                onPress={() => handleSort("oldest")}
              >
                <Ionicons
                  name="hourglass-outline"
                  size={16}
                  color={
                    sortOption === "oldest" ?
                      COLORS.white
                    : COLORS.textPrimary
                  }
                />
                <Text
                  style={[
                    styles.sortButtonText,
                    sortOption === "oldest" &&
                      styles.sortButtonTextActive,
                  ]}
                >
                  Oldest
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.sortButton,
                  sortOption === "rating-desc" &&
                    styles.sortButtonActive,
                ]}
                onPress={() => handleSort("rating-desc")}
              >
                <Ionicons
                  name="star-outline"
                  size={16}
                  color={
                    sortOption === "rating-desc" ?
                      COLORS.white
                    : COLORS.textPrimary
                  }
                />
                <Text
                  style={[
                    styles.sortButtonText,
                    sortOption === "rating-desc" &&
                      styles.sortButtonTextActive,
                  ]}
                >
                  Rating
                </Text>
              </TouchableOpacity>
            </View>
          </>
        }
        ListFooterComponent={
          hasMore && books.length > 0 ?
            <ActivityIndicator
              style={styles.footerLoader}
              size="small"
              color={COLORS.primary}
            />
          : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name="book-outline"
              size={60}
              color={COLORS.textSecondary}
            />
            <Text style={styles.emptyText}>
              No recommendations yet
            </Text>
            <Text style={styles.emptySubtext}>
              Be the first to share a book!
            </Text>
          </View>
        }
      />
    </View>
  );
}
