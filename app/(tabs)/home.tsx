import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
  Animated,
  RefreshControl,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { userCookie } from "@/app/api-request/config";
import config from "@/app/api-request/config";
import axios from "axios";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { jwtDecode } from "jwt-decode";
import { getUserById } from "../api-request/profile_api";

export type RootStackParamList = {
  LandingScreen: undefined;
  // Add other screens here if needed
};

// Define the navigation prop type
type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "LandingScreen">;

const Home = () => {
  const route = useRoute();
  const navigation = useNavigation<HomeScreenNavigationProp>(); // Add the correct type here

  const [user_id, setUserId] = useState<string>("");
  const [address, setAddress] = useState<string>("Fetching location...");
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false); // For refresh control
  const [userPhone, setUserPhone] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{
    name: string;
    latitude: number;
    longitude: number;
  } | null>(null); // Add currentLocation to state
  const scrollAnim = useRef(new Animated.Value(0)).current;

  interface ExtendedLocationGeocodedAddress extends Location.LocationGeocodedAddress {
    subLocality?: string;
    neighbourhood?: string;
    locality?: string;
  }

  const fetchCurrentLocation = async () => {
    setLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setAddress("Permission to access location was denied");
        setLoading(false);
        return;
      }

      let { coords } = await Location.getCurrentPositionAsync({});
      let places = (await Location.reverseGeocodeAsync({
        latitude: coords.latitude,
        longitude: coords.longitude,
      })) as ExtendedLocationGeocodedAddress[];

      if (places && places.length > 0) {
        const place = places[0];

        const street = place.street || place.name || "";
        const area = (place as any).subLocality || "";
        const city = place.city || place.locality || "";
        const state = place.region || "";
        const formattedAddress = `${street}, ${area}, ${city}, ${state}`;

        const newLocation = {
          name: formattedAddress, // Concatenated address parts
          latitude: coords.latitude,
          longitude: coords.longitude,
        };

        setAddress(newLocation.name); // Display the formatted address
        setCurrentLocation(newLocation); // Set currentLocation state
        console.log(`Name: ${newLocation.name}, Latitude: ${newLocation.latitude}, Longitude: ${newLocation.longitude}`);
      } else {
        setAddress("Location not found");
      }
    } catch (error) {
      console.error("Error fetching location:", error);
      setAddress("Failed to fetch location");
    } finally {
      setLoading(false);
    }
  };

  const initialize = async () => {
    try {
      const token = await AsyncStorage.getItem(userCookie);
      if (!token) {
        throw new Error("Token not found in AsyncStorage");
      }

      const decodedToken: any = jwtDecode(token);
      const user_id = decodedToken.id;

      if (user_id) {
        const userDetails = await getUserById(user_id); // Fetch user details
        setUserName(userDetails.username); // Set username
        setUserPhone(userDetails.phone); // Set phone
        setUserId(user_id); // Store user_id in state

        console.log(`Username: ${userDetails.username}`);
      }
    } catch (error) {
      console.error("Error initializing user:", error);
      Alert.alert("Error", "Failed to load user data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initialize();
    fetchCurrentLocation();
  }, []);

  const handleNavigation = () => {
    // Ensure navigation only happens if address and userPhone are available
    
      navigation.navigate("LandingScreen" as never);
   
  };
  const onRefresh = async () => {
    setRefreshing(true);
    await initialize();
    await fetchCurrentLocation();
    setRefreshing(false);
  };
  useEffect(() => {
    const startMarquee = () => {
      scrollAnim.setValue(0);
      Animated.loop(
        Animated.timing(scrollAnim, {
          toValue: -100, // Adjust this value based on your text width
          duration: 8000, // Adjust duration for speed
          useNativeDriver: true,
        })
      ).start();
    };

    if (!loading) {
      startMarquee();
    }
  }, [loading]);

  const categories = ['All', 'Fresh', 'Grocery', 'Electronics', 'Beauty', 'Horr'];
  const products = [
    { id: 1, name: 'Earphones & headsets', image: require('../../assets/images/ear.png') },
    { id: 2, name: 'Smartwatches', image: require('../../assets/images/watch.webp') },
    { id: 3, name: 'Trendy deals', image: require('../../assets/images/deals.webp') },
  ];

  const scrollX = useRef(new Animated.Value(0)).current;
  
 

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Location Container */}
      <View style={styles.locationContainer}>
        <Ionicons name="location-outline" size={24} color="green" />
        {loading ? (
          <ActivityIndicator size="small" color="green" />
        ) : (
          <View style={styles.marqueeContainer}>
            <Text style={styles.deliveryText}>Delivery to Home</Text>
            <Animated.Text
              style={[
                styles.addressText,
                { transform: [{ translateX: scrollAnim }] },
              ]}
              numberOfLines={1}
            >
              {address || "Location not found"}
            </Animated.Text>
          </View>
        )}
      </View>

      {/* Search Bar */}
      <TouchableOpacity style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" />
        <Text style={styles.searchText}>Search for 'Dark Chocolates'</Text>
      </TouchableOpacity>

      {/* Categories */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoryContainer}
      >
        {categories.map((category) => (
          <TouchableOpacity key={category} style={styles.categoryButton}>
            <Text style={styles.categoryText}>{category}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Promotional Banner */}
      <Image 
        source={require('../../assets/images/deals.webp')} 
        style={styles.promotionalBanner}
        resizeMode="contain"
      />

      {/* Scrolling Product Cards */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Deals of the Day</Text>
        <Text style={styles.seeAll}>See all</Text>
      </View>
      
      <Animated.FlatList
        horizontal
        data={products}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.productCard} onPress={handleNavigation}>
            <Image source={item.image} style={styles.productImage} />
            <Text style={styles.productName}>{item.name}</Text>
            <Text style={styles.productPrice}>UP TO 80% OFF</Text>
          </TouchableOpacity>
        )}
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
      />

      {/* Add more sections similarly */}
    </ScrollView>
  );
};

const { width, height } = Dimensions.get("window");
const isSmallDevice = width < 375;

const styles = StyleSheet.create({
  // ... existing styles remain same ...
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
    paddingHorizontal: isSmallDevice ? width * 0.03 : width * 0.04, // Responsive padding
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: isSmallDevice ? width * 0.03 : width * 0.04, // Responsive padding
    borderRadius: 10,
    marginTop: height * 0.02, // Responsive margin
    justifyContent: "space-between",
    overflow: "hidden",
  },
  addressText: {
    fontSize: isSmallDevice ? width * 0.035 : width * 0.04, // Responsive font size
    fontWeight: "400",
    color: "#333",
  },
  marqueeContainer: {
    width: "90%",
    overflow: "hidden",
  },
  deliveryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginVertical: 10,
    elevation: 2,
  },
  searchText: {
    marginLeft: 10,
    color: '#666',
    fontSize: 14,
  },
  categoryContainer: {
    marginVertical: 10,
  },
  categoryButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#f2f2f2',
    borderRadius: 20,
    marginRight: 10,
  },
  categoryText: {
    color: '#333',
    fontSize: 14,
  },
  promotionalBanner: {
    width: '100%',
    height: 150,
    marginVertical: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  seeAll: {
    color: 'green',
    fontSize: 14,
  },
  productCard: {
    width: 150,
    marginRight: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    elevation: 2,
  },
  productImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  productPrice: {
    color: 'green',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default Home;