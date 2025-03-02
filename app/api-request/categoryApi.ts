// api/category.ts

import axios from 'axios';
import { origin, userCookie } from "./config";
import AsyncStorage from "@react-native-async-storage/async-storage";
// import config from './config';


const getAuthToken = async (): Promise<string> => {
  const token = await AsyncStorage.getItem(userCookie);
  if (!token) {
      throw new Error('Token not found in AsyncStorage');
  }
  return token;
};

export const getCategories = async () => {
  try {
    const token = await getAuthToken();
    const response = await axios({
      method: 'get',
      url: `${origin}/api/v1/category`,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
    });
    return response.data;
  } catch (error: any) {
    console.error('Error fetching categories:', error.message);
    return { error: error.response?.data?.message || "An unknown error occurred" };
  }
};


export const getCartItems = async (user_id: number) => {
  try {
    const token = await getAuthToken();
    const response = await axios({
      method: 'get',
      url: `${origin}/api/v1/cart/${user_id}`,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
    });

    return response.data;
  } catch (error: any) {
    console.error('Error fetching cart items:', error.message);
    return { error: error.response?.data?.message || "An unknown error occurred" };
  }
};


export const getProductsBySubCategory = async (category_id: number) => {
  try {
    const token = await getAuthToken();
    const response = await axios({
      method: 'get',
      url: `${origin}/api/v1/subcategory`,
      params: { category_id },
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
    });
    return response.data;
  } catch (error: any) {
    console.error('Error fetching products by subcategory:', error.message);
    return { error: error.response?.data?.message || "An unknown error occurred" };
  }
};


export const getProducts = async (sub_category_id: number) => {
  try {
    const token = await getAuthToken();
    const response = await axios({
      method: 'get',
      url: `${origin}/api/v1/product`,
      params: { sub_category_id },
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
    });
    return response.data;
  } catch (error: any) {
    console.error('Error fetching products:', error.message);
    return { error: error.response?.data?.message || "An unknown error occurred" };
  }
};

export const postCartItems = async (cartItem: any, token: string) => {
  try {
    const response = await axios({
      method: 'post',
      url: `${origin}/api/v1/cart`,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // Add the token to the Authorization header
      },
      data: cartItem, // Specify the data to send in the body
    });

    return response.data;
  } catch (error: any) {
    console.error("Error adding item to the cart:", error.message);
    return { error: error.response?.data?.message || "An unknown error occurred" };
  }
};

export const getCartItemss = async (userId: string) => {
  try {
    const token = await getAuthToken();
    const response = await axios({
      method: 'get',
      url: `${origin}/api/v1/cart`,
      params: { user_id: userId },
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
    });
    return response.data;
  } catch (error: any) {
    console.error('Error fetching cart items:', error.message);
    return { error: error.response?.data?.message || "An unknown error occurred" };
  }
};


export const updateCartItem = async (cart_Id: number, updateData: { quantity: number; }) => {
  try {
      // Construct the URL for the PATCH request
      const url = `${origin}/api/v1/cart/item/${cart_Id}`;
      
      // Send the PATCH request to the server
      const response = await axios.patch(url, updateData, {
          headers: {
              "Content-Type": "application/json",
          },
      });
      
      // Return the response data
      return response;
  } catch (error: any) {
      // Log and throw the error if the request fails
      console.error('Error updating cart item:', error.message);
      throw new Error(error.response?.data?.message || 'An unknown error occurred');
  }
};

export const removeCartItem = async (cart_Id: number) => {
  try {
      const response = await axios.delete(`${origin}/api/v1/cart/item/${cart_Id}`, {
          headers: {
              "Content-Type": "application/json",
          },
      });
      return response;
  } catch (error: any) {
      console.error('Error removing cart item:', error.message);
      throw new Error(error.response?.data?.message || 'An unknown error occurred');
  }
};
export const removeAllCartItems = async (user_id: number) => {
  try {
    // Perform the delete request with headers
    console.log(user_id)
    const response = await axios({
      method: 'delete',
      url: `${origin}/api/v1/cart/${user_id}`,
      headers: {
        "Content-Type": "application/json",
      }
    });
    
    // Return a consistent format with success and data
    return { success: true, data: response.data };
  } catch (error: any) {
    // Log the error with detailed information
    console.error('Error:', error.response?.data || error.message);
    
    // Return a consistent error format
    return { success: false, error: error.response?.data?.message || "An unknown error occurred" };
  }
};
