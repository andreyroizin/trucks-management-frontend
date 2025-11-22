'use client';

import React from 'react';
import Image from 'next/image';
import {Box, Collapse, Divider, List, ListItemButton, ListItemIcon, ListItemText, styled, Menu, MenuItem, IconButton} from '@mui/material';
import {usePathname, useRouter} from 'next/navigation';
import {useTranslations} from 'next-intl';

// ── MUI Icons ────────────────────────────────
// import DashboardIcon from '@mui/icons-material/GridViewRounded';
import ListIcon from '@mui/icons-material/ListRounded';
import KeyboardArrowDown from '@mui/icons-material/KeyboardArrowDownRounded';
import PersonIcon from '@mui/icons-material/PersonRounded';
import LocalShippingIcon from '@mui/icons-material/LocalShippingRounded';
import TargetIcon from '@mui/icons-material/ExploreRounded';
import BusinessIcon from '@mui/icons-material/BusinessRounded';
import AssessmentIcon from '@mui/icons-material/AssessmentRounded';
import SettingsIcon from '@mui/icons-material/SettingsRounded';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import CalendarTodayIcon from '@mui/icons-material/CalendarTodayRounded';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettingsRounded';
import Avatar from '@mui/material/Avatar';
import {useAuth} from '@/hooks/useAuth';
import {SUPPORTED_LOCALES} from "@/utils/constants/supportedLocales";
import { routing } from '@/i18n/routing';

// small helper for active styling
const NavItem = styled(ListItemButton, {
    shouldForwardProp: (prop) => prop !== 'active' && prop !== 'main',
})<{ active?: boolean; main?: boolean }>(({theme, active, main}) => ({
    borderRadius: 8,
    paddingLeft: theme.spacing(2),
    marginBottom: theme.spacing(0.5),
    ...(active && main
        ? {
            backgroundColor: '#333',
            color: '#fff',
            '& .MuiListItemIcon-root, & .MuiListItemText-primary': {
                color: '#fff',
            },
            '&:hover': {
                backgroundColor: '#333',
            },
        }
        : active
            ? {
                backgroundColor: '#1976D214',
                '&:hover': {
                    backgroundColor: '#1976D214',
                },
            }
            : {
                '&:hover': { backgroundColor: '#1976D214' },
            }),
}));

// ─────────────────────────────────────────────
export default function SideNavigation() {
    const router = useRouter();
    const pathname = usePathname();
    const t = useTranslations();
    // Helper to remove the leading locale segment (e.g. "/en/...")
    const stripLocale = (path: string) => {
        const parts = path.split('/');
        if (parts.length > 2 && SUPPORTED_LOCALES.includes(parts[1] as any)) {
            return '/' + parts.slice(2).join('/');
        }
        return path;
    };

    const pathNoLocale = React.useMemo(() => stripLocale(pathname), [pathname]);
    const locale = React.useMemo(() => {
        const parts = pathname.split('/');
        return parts.length > 1 && SUPPORTED_LOCALES.includes(parts[1] as any) ? parts[1] : routing.defaultLocale;
    }, [pathname]);
    const { isAuthenticated, user, logout, loading } = useAuth(); // { firstName, lastName, roles }

    const allowedToView = user?.roles?.some(role =>
        ['globalAdmin', 'customerAdmin', 'employer', 'customerAccountant', 'customer'].includes(role)
    );

    const initials = user
        ? `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase()
        : '??';
    const fullName = user ? `${user.firstName} ${user.lastName}` : t('navigation.profile.title');
    /* expansion states */
    const [workdaysOpen, setWorkdaysOpen] = React.useState<boolean>(true);
    const [planningOpen, setPlanningOpen] = React.useState<boolean>(false);


    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleGoToProfile = () => {
        router.push('/profile');
        handleClose();
    };

    const handleLogout = () => {
        logout();
        router.push('/auth/login');
    };

    /* helpers */
    const go = (href: string) => router.push(href);
    const isActive = (href: string) => pathNoLocale === href;

    React.useEffect(() => {
        if (!loading && !isAuthenticated) {
            if (!pathname.includes('/auth/')) {
                router.replace(`/${locale}/auth/login`);
            }
        }
    }, [loading, isAuthenticated, router, pathname, locale]);

    if (!isAuthenticated || !allowedToView) return null;

    return (
        <Box
            sx={{
                minWidth: 270,
                px: 3,
                py: 4,
                height: '100vh',
                borderRight: '1px solid',
                borderColor: 'divider',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <Box display="flex">
                <Image src="/images/logo.png" alt="Logo" width={120} height={40}/>
            </Box>
            <Divider sx={{my: 3}}/>

            <List disablePadding sx={{flexGrow: 1}}>
                {/* Dashboard */}
                {/*
                <NavItem active={isActive('/')} main onClick={() => go('/')}>
                    <ListItemIcon><DashboardIcon/></ListItemIcon>
                    <ListItemText primary={t('navigation.dashboard')}/>
                </NavItem>
                */}

                {/* Planning parent */}
                <NavItem onClick={() => setPlanningOpen((p) => !p)}
                         active={pathNoLocale.startsWith('/planning')}
                         main>
                    <ListItemIcon><CalendarTodayIcon/></ListItemIcon>
                    <ListItemText primary="Planning"/>
                    <KeyboardArrowDown
                        sx={{transform: planningOpen ? 'rotate(0deg)' : 'rotate(-90deg)', transition: '.2s'}}
                    />
                </NavItem>

                {/* Planning children */}
                <Collapse in={planningOpen} timeout="auto" unmountOnExit>
                    <List disablePadding>
                        <NavItem active={isActive('/planning/long-term')} onClick={() => go('/planning/long-term')} sx={{pl: 6}}>
                            <ListItemText primary="Long-Term"/>
                        </NavItem>
                        <NavItem active={isActive('/planning/weekly')} onClick={() => go('/planning/weekly')} sx={{pl: 6}}>
                            <ListItemText primary="Weekly"/>
                        </NavItem>
                        <NavItem active={isActive('/planning/daily')} onClick={() => go('/planning/daily')} sx={{pl: 6}}>
                            <ListItemText primary="Daily"/>
                        </NavItem>
                    </List>
                </Collapse>

                {/* Work Management parent */}
                <NavItem onClick={() => setWorkdaysOpen((p) => !p)}
                         active={pathNoLocale.startsWith('/partrides')
                             || pathNoLocale.startsWith('/rides/executions')
                             || pathNoLocale.startsWith('/driver/rides')
                             || pathNoLocale.startsWith('/execution-disputes')
                             || pathNoLocale.startsWith('/weeks-to-submit')}
                         main>
                    <ListItemIcon><ListIcon/></ListItemIcon>
                    <ListItemText primary="Work Management"/>
                    <KeyboardArrowDown
                        sx={{transform: workdaysOpen ? 'rotate(0deg)' : 'rotate(-90deg)', transition: '.2s'}}
                    />
                </NavItem>

                {/* Work Management children */}
                <Collapse in={workdaysOpen} timeout="auto" unmountOnExit>
                    <List disablePadding>
                        {user?.roles?.includes('driver') ? (
                            <NavItem active={isActive('/driver/rides')} onClick={() => go('/driver/rides')} sx={{pl: 6}}>
                                <ListItemText primary="My Rides"/>
                            </NavItem>
                        ) : (
                            <NavItem active={isActive('/rides/executions')} onClick={() => go('/rides/executions')} sx={{pl: 6}}>
                                <ListItemText primary="Ride Executions"/>
                        </NavItem>
                        )}
                        <NavItem active={isActive('/execution-disputes')} onClick={() => go('/execution-disputes')} sx={{pl: 6}}>
                            <ListItemText primary={t('navigation.workdays.disputesList')}/>
                        </NavItem>
                        <NavItem active={isActive('/weeks-to-submit')} onClick={() => go('/weeks-to-submit')} sx={{pl: 6}}>
                            <ListItemText primary={t('navigation.workdays.weeksToSubmit')}/>
                        </NavItem>
                    </List>
                </Collapse>

                {/* Drivers */}
                <NavItem active={isActive('/drivers')} main onClick={() => go('/drivers')}>
                    <ListItemIcon><PersonIcon/></ListItemIcon>
                    <ListItemText primary={t('navigation.drivers')}/>
                </NavItem>

                {/* Vehicles */}
                <NavItem active={isActive('/cars')} main onClick={() => go('/cars')}>
                    <ListItemIcon><LocalShippingIcon/></ListItemIcon>
                    <ListItemText primary={t('navigation.vehicles')}/>
                </NavItem>

                {/* Clients */}
                <NavItem active={isActive('/clients')} main onClick={() => go('/clients')}>
                    <ListItemIcon><TargetIcon/></ListItemIcon>
                    <ListItemText primary={t('navigation.clients')}/>
                </NavItem>

                {/* Companies */}
                <NavItem active={isActive('/companies')} main onClick={() => go('/companies')}>
                    <ListItemIcon><BusinessIcon/></ListItemIcon>
                    <ListItemText primary={t('navigation.companies')}/>
                </NavItem>

                {/* Admins - Only for globalAdmin */}
                {user?.roles?.includes('globalAdmin') && (
                    <NavItem active={isActive('/admins')} main onClick={() => go('/admins')}>
                        <ListItemIcon><AdminPanelSettingsIcon/></ListItemIcon>
                        <ListItemText primary={t('navigation.admins')}/>
                    </NavItem>
                )}

                {/* Reports */}
                <NavItem active={isActive('/reports')} main onClick={() => go('/reports')}>
                    <ListItemIcon><AssessmentIcon/></ListItemIcon>
                    <ListItemText primary={t('navigation.reports')}/>
                </NavItem>

                {/* <Divider sx={{my: 3}}/> */}

                {/* Settings */}
                {/* <NavItem active={isActive('/settings')} main onClick={() => go('/')}>
                    <ListItemIcon><SettingsIcon/></ListItemIcon>
                    <ListItemText primary={t('navigation.settings')}/>
                </NavItem> */}
            </List>

            {/* ───────── Bottom Actions ───────── */}
            <Box sx={{mt: 3}}>
                <Divider sx={{my: 3}}/>

                {/* Profile */}
                <NavItem sx={{ p: 0 }}>
                    <ListItemIcon sx={{ minWidth: 'unset', mr: 1 }}>
                        <Avatar sx={{ width: 40, height: 40, bgcolor: 'grey.300' }}>{initials}</Avatar>
                    </ListItemIcon>

                    <Box
                        onClick={() => router.push('/profile')}
                        sx={{ flexGrow: 1, cursor: 'pointer' }}
                    >
                                            <ListItemText
                        primary={fullName}
                        secondary={user?.roles?.[0] ?? t('navigation.profile.title')}
                        primaryTypographyProps={{ sx: { fontSize: 12, fontWeight: 600 } }}
                        secondaryTypographyProps={{ fontSize: 10 }}
                    />
                    </Box>

                    <IconButton onClick={handleMenuClick} size="small">
                        <MoreHorizIcon fontSize="small" />
                    </IconButton>
                    <Menu
                        anchorEl={anchorEl}
                        open={open}
                        onClose={handleClose}
                        anchorOrigin={{
                            vertical: 'top',
                            horizontal: 'left',
                        }}
                        transformOrigin={{
                            vertical: 'top',
                            horizontal: 'left',
                        }}
                    >
                        <MenuItem onClick={handleGoToProfile}>{t('navigation.profile.menu.profile')}</MenuItem>
                        <MenuItem onClick={handleLogout}>{t('navigation.profile.menu.logout')}</MenuItem>
                    </Menu>
                </NavItem>
            </Box>
        </Box>
    );
}
