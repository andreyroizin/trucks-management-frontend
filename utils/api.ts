import axios from 'axios';

const API_BASE_URL = 'https://localhost:7129'; // Update with your API base URL

// Create an Axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Attach the token to requests if available
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Login API call
export const login = async (credentials: { email: string; password: string }) => {
    const response = await api.post('/login', credentials);
    const { token } = response.data;
    localStorage.setItem('authToken', token); // Save token to localStorage
    return response.data;
};

// Register API call
export const register = async (credentials: { email: string; password: string }) => {
    const response = await api.post('/auth/register', credentials);
    return response.data;
};

// Logout API call
export const logout = () => {
    localStorage.removeItem('authToken');
};

// Get the current user
export const getCurrentUser = async () => {
    const response = await api.get('/auth/me'); // Replace '/auth/me' with your endpoint
    return response.data;
};
