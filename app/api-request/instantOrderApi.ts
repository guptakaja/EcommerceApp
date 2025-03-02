import axios from 'axios';
import { origin } from './config'; // Assuming you have a config file for your API domain

// Place a new InstamartOrder
export const placeInstamartOrder = async (orderData: any) => {
    try {
        const response = await axios({
            method: 'post',
            url: `${origin}/api/v1/instamart-order/create`,
            headers: {
                'Content-Type': 'application/json',
            },
            data: orderData,
        });

        return { success: true, data: response.data };
    } catch (error: any) {
        return {
            success: false,
            error: error.response?.data?.message || 'An error occurred while placing the order',
        };
    }
};

// Update an existing InstamartOrder
export const patchInstamartOrder = async (order_id: number, orderData: any) => {
    try {
        console.log(`Patching order ${order_id} with data:`, orderData);
        const response = await axios({
            method: 'patch',
            url: `${origin}/api/v1/instamart-order/${order_id}`,
            headers: {
                'Content-Type': 'application/json',
            },
            data: orderData,
        });

        return { success: true, data: response.data };
    } catch (error: any) {
        return {
            success: false,
            error: error.response?.data?.message || 'An error occurred while updating the order',
        };
    }
};

// Get all InstamartOrders
export const getAllInstamartOrders = async () => {
    try {
        const response = await axios({
            method: 'get',
            url: `${origin}/api/v1/instamart-order/`,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        return { success: true, data: response.data };
    } catch (error: any) {
        return {
            success: false,
            error: error.response?.data?.message || 'An error occurred while fetching orders',
        };
    }
};

// Get an InstamartOrder by ID
export const getInstamartOrderById = async (Instamartorder_id: number) => {
    try {
        const response = await axios({
            method: 'get',
            url: `${origin}/api/v1/instamart-order/${Instamartorder_id}`,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        return { success: true, data: response.data };
    } catch (error: any) {
        return {
            success: false,
            error: error.response?.data?.message || 'An error occurred while fetching the order',
        };
    }
};

// Delete an InstamartOrder by ID
export const deleteInstamartOrder = async (Instamartorder_id: number) => {
    try {
        await axios({
            method: 'delete',
            url: `${origin}/api/v1/instamart-order/${Instamartorder_id}`,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        return { success: true, message: 'Order deleted successfully' };
    } catch (error: any) {
        return {
            success: false,
            error: error.response?.data?.message || 'An error occurred while deleting the order',
        };
    }
};

// Get InstamartOrder by ID and User ID
export const getInstamartOrderByIdAndUserId = async (Instamartorder_id: number, user_id: number) => {
    try {
        const response = await axios({
            method: 'get',
            url: `${origin}/api/v1/instamart-order/${Instamartorder_id}/${user_id}`,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        return { success: true, data: response.data };
    } catch (error: any) {
        return {
            success: false,
            error: error.response?.data?.message || 'An error occurred while fetching the order',
        };
    }
};
