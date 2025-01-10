'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { login as apiLogin, logout as apiLogout, getCurrentUser } from '@/utils/api';

type User = {
    email: string;
    token: string;
};

type AuthContextType = {
    user: User | null;
    isAuthenticated: boolean;
    login: (credentials: { email: string; password: string }) => Promise<any>;
    logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const initializeAuth = async () => {
            const token = localStorage.getItem('authToken');
            if (token) {
                try {
                    const currentUser = await getCurrentUser();
                    setUser({ email: currentUser.email, token });
                    setIsAuthenticated(true);
                } catch {
                    setUser(null);
                    setIsAuthenticated(false);
                }
            }
        };
        initializeAuth();
    }, []);

    const handleLogin = async (credentials: { email: string; password: string }) => {
        const response = await apiLogin(credentials);

        if (response.isSuccess) {
            const { token } = response.data;
            localStorage.setItem('authToken', token); // Save token to localStorage
            setUser({ email: credentials.email, token });
            setIsAuthenticated(true);
            return response; // Successful response
        } else {
            return response; // Error response
        }
    };

    const handleLogout = () => {
        apiLogout();
        localStorage.removeItem('authToken');
        setUser(null);
        setIsAuthenticated(false);
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, login: handleLogin, logout: handleLogout }}>
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
