'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@mui/material';

export default function Menu() {
    const { isAuthenticated, user, logout } = useAuth();
    const router = useRouter();

    const handleLogout = () => {
        logout();
        router.push('/auth/login'); // Redirect to login after logout
    };

    return (
        <nav className="flex justify-between items-center p-4 bg-gray-800 text-white">
            <div className="flex items-center space-x-4">
                <Link href="/" className="text-lg font-bold hover:underline">
                    Home
                </Link>
                {!isAuthenticated && (
                    <>
                        <Link href="/auth/login" className="hover:underline">
                            Login
                        </Link>
                        <Link href="/auth/register" className="hover:underline">
                            Register
                        </Link>
                    </>
                )}
                {isAuthenticated && (
                    <>
                        <Link href="/profile" className="hover:underline">
                            Profile
                        </Link>
                        <Button
                            variant="text"
                            color="inherit"
                            onClick={handleLogout}
                            className="hover:underline"
                        >
                            Logout
                        </Button>
                    </>
                )}
            </div>
            {isAuthenticated && (
                <div>
          <span className="text-sm">
            Logged in as: <strong>{user?.firstName} {user?.lastName}</strong>
          </span>
                </div>
            )}
        </nav>
    );
}

