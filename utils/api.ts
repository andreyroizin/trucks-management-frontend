import axios from 'axios';
import Cookies from 'js-cookie';
import {ApiResponse, ChangePasswordPayload, LoginResponse, ResetPasswordPayload} from "@/types/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Create an Axios instance
export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    // Attach the token to requests if available
    const token = localStorage.getItem('authToken');

    // Attach the preferred locale from cookie as Accept‑Language header
    const locale = Cookies.get('NEXT_LOCALE') || 'en';
    config.headers['Accept-Language'] = locale;

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Login API call
export const login = async (credentials: { email: string; password: string }) => {
    try {
        const response = await api.post<LoginResponse>('/login', credentials);
        const data = response.data;

        if (data.isSuccess) {
            return data; // Return successful response
        } else {
            // Return structured error response for frontend handling
            return {
                isSuccess: false,
                errors: data.errors || ['Unknown error occurred'],
            };
        }
    } catch (error: any) {
        // Handle unexpected errors
        if (error.response && error.response.data) {
            return error.response.data; // Return API error response
        }
        return {
            isSuccess: false,
            errors: ['Network error or unexpected issue occurred'],
        };
    }
};

// Register API call
export const register = async (credentials: { email: string; password: string; roles: string[] }) => {
    const response = await api.post('/register', credentials);
    return response.data;
};

// Logout API call
export const logout = () => {
    localStorage.removeItem('authToken');
};

// Get the current user
export const getCurrentUser = async () => {
    const response = await api.get('/users/me'); // Replace '/auth/me' with your endpoint
    return response.data.data;
};

export const forgotPassword = async (email: string): Promise<ApiResponse<string>> => {
    const response = await api.post<ApiResponse<string>>('/forgotpassword', { email });
    return response.data;
};

export const resetPasswordWithToken = async (payload: ResetPasswordPayload) => {
    const response = await api.post('/reset-password-token', payload);
    return response.data;
};

export const changePassword = async (payload: ChangePasswordPayload): Promise<ApiResponse<string>> => {
    const response = await api.post<ApiResponse<string>>('/users/change-password', payload);
    return response.data;
};
