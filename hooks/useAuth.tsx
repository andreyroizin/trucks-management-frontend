"use client"

import { useState, useEffect, createContext, useContext } from 'react';
import { login, register, logout as apiLogout, getCurrentUser } from '@/utils/api';

type User = {
    id: string;
    name: string;
    email: string;
};

type AuthContextType = {
    user: User | null;
    isAuthenticated: boolean;
    login: (credentials: { email: string; password: string }) => Promise<void>;
    register: (credentials: { email: string; password: string }) => Promise<void>;
    logout: () => void;
};

// Create the AuthContext
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider to wrap the application
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Initialize authentication state when the app loads
    useEffect(() => {
        const initializeAuth = async () => {
            try {
                const currentUser = await getCurrentUser();
                setUser(currentUser);
                setIsAuthenticated(true);
            } catch (error) {
                console.error('Error fetching current user:', error);
            }
        };
        initializeAuth();
    }, []);

    // Handle login
    const handleLogin = async (credentials: { email: string; password: string }) => {
        const data = await login(credentials);
        setUser(data.user);
        setIsAuthenticated(true);
    };

    // Handle registration
    const handleRegister = async (credentials: { email: string; password: string }) => {
        await register(credentials);
    };

    // Handle logout
    const handleLogout = () => {
        apiLogout();
        setUser(null);
        setIsAuthenticated(false);
    };

    return (
        <AuthContext.Provider
            value={{
        user,
            isAuthenticated,
            login: handleLogin,
            register: handleRegister,
            logout: handleLogout,
    }}
>
    {children}
    </AuthContext.Provider>
);
};

// Custom hook to access AuthContext
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
