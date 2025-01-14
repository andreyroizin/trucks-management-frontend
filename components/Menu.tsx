'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button, Menu as MuiMenu, MenuItem } from '@mui/material';
import { useState } from 'react';

export default function Menu() {
    const { isAuthenticated, user, logout } = useAuth();
    const router = useRouter();

    const [menuState, setMenuState] = useState({
        accountAnchorEl: null as HTMLElement | null,
        systemAnchorEl: null as HTMLElement | null,
    });

    const handleMenuClick = (menu: 'accountAnchorEl' | 'systemAnchorEl', event: React.MouseEvent<HTMLElement>) => {
        setMenuState((prev) => ({
            ...prev,
            [menu]: prev[menu] === event.currentTarget ? null : event.currentTarget,
        }));
    };

    const handleMenuClose = (menu: 'accountAnchorEl' | 'systemAnchorEl') => {
        setMenuState((prev) => ({ ...prev, [menu]: null }));
    };

    const navigateTo = (url: string, menu: 'accountAnchorEl' | 'systemAnchorEl') => {
        handleMenuClose(menu);
        router.push(url); // Use router.push for reliable navigation
    };

    const handleLogout = () => {
        logout();
        router.push('/auth/login'); // Redirect to login after logout
    };

    const isGlobalAdmin = user?.roles.includes('globalAdmin');

    return (
        <nav className="flex justify-between items-center p-4 bg-gray-800 text-white">
            <div className="flex items-center space-x-4">
                <Link href="/" className="text-lg font-bold hover:underline">
                    Home
                </Link>
                {!isAuthenticated && (
                    <Link href="/auth/login" className="hover:underline">
                        Login
                    </Link>
                )}
                {isAuthenticated && (
                    <>
                        <Button
                            variant="text"
                            color="inherit"
                            onClick={(e) => handleMenuClick('accountAnchorEl', e)}
                            className="hover:underline"
                        >
                            Account
                        </Button>
                        <MuiMenu
                            anchorEl={menuState.accountAnchorEl}
                            open={Boolean(menuState.accountAnchorEl)}
                            onClose={() => handleMenuClose('accountAnchorEl')}
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                        >
                            <MenuItem onClick={() => navigateTo('/profile', 'accountAnchorEl')}>
                                Profile
                            </MenuItem>
                            <MenuItem onClick={() => navigateTo('/auth/change-password', 'accountAnchorEl')}>
                                Change Password
                            </MenuItem>
                        </MuiMenu>

                        {isGlobalAdmin && (
                            <>
                                <Button
                                    variant="text"
                                    color="inherit"
                                    onClick={(e) => handleMenuClick('systemAnchorEl', e)}
                                    className="hover:underline"
                                >
                                    System
                                </Button>
                                <MuiMenu
                                    anchorEl={menuState.systemAnchorEl}
                                    open={Boolean(menuState.systemAnchorEl)}
                                    onClose={() => handleMenuClose('systemAnchorEl')}
                                    anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                                    transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                                >
                                    <MenuItem onClick={() => navigateTo('/auth/register', 'systemAnchorEl')}>
                                        Register
                                    </MenuItem>
                                    <MenuItem onClick={() => navigateTo('/users', 'systemAnchorEl')}>
                                        Users
                                    </MenuItem>
                                </MuiMenu>
                            </>
                        )}

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
