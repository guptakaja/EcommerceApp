import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { RouteProp, useNavigation, NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "@/app";
import { FontAwesome } from "@expo/vector-icons";
import { RadioButton } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { userCookie } from "@/app/api-request/config";
import { removeAllCartItems } from "@/app/api-request/categoryApi";
import { placeInstamartOrder } from "@/app/api-request/instantOrderApi";
import { jwtDecode } from "jwt-decode";


type PaymentScreenRouteProp = RouteProp<RootStackParamList, "InstamartPaymentScreen">;

type PaymentScreenProps = {
  route: PaymentScreenRouteProp;
};

const InstamartPaymentScreen: React.FC<PaymentScreenProps> = ({ route }) => {
  const { totalPayment, cart_id, quantity, address_id } = route.params;
  const [user_id, setUser_id] = useState<number | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

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
        }
      } catch (error) {
        console.error("Error retrieving user ID:", error);
      }
    };

    initialize();
  }, []);

  const handlePayment = (method: "cash_on_delivery" | "online") => {
    setSelectedPayment(selectedPayment === method ? null : method);
  };

  const handleConfirmPayment = async (method: 'cash_on_delivery' | 'online') => {
    try {
      if (user_id === null) {
        Alert.alert("Error", "User ID is not available. Please log in.");
        return;
      }
  
      const orderData = {
        user_id,
        total_price: totalPayment || 0,
        Instamartorder_status: "pending",
        address_id,
        payment_method: method,
        cart_id,
        quantity
      };
  
      console.log('Order Data:', orderData);
  
      // Place the order
      const result = await placeInstamartOrder(orderData);
  
      console.log('API Result:', result);
  
      if (result.success) {
        const order_id = result.data.Instamartorder_id;
        console.log('Order ID:', order_id);
  
        Alert.alert("Order Successful", "Your order has been placed successfully.");
  
        navigation.navigate("InstamartLiveTrack", {
          total: totalPayment,
          address_id,
          paymentMethod: method,
          order_id,
        });
  
        // Remove all cart items
        // const deleteResult = await removeAllCartItems(user_id);
  
        // console.log('Delete Result:', deleteResult);
  
        // if (deleteResult.success) {
        //   Alert.alert("Cart Cleared", "All items have been removed from your cart.");
        // } else {
        //   if (deleteResult.error === "No items found to delete") {
        //     Alert.alert("No Cart Items", "There were no items to delete.");
        //   } else {
        //     Alert.alert("Error", deleteResult.error);
        //   }
        // }
      } else {
        Alert.alert("Order Failed", result.error || "An unexpected error occurred.");
      }
    } catch (error) {
      console.error("Error while placing order:", error);
      Alert.alert("Order Failed", "An unexpected error occurred. Please try again.");
    }
  };
  

  return (
    <View style={styles.container}>
      <Text style={styles.totalPaymentText}>
        Total Payment: ₹{totalPayment !== undefined && typeof totalPayment === "number" ? totalPayment.toFixed(2) : "0.00"}
      </Text>

      <TouchableOpacity style={styles.paymentOption} onPress={() => handlePayment("online")}>
        <FontAwesome name="credit-card" size={30} color="#3b5998" />
        <Text style={styles.paymentText}>PhonePe</Text>
        <RadioButton
          value="PhonePe"
          status={selectedPayment === "online" ? "checked" : "unchecked"}
          onPress={() => handlePayment("online")}
        />
      </TouchableOpacity>
      {selectedPayment === "online" && (
        <View style={styles.dropdown}>
          <TouchableOpacity
            style={styles.dropdownItem}
            onPress={() => handleConfirmPayment("online")}
          >
            <Text style={styles.dropdownText}>
              Pay via PhonePe ₹{totalPayment ? totalPayment.toFixed(2) : "0.00"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={styles.paymentOption} onPress={() => handlePayment("online")}>
        <FontAwesome name="google-wallet" size={30} color="#4285F4" />
        <Text style={styles.paymentText}>Google Pay</Text>
        <RadioButton
          value="Google Pay"
          status={selectedPayment === "online" ? "checked" : "unchecked"}
          onPress={() => handlePayment("online")}
        />
      </TouchableOpacity>
      {selectedPayment === "online" && (
        <View style={styles.dropdown}>
          <TouchableOpacity
            style={styles.dropdownItem}
            onPress={() => handleConfirmPayment("online")}
          >
            <Text style={styles.dropdownText}>
              Pay via Google Pay ₹{totalPayment ? totalPayment.toFixed(2) : "0.00"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={styles.paymentOption} onPress={() => handlePayment("cash_on_delivery")}>
        <FontAwesome name="money" size={30} color="#28a745" />
        <Text style={styles.paymentText}>Cash on Delivery</Text>
        <RadioButton
          value="cash_on_delivery"
          status={selectedPayment === "cash_on_delivery" ? "checked" : "unchecked"}
          onPress={() => handlePayment("cash_on_delivery")}
        />
      </TouchableOpacity>
      {selectedPayment === "cash_on_delivery" && (
        <View style={styles.dropdown}>
          <TouchableOpacity
            style={styles.dropdownItem}
            onPress={() => handleConfirmPayment("cash_on_delivery")}
          >
            <Text style={styles.dropdownText}>
              Pay via Cash on Delivery ₹{totalPayment ? totalPayment.toFixed(2) : "0.00"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    paddingVertical: 20,
  },
  totalPaymentText: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    width: "80%",
    justifyContent: "space-between",
  },
  paymentText: {
    fontSize: 18,
    marginLeft: 10,
  },
  dropdown: {
    backgroundColor: "#82e0aa",
    width: "80%",
    borderRadius: 10,
    marginBottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderColor: "#ddd",
    borderWidth: 1,
    alignItems: "center",
  },
  dropdownItem: {
    paddingVertical: 10,
  },
  dropdownText: {
    fontSize: 16,
    color: "white",
  },
});

export default InstamartPaymentScreen;
