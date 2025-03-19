'use client';

import {useState, useEffect, createContext, useContext} from 'react';
import {login as apiLogin, logout as apiLogout, getCurrentUser} from '@/utils/api';
import {LoginResponse} from "@/types/api";

type User = {
    email: string;
    firstName: string;
    lastName: string;
    roles: string[];
    companyId: string;
    postcode?: string;
    phoneNumber?: string;
    address?: string;
    city?: string;
    country?: string;
    remark?: string;
    driverInfo: {
        driverId: string,
        companyId: string,
        companyName: string
    } | null,
};
type AuthContextType = {
    user: User | null;
    isAuthenticated: boolean;
    loading: boolean;
    login: (credentials: { email: string; password: string }) => Promise<LoginResponse>;
    logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({children}: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initializeAuth = async () => {
            const token = localStorage.getItem('authToken');
            if (token) {
                try {
                    const currentUser = await getCurrentUser();
                    setUser(currentUser);
                    setIsAuthenticated(true);
                } catch {
                    setUser(null);
                    setIsAuthenticated(false);
                }
            }
            setLoading(false);
        };
        initializeAuth();
    }, []);

    const handleLogin = async (credentials: { email: string; password: string }): Promise<LoginResponse> => {
        const response = await apiLogin(credentials);

        if (response.isSuccess) {
            const {token} = response.data;
            localStorage.setItem('authToken', token); // Save the token
            const currentUser = await getCurrentUser(); // Fetch user details
            setUser(currentUser);
            setIsAuthenticated(true);
        } else {
            throw new Error(response.errors?.[0] || 'Login failed'); // Pass the error to the LoginForm
        }

        return response; // Return the response for frontend handling
    };

    const handleLogout = () => {
        apiLogout();
        localStorage.removeItem('authToken');
        setUser(null);
        setIsAuthenticated(false);
    };

    return (
        <AuthContext.Provider value={{user, isAuthenticated, loading, login: handleLogin, logout: handleLogout}}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
