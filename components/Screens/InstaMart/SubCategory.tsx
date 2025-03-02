import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Dimensions,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { getProductsBySubCategory, getProducts,postCartItems,updateCartItem ,removeCartItem } from "@/app/api-request/categoryApi";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "@/app";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { userCookie } from "@/app/api-request/config";
import { jwtDecode, JwtPayload } from "jwt-decode";
import ShimmerPlaceholder from 'react-native-shimmer-placeholder';



type SubCategoryRouteProp = RouteProp<RootStackParamList, "SubCategoryScreen">;

type SubCategoryProps = {
  route: SubCategoryRouteProp;
  navigation: any;
};
interface SubCategory {
  sub_category_id: number;
  category: { category_id: number; name: string; image_url: string };
  name: string;
  image_id: number;
  image: { image_url: string };
}

interface Product {
  product_id: number;
  sub_category_id: number;
  Brand: { name: string };
  image: { image_url: string };
  name: string;
  description?: string;
  quantity: string;
  price: number;
  discount_price: number;
  is_available: boolean;
}
interface CustomJwtPayload extends JwtPayload {
  id: number;
}


const SubCategoryScreen: React.FC<SubCategoryProps> = ({ route, navigation }) => {
  const [subCategories, setSubCategories] = useState < SubCategory[] > ([]) ;
  const [products, setProducts] = useState < Product[] > ([]);
  const [selectedSubCategory, setSelectedSubCategory] = useState < number | null > (null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState < string | null > (null);
  const [cartItems, setCartItems] = useState < { product: any, quantity: number }[] > ([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { category_id } = route.params;
  const [user_id, setUser_id] = useState<number | null>(null);


  useEffect(() => {
    const fetchSubCategories = async () => {
      try {
        // Get the token from AsyncStorage
        const token = await AsyncStorage.getItem(userCookie);
        if (!token) {
          throw new Error("Token not found in AsyncStorage");
        }
  
        // Decode the token to extract user_id
        const decodedToken = jwtDecode<CustomJwtPayload>(token); // Use the custom interface
        const user_id = decodedToken.id; // Now TypeScript recognizes `id`
  
        if (user_id) {
          console.log(`UserID successfully decoded: ${user_id}`);
        } else {
          console.log("Failed to decode UserID");
        }
  
        // Set the user_id in state
        setUser_id(user_id);
  
        console.log(`UserID: ${user_id}`);
  
        const data = await getProductsBySubCategory(category_id);
        setSubCategories(data);
        setSelectedSubCategory(data[0]?.sub_category_id || null);
      } catch (error) {
        setError("Error fetching subcategories");
      } finally {
        setLoading(false);
      }
    };
    fetchSubCategories();
  }, [category_id]);


  useEffect(() => {
    if (selectedSubCategory !== null) {
      const fetchProducts = async () => {
        try {
          const data = await getProducts(selectedSubCategory);
          setProducts(data);
        } catch (error) {
          setError("Error fetching products");
        }
      };
      fetchProducts();
    }
  }, [selectedSubCategory]);

  const handleAddToCart = async (product:any) => {
    const existingCartItem = cartItems.find(
      (item:any) => item.product.product_id === product.product_id
    );

    if (existingCartItem) {
      setCartItems((prevItems:any) =>
        prevItems.map((item:any) =>
          item.product.product_id === product.product_id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCartItems((prevItems:any) => [...prevItems, { product, quantity: 1 }]);
    }

    if (user_id) {
      const cartItem = {
        user_id: user_id,
        product_id: product.product_id,
        image_url: product.image.image_url,
        quantity: 1,
        price: parseFloat(product.discount_price),
      };
      console.log("Cart item:", cartItem);
      const token = await AsyncStorage.getItem(userCookie);
      if (!token) {
        throw new Error("Authentication token not found");
      }
  
      try {
        const response = await postCartItems(cartItem, token);
        console.log("Response:", response);
        console.log("Product added to cart successfully");
      } catch (error) {
        console.error("Error adding item to the cart:", error);
      }
    }
  
    setIsModalVisible(true);
  };


  const handleRemoveFromCart = (product:any) => {
    const existingCartItem = cartItems.find(
      (item:any) => item.product.product_id === product.product_id
    );

    if (existingCartItem && existingCartItem.quantity > 1) {
      setCartItems((prevItems:any) =>
        prevItems.map((item:any) =>
          item.product.product_id === product.product_id
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
      );
    } else {
      setCartItems((prevItems:any) =>
        prevItems.filter(
          (item:any) => item.product.product_id !== product.product_id
        )
      );
    }
  };

  const calculateTotalPrice = () => {
    return cartItems.reduce(
      (total:any, item:any) => total + item.quantity * item.product.discount_price,
      0
    );
  };

  const calculateTotalSavings = () => {
    return cartItems.reduce((total:any, item:any) => {
      const savings = item.product.price - item.product.discount_price;
      return total + savings * item.quantity;
    }, 0);
  };

  const renderSubCategory = ({ item}:any) => (
    <TouchableOpacity
      style={[
        styles.subCategoryItem,
        item.sub_category_id === selectedSubCategory &&
        styles.selectedSubCategory,
      ]}
      onPress={() => setSelectedSubCategory(item.sub_category_id)}
    >
      <Image
        source={{ uri: item.image?.image_url }}
        style={styles.subCategoryImage}
      />
      <Text style={styles.subCategoryName}>
        {item.name || "Unknown Subcategory"}
      </Text>
    </TouchableOpacity>
  );

  const renderProduct = ({ item }:any) => {
    const cartItem = cartItems.find(
      (cartItem:any) => cartItem.product.product_id === item.product_id
    );
    const quantity = cartItem ? cartItem.quantity : 0;
    const renderSubCategoryShimmer = () => (
      <View style={styles.shimmerContainer}>
        <ShimmerPlaceholder style={styles.shimmerPlaceholder}  />
        <ShimmerPlaceholder style={styles.shimmerPlaceholder}  />
      </View>
    );
    
    const renderProductShimmer = () => (
      <View style={styles.shimmerContainer}>
        <ShimmerPlaceholder style={styles.shimmerPlaceholder}  />
        <ShimmerPlaceholder style={styles.shimmerPlaceholder}  />
        <ShimmerPlaceholder style={styles.shimmerPlaceholder}  />
        <ShimmerPlaceholder style={styles.shimmerPlaceholder}  />
      </View>
    );
    

    return (
      <View style={styles.productCard}>
        <Image
          source={{ uri: item.image?.image_url }}
          style={styles.productImage}
        />
        <Text style={styles.productBrand}>
          {item.Brand?.name || "Unknown Brand"}
        </Text>
        <Text style={styles.productName}>{item.name || "Unknown Product"}</Text>
        <Text style={styles.productQuantity}>
          {item.quantity || "Unknown Quantity"}
        </Text>
        <View style={styles.priceContainer}>
          <Text style={styles.discountPrice}>₹{item.discount_price}</Text>
          <Text style={styles.originalPrice}>₹{item.price}</Text>
        </View>
        {quantity > 0 ? (
          <View style={styles.quantityContainer}>
            <TouchableOpacity onPress={() => handleRemoveFromCart(item)}>
              <Icon name="remove-circle-outline" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.quantityText}>{quantity}</Text>
            <TouchableOpacity onPress={() => handleAddToCart(item)}>
              <Icon name="add-circle-outline" size={24} color="#000" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => handleAddToCart(item)}
          >
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };
  const CartModal = ({ isVisible, cartItems, onClose, navigation }:any) => {
    const renderCartItem = ({ item }:any) => (
      <View style={styles.cartItem}>
        <Image source={{ uri: item.product.image.image_url }} style={styles.productImage} />
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.product.name}</Text>
          <View style={styles.quantityControl}>
            <TouchableOpacity onPress={() => handleRemoveFromCart(item.product)}>
              <Icon name="remove-circle-outline" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.quantityText}>{item.quantity}</Text>
            <TouchableOpacity onPress={() => handleAddToCart(item.product)}>
              <Icon name="add-circle-outline" size={24} color="#000" />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.productPrice}>₹{item.product.discount_price}</Text>
      </View>
    );
  
    return (
      <Modal visible={isVisible} animationType="slide" transparent onRequestClose={onClose}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
          <TouchableOpacity style={styles.modalContent} activeOpacity={1}>
            <Text style={styles.modalTitle}>Review Items</Text>
            <FlatList
              data={cartItems}
              renderItem={renderCartItem}
              keyExtractor={(item) => item.product.product_id.toString()}
            />
            <View style={styles.summaryContainer}>
              <View style={styles.summaryDetails}>
                <Text style={styles.totalItems}>{cartItems.length} Items | ₹{calculateTotalPrice()}</Text>
                <Text style={styles.savings}>₹{calculateTotalSavings()} saved, more coming up!</Text>
              </View>
              <TouchableOpacity
  style={styles.goToCartButton}
  onPress={() => {
    onClose(); // Close the modal or perform any other necessary actions
    navigation.navigate("AddToCartScreen",{user_id}); // Navigate to CartScreen and pass the cartItems
  }}
>
  <Text style={styles.goToCartButtonText}>Go to Cart</Text>
</TouchableOpacity>

            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    );
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.navBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Image
          source={{ uri: subCategories[0]?.category?.image_url }}
          style={styles.categoryImage}
        />
        <Text style={styles.categoryTitle}>{subCategories[0]?.category?.name || "Category"}</Text>
        <TouchableOpacity onPress={() => setIsModalVisible(true)} style={styles.searchIcon}>
          <Icon name="cart" size={24} color="#000" />
        </TouchableOpacity>
      </View>
      <View style={styles.contentContainer}>
        <FlatList
          data={subCategories}
          renderItem={renderSubCategory}
          keyExtractor={(item) => item.sub_category_id.toString()}
          style={styles.subCategoryContainer}
        />
        <View style={styles.productContainer}>
          <FlatList
            data={products}
            renderItem={renderProduct}
            keyExtractor={(item) => item.product_id.toString()}
            numColumns={2}
            style={styles.productList}
          />
        </View>
      </View>

      <CartModal
        isVisible={isModalVisible}
        cartItems={cartItems}
        onClose={() => setIsModalVisible(false)}
        navigation={navigation}
      />
    </View>
  );
};
const { width } = Dimensions.get('window');
const subCategoryWidth = width * 0.25;
const productWidth = width * 0.75;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#fff",
    elevation: 2,
  },
  backButton: {
    padding: 10,
  },
  categoryImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  categoryTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  searchIcon: {
    padding: 10,
  },
  contentContainer: {
    flexDirection: "row",
    flex: 1,
    
  },
  subCategoryContainer: {
    width: subCategoryWidth,
    backgroundColor: "#fff",
    marginTop: 10,
    borderTopRightRadius: 10,
  },

  subCategoryItem: {
    padding: 10,
    alignItems: "center",
  },
  selectedSubCategory: {
    backgroundColor: "#E0E0E0",
  },
  subCategoryImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  subCategoryName: {
    marginTop: 10,
    fontSize: 14,
    textAlign: "center",
    color: "#333",
  },

  productCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    margin: 5,
    flex: 1,
    padding: 10,
    alignItems: "center",
    elevation: 2,
  },
 
  productBrand: {
    marginTop: 10,
    fontSize: 14,
    color: "#333",
  },
  
  productQuantity: {
    fontSize: 14,
    color: "#888",
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  discountPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#E91E63",
  },
  originalPrice: {
    fontSize: 14,
    color: "#888",
    textDecorationLine: "line-through",
    marginLeft: 5,
  },
  addButton: {
    marginTop: 10,
    backgroundColor: "#2ecc71",
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "60%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  cartItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 10,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 10,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  quantityControl: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },
  quantityText: {
    marginHorizontal: 10,
    fontSize: 16,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
  },
  summaryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
  },
  summaryDetails: {
    flex: 1,
  },
  totalItems: {
    fontSize: 16,
    fontWeight: "bold",
  },
  savings: {
    fontSize: 14,
    color: "#388E3C",
  },
  goToCartButton: {
    backgroundColor: "#2ecc71",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  goToCartButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  productContainer: {
    width: productWidth,
    padding: 0,
  },
  productList: {
    padding: 5,
  },
  shimmerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  shimmerPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 10,
    backgroundColor: "#E0E0E0",
  },
});

export default SubCategoryScreen;
