import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "@/app";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import { userCookie } from "@/app/api-request/config";
import { patchInstamartOrder } from "@/app/api-request/instantOrderApi";

type InstamartLiveTrackRouteProp = RouteProp<
  RootStackParamList,
  "InstamartLiveTrack"
>;

type InstamartLiveTrackProps = {
  route: InstamartLiveTrackRouteProp;
  navigation: any;
};

const InstamartLiveTrack: React.FC<InstamartLiveTrackProps> = ({ route }) => {
  const { total, address_id, paymentMethod, order_id } = route.params;
  const [user_id, setUser_id] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [timer, setTimer] = useState<number>(0.2 * 60); // 20 minutes in seconds
  const [isComplete, setIsComplete] = useState<boolean>(false);
  console.log('Order ID:', order_id);
  useEffect(() => {
    const initialize = async () => {
      try {
        const token = await AsyncStorage.getItem(userCookie);
        if (!token) {
          throw new Error("Token not found in AsyncStorage");
        }

        const decodedToken: any = jwtDecode(token);
        const user_id = decodedToken.id;

        if (user_id) {
          setUser_id(user_id);
        } else {
          setError("Failed to decode UserID.");
        }
      } catch (error: any) {
        console.error("Error initializing:", error.message);
        setError("An error occurred during initialization.");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    };

    initialize();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prevTimer) => {
        if (prevTimer <= 1) {
          clearInterval(interval);
          setIsComplete(true);
          if (user_id !== null) {
            console.log(`Updating order status with UserID: ${user_id}`);
            updateOrderStatus(); // Call to update order status
          } else {
            console.error("User ID is not set");
          }
          return 0;
        }
        return prevTimer - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [user_id]); // Add user_id as a dependency

  const updateOrderStatus = async () => {
    if (user_id === null) {
      console.error("User ID is not set");
      setError("User ID is not set.");
      return;
    }
  
    try {
      console.log(`Updating order status for order_id: ${order_id}, user_id: ${user_id}`);
      const result = await patchInstamartOrder(order_id, {
        user_id,
        Instamartorder_status: "completed",
      });
  
      console.log("Update result:", result);
  
      if (result.success) {
        console.log("Order status updated to complete.");
      } else {
        console.error("Failed to update order status:", result.error);
        setError(result.error);
        Alert.alert("Update Failed", result.error);
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      setError("An unexpected error occurred.");
      Alert.alert("Update Failed", "An unexpected error occurred.");
    }
  };
  
  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>Invoice</Text>
      <View style={styles.orderIdContainer}>
        <Text style={styles.orderIdText}>Order ID: {order_id}</Text>
      </View>
      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Total:</Text>
          <Text style={styles.detailValue}>₹{total.toFixed(2)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Payment Method:</Text>
          <Text style={styles.detailValue}>{paymentMethod}</Text>
        </View>
        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>
            Time Left: {Math.floor(timer / 60)}:
            {(timer % 60).toString().padStart(2, "0")}
          </Text>
          {isComplete && (
            <Text style={styles.completedText}>
              Order Successfully Delivered
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  orderIdContainer: {
    marginVertical: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  orderIdText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  detailsContainer: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginTop: "auto",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  detailValue: {
    fontSize: 16,
    color: "#555",
  },
  timerContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  timerText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  completedText: {
    marginTop: 10,
    fontSize: 18,
    color: "green",
    fontWeight: "bold",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8d7da",
  },
  errorText: {
    fontSize: 18,
    color: "#721c24",
    fontWeight: "bold",
    textAlign: "center",
    paddingHorizontal: 20,
  },
});

export default InstamartLiveTrack;
