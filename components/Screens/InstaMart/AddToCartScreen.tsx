import React, { useEffect, useState } from 'react';
import { View, Text, Image, FlatList, TouchableOpacity, StyleSheet, Modal, Pressable, RefreshControl, Alert, } from 'react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from 'axios';
import { useNavigation } from '@react-navigation/native'; // Import navigation hook
import { getCartItems, updateCartItem, removeCartItem, removeAllCartItems } from "@/app/api-request/categoryApi";
import { userCookie } from '@/app/api-request/config';
import { jwtDecode } from 'jwt-decode';
import { MaterialIcons } from '@expo/vector-icons';
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import { fetchAddressesByUserid } from '@/app/api-request/Adress_api';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/app';

// Define the type for the cart item
interface CartItem {
    cart_id: number;
    product_id: string;
    product?: { // product is optional
        name?: string;
        discount_price?: number;
        price?: number;
    };
    image_url: string;
    quantity: number;
    total_price: number;
}
interface Address {
    address_id: number;
    house_number: string;
    apartment?: string;
    landmark?: string;
    type: "Home" | "Work" | "Other";
    user_id: number;
    city?: string;
    state?: string;
    zipcode?: string;
    country?: string;
    alternative_phone_number?: string;
    createdAt?: Date;
    updatedAt?: Date;
  }

// Define the component
const AddToCartScreen = () => {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [totalPayment, setTotalPayment] = useState<number>(0.0);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [user_id, setUser_id] = useState<number | null>(null);
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    const [addresses, setAddresses] = useState<Address[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalAddresses, setModalAddresses] = useState<Address[]>([]);
    const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
    const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);

    useEffect(() => {
        const fetchCartItems = async () => {
            try {
                const token = await AsyncStorage.getItem(userCookie);
                if (!token) {
                    throw new Error("Token not found in AsyncStorage");
                }
    
                const decodedToken: any = jwtDecode(token);
                const user_id = decodedToken.id;
                const phone = decodedToken.phone;
    
                if (!user_id) {
                    throw new Error("Failed to decode user_id");
                }
    
                setUser_id(user_id);
                console.log("User ID:", user_id); // Log user_id here
    
                const data = await getCartItems(user_id);
    
                if (data.error) {
                    setError(data.error);
                } else {
                    setCartItems(data.items);
                    setTotalPayment(parseFloat(data.total_payment));
                }
            } catch (error) {
                console.error("Error fetching cart items:", error);
                setError("Error fetching cart items");
            } finally {
                setLoading(false);
            }
        };
    
        fetchCartItems();
    }, []);

    if (loading) {
        return <Text>Loading...</Text>;
    }

    if (error) {
        return <Text>{error}</Text>;
    }

    const renderItem = ({ item }: { item: CartItem }) => (
        <View style={styles.cartItem}>
            <Image source={{ uri: item.image_url }} style={styles.productImage} />
            <View style={styles.productDetails}>
                <Text style={styles.productName}>{item.product?.name ?? 'Product Name Missing'}</Text>
                <View style={styles.priceRow}>
                    <Text style={styles.discountedPrice}>₹{item.product?.discount_price ?? 'N/A'}</Text>
                    <Text style={styles.actualPrice}>₹{item.product?.price ?? 'N/A'}</Text>
                </View>
                <View style={styles.quantityRow}>
                    <TouchableOpacity onPress={() => handleQuantityChange(item.cart_id, item.quantity, 'decrease')}>
                        <Text style={styles.quantityButton}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>{item.quantity}</Text>
                    <TouchableOpacity onPress={() => handleQuantityChange(item.cart_id, item.quantity, 'increase')}>
                        <Text style={styles.quantityButton}>+</Text>
                    </TouchableOpacity>
                </View>
            </View>
            <Text style={styles.productPrice}>₹{item.total_price}</Text>
        </View>
    );

    const handleQuantityChange = async (cart_Id: number, currentQuantity: number, action: 'increase' | 'decrease') => {
        try {
            const newQuantity = action === 'increase' ? currentQuantity + 1 : Math.max(0, currentQuantity - 1);

            console.log('Request data:', { cart_Id, newQuantity });

            const item = cartItems.find(cartItem => cartItem.cart_id === cart_Id);
            if (!item) {
                console.warn(`Item with cart_id ${cart_Id} not found.`);
                return;
            }

            if (newQuantity <= 0) {
                await removeCartItem(cart_Id);
                const updatedCartItems = cartItems.filter(cartItem => cartItem.cart_id !== cart_Id);
                setCartItems(updatedCartItems);
                const updatedTotalPayment = updatedCartItems.reduce((sum, cartItem) => sum + cartItem.total_price, 0);
                setTotalPayment(updatedTotalPayment);
                return;
            }

            const response = await updateCartItem(cart_Id, { quantity: newQuantity });

            console.log('API Response:', response);
            const updatedItem = response.data;

            if (!updatedItem || !updatedItem.cart_id || updatedItem.total_price === undefined) {
                console.error('Invalid updated item data:', updatedItem);
                setError('Invalid data returned from the API.');
                return;
            }

            const updatedCartItems = cartItems.map(cartItem =>
                cartItem.cart_id === cart_Id
                    ? {
                        ...cartItem,
                        quantity: updatedItem.quantity,
                        total_price: updatedItem.total_price
                    }
                    : cartItem
            );

            setCartItems(updatedCartItems);
            const updatedTotalPayment = updatedCartItems.reduce((sum, cartItem) => sum + cartItem.total_price, 0);
            setTotalPayment(updatedTotalPayment);
        } catch (error: any) {
            console.error('Error updating cart item:', error.message);
            setError('Error updating cart item');
        }
    };

    const handleClearCart = async () => {
        try {
            const token = await AsyncStorage.getItem(userCookie);
            if (!token) {
                throw new Error("Token not found in AsyncStorage");
            }

            const decodedToken: any = jwtDecode(token);
            const user_id = decodedToken.id;

            if (!user_id) {
                throw new Error("Failed to decode user_id");
            }

            await removeAllCartItems(user_id);

            setCartItems([]);
            setTotalPayment(0);
        } catch (error) {
            console.error("Error clearing cart:", error);
            setError("Error clearing cart");
        }
    };

    const fetchAllAddresses = async (user_id: number) => {
        try {
            const result = await fetchAddressesByUserid(user_id);
            console.log("API Response alllll:", result);

            if (result.error) {
                console.error("Error fetching addresses:", result.error);
            } else {
                setModalAddresses(result); // Ensure result.addresses is an array
                const address_id = result.map((address: { address_id: any; }) => address.address_id);
                console.log("Address IDs:", address_id);
                console.log("Modal Addresses State:", result);
            }
        } catch (error: any) {
            console.error("Error fetching addresses:", error.message);
        }
    };

    const openModal = () => {
        if (user_id !== null) {
            fetchAllAddresses(user_id); // Fetch addresses for the modal
            setModalVisible(true);
        } else {
            console.error("User ID is not available");
            // Optionally handle the case where user_id is null (e.g., show an error message)
        }
    };

    const selectAddress = (item: Address) => {
        setSelectedAddress(item);
        setModalVisible(false);
        setSelectedAddressId(item.address_id);
        console.log("Selected Address ID:", item.address_id);
    };
    const handleProceedToPay = () => {
        if (selectedAddressId !== null && typeof totalPayment === 'number' && !isNaN(totalPayment)) {
            const cartItemQuantity = cartItems.length > 0 ? cartItems[0].quantity : 0;
    
            console.log('Navigating with totalPayment:', totalPayment);
    
            navigation.navigate('InstamartPaymentScreen', {
                totalPayment,
                cart_id: cartItems.length > 0 ? cartItems[0].cart_id : 0,
                address_id: selectedAddressId,
                quantity: cartItemQuantity,
            });
            console.log('Navigating with totalPayment:', totalPayment);
        } else {
            if (selectedAddressId === null) {
                // Show an alert if no address is selected
                Alert.alert(
                    "Address Required",
                    "Please select an address before proceeding.",
                    [{ text: "OK" }]
                );
            } else {
                // Handle other cases, if necessary
                console.error("Total payment is not a valid number");
            }
        }
    };
    
    

    return (
        <View style={styles.container}>
        {cartItems.length === 0 ? (
            <View style={styles.emptyCart}>
    <Text style={styles.emptyText}>Your cart is empty</Text>
    <TouchableOpacity
        style={styles.startShoppingButton}
        onPress={() => navigation.navigate('LandingScreen')}
    >
        <Text style={styles.startShoppingText}>Start Shopping</Text>
    </TouchableOpacity>
</View>

        ) : (
            <>
                <View style={styles.header}>
                    <Text style={styles.reviewTitle}>Review Items</Text>
                    <TouchableOpacity style={styles.clearItems} onPress={handleClearCart}>
                        <Text style={styles.clearItemsText}>Clear cart</Text>
                        <MaterialIcons name="delete-outline" size={24} color="black" />
                    </TouchableOpacity>
                </View>
                <View style={styles.addressContainer}>
                    <TouchableOpacity onPress={openModal} style={styles.headerContainer}>
                        <Text style={styles.selectedAddressText}>
                            {selectedAddress ? (
                                <>
                                    {selectedAddress.type === "Home" && (
                                        <Ionicons name="home" size={20} color="blue" />
                                    )}
                                    {selectedAddress.type === "Work" && (
                                        <FontAwesome name="briefcase" size={20} color="green" />
                                    )}
                                    {selectedAddress.type === "Other" && (
                                        <Ionicons name="location" size={20} color="gray" />
                                    )}
                                    , {selectedAddress.apartment}, {selectedAddress.house_number},{" "}
                                    {selectedAddress.city}, {selectedAddress.zipcode}
                                </>
                            ) : (
                                <Text style={styles.noAddressText}>No address selected</Text>
                            )}
                        </Text>
                        <Ionicons
                            name="chevron-down"
                            size={20}
                            color="black"
                            onPress={openModal}
                        />
                    </TouchableOpacity>
                    <Modal
                        transparent={true}
                        visible={modalVisible}
                        animationType="slide"
                        onRequestClose={() => setModalVisible(false)}
                    >
                        <Pressable
                            style={styles.modalContainer}
                            onPress={() => setModalVisible(false)}
                        >
                            <View style={styles.modalContent}>
                                <FlatList
                                    data={modalAddresses}
                                    keyExtractor={(item) => item.address_id.toString()}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity onPress={() => selectAddress(item)}>
                                            <View style={styles.modalItem}>
                                                <Text>
                                                    {item.type === "Home" && (
                                                        <Ionicons name="home" size={20} color="blue" />
                                                    )}
                                                    {item.type === "Work" && (
                                                        <FontAwesome name="briefcase" size={20} color="green" />
                                                    )}
                                                    {item.type === "Other" && (
                                                        <Ionicons name="location" size={20} color="gray" />
                                                    )}
                                                    , {item.apartment}, {item.house_number}, {item.city},{" "}
                                                    {item.zipcode}
                                                </Text>
                                            </View>
                                        </TouchableOpacity>
                                    )}
                                />
                                <TouchableOpacity
                                    style={styles.addAddressButton}
                                
                                >
                                    <Text style={styles.addAddressButtonText}>Add New Address</Text>
                                </TouchableOpacity>
                            </View>
                        </Pressable>
                    </Modal>
                </View>
                <FlatList
                    data={cartItems}
                    renderItem={renderItem}
                    keyExtractor={item => item.cart_id.toString()}
                    ListFooterComponent={
                        <View style={styles.footer}>
                            <Text style={styles.totalText}>To Pay: ₹{totalPayment}</Text>
                            <TouchableOpacity
                                style={styles.proceedButtonn}
                                onPress={handleProceedToPay}
                            >
                                <Text style={styles.proceedButtonTextt}>Proceed to Pay</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            </>
        )}
    </View>
);
};
const styles = {
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    emptyCart: {
        flex: 1,
        justifyContent: 'center' as const,
        alignItems: 'center' as const,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold' as const,
        marginBottom: 20,
    },
    startShoppingButton: {
        padding: 10,
        backgroundColor: '#007bff',
        borderRadius: 5,
    },
    startShoppingText: {
        color: '#fff',
        fontSize: 16,
    },
    header: {
        flexDirection: 'row' as 'row',
        justifyContent: 'space-between' as const,
        alignItems: 'center' as const,
        padding: 10,
        backgroundColor: '#fff',
        marginBottom: 10,
    },
    reviewTitle: {
        fontSize: 18,
        fontWeight: 'bold' as const,
    },
    clearItems: {
        flexDirection: 'row' as 'row',
        alignItems: 'center' as const,
    },
    clearItemsText: {
        fontSize: 16,
        color: 'red',
        marginRight: 5,
    },
    cartItem: {
        flexDirection: 'row' as 'row', // Correctly typed
        padding: 10,
        backgroundColor: '#fff',
        marginBottom: 10,
    },
    productImage: {
        width: 60,
        height: 60,
        borderRadius: 8,
        marginRight: 10,
    },
    productDetails: {
        flex: 1,
        justifyContent: 'center' as const, // Fixed: ensure correct typing
    },
    productName: {
        fontSize: 16,
        fontWeight: 'bold' as const, // Fixed: ensure correct typing
    },
    priceRow: {
        flexDirection: 'row' as const, // Fixed: ensure correct typing
        alignItems: 'center' as const, // Fixed: ensure correct typing
    },
    discountedPrice: {
        fontSize: 14,
        fontWeight: 'bold' as const, // Fixed: ensure correct typing
        color: 'green',
    },
    actualPrice: {
        fontSize: 14,
        textDecorationLine: 'line-through' as const, // Fixed: ensure correct typing
        marginLeft: 5,
    },
    quantityRow: {
        flexDirection: 'row' as const, // Fixed: ensure correct typing
        alignItems: 'center' as const, // Fixed: ensure correct typing
        marginTop: 5,
    },
    quantityButton: {
        fontSize: 20,
        fontWeight: 'bold' as const, // Fixed: ensure correct typing
        paddingHorizontal: 10,
    },
    quantityText: {
        fontSize: 16,
        fontWeight: 'bold' as const, // Fixed: ensure correct typing
        paddingHorizontal: 10,
    },
    productPrice: {
        fontSize: 16,
        fontWeight: 'bold' as const, // Fixed: ensure correct typing
        alignSelf: 'center' as const, // Fixed: ensure correct typing
    },
    footer: {
        padding: 15,
        backgroundColor: '#f5f5f5',
    },
    totalText: {
        fontSize: 18,
        fontWeight: 'bold' as const, // Fixed: ensure correct typing
        marginBottom: 10,
    },
    proceedButton: {
        backgroundColor: 'orange',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center' as const, // Fixed: ensure correct typing
    },
    proceedButtonText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: 'bold' as const, // Fixed: ensure correct typing
    },
    addressContainer: {
        paddingLeft: 15,
        // backgroundColor: "#ffa302",
        marginTop: 2,
        borderRadius: 8,
        paddingRight: 15,
    
      },
      addressItem: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#ddd",
        justifyContent: "space-between",
      },
      addAddressButton: {
        padding: 10,
        backgroundColor: "#fa8f0e",
        borderRadius: 8,
        marginTop: 10,
        alignItems: "center" as const, // Fixed: ensure correct typing
      },
      addAddressButtonText: {
        color: "#fff",
        fontSize: 16,
      },
      modelddAddressButtonText: {
        color: "red",
        fontSize: 16,
      },
      proceedButtonn: {
        backgroundColor: "#fa8f0e",
        padding: 16,
        borderRadius: 8,
        margin: 16,
        alignItems: "center" as const,
      },
      proceedButtonTextt: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "bold" as const,
      },
      modalContainer: {
        flex: 1,
        justifyContent: "flex-end" as const,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
      },
      modalContent: {
        backgroundColor: "white",
        padding: 20,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
      },
      modalItem: {
        paddingVertical: 10,
      },
      closeModalButton: {
        marginTop: 20,
        padding: 10,
        backgroundColor: "red",
        alignItems: "center" as const,
      },
      closeModalButtonText: {
        color: "white",
        fontSize: 16,
      },
      addressDetails: {
        flexDirection: "row" as "row",
        alignItems: "center",
        padding: 10,
        backgroundColor: "#f9f9f9",
        borderRadius: 8,
        marginVertical: 5,
      },
      addressText: {
        marginLeft: 10,
        fontSize: 16,
        color: "#333",
      },
      iconStyle: {
        marginRight: 10,
      },
      apartmentText: {
        marginLeft: 30,
        fontSize: 14,
        color: "gray",
      },
      selectedAddressText: {
        fontSize: 16,
        color: "#333",
        marginTop: 8,
        marginBottom: 8,
        padding: 10,
        borderRadius: 5,
        backgroundColor: "#e6f7ff",
      },
    
      noAddressText: {
        fontSize: 16,
        marginTop: 8,
        marginBottom: 8,
        padding: 10,
        borderRadius: 5,
      },
      headerContainer: {
        flexDirection: "row" as "row",
        justifyContent: "space-between" as const,
        alignItems: "center" as const,
      },
      clearheaedrContainer: {
        flexDirection: "row" as "row",
        justifyContent: "flex-end" as const,
        alignItems: "flex-end" as const,
        width: "100%",
        paddingRight: 10,
      },
      addressHeader: {
        fontSize: 18,
        fontWeight: "bold" as const,
      },
      dropdownContainer: {
        overflow: "hidden",
        marginTop: 8,
      },
    
      selectAddressButtonText: {
        fontSize: 16,
        color: "#007BFF",
      },
};



export default AddToCartScreen;
