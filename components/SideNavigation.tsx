'use client';

import React from 'react';
import Image from 'next/image';
import {Box, Button, Collapse, Divider, List, ListItemButton, ListItemIcon, ListItemText, styled,} from '@mui/material';
import {usePathname, useRouter} from 'next/navigation';

// ── MUI Icons ────────────────────────────────
import DashboardIcon from '@mui/icons-material/GridViewRounded';
import ListIcon from '@mui/icons-material/ListRounded';
import KeyboardArrowDown from '@mui/icons-material/KeyboardArrowDownRounded';
import PersonIcon from '@mui/icons-material/PersonRounded';
import LocalShippingIcon from '@mui/icons-material/LocalShippingRounded';
import TargetIcon from '@mui/icons-material/ExploreRounded';
import AssessmentIcon from '@mui/icons-material/AssessmentRounded';
import SettingsIcon from '@mui/icons-material/SettingsRounded';
import AddIcon from '@mui/icons-material/AddRounded';
import Avatar from '@mui/material/Avatar';
import {useAuth} from '@/hooks/useAuth';

// small helper for active styling
const NavItem = styled(ListItemButton, {
    shouldForwardProp: (prop) => prop !== 'active',
})<{ active?: boolean }>(({theme, active}) => ({
    borderRadius: 8,
    paddingLeft: theme.spacing(2),
    marginBottom: theme.spacing(0.5),
    ...(active
        ? {
            backgroundColor: '#1976D214',
            '&:hover': {backgroundColor: '#1976D214'},
        }
        : {
            '&:hover': {backgroundColor: '#1976D214'},
        }),
}));

// ─────────────────────────────────────────────
export default function SideNavigation() {
    const router = useRouter();
    const pathname = usePathname();
    const {user} = useAuth();         // { firstName, lastName, roles }
    const initials = user
        ? `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase()
        : '??';
    const fullName = user ? `${user.firstName} ${user.lastName}` : 'My Profile';
    /* expansion states */
    const [workdaysOpen, setWorkdaysOpen] = React.useState<boolean>(true);
    const [reportsOpen, setReportsOpen] = React.useState<boolean>(false);

    /* helpers */
    const go = (href: string) => router.push(href);
    const isActive = (href: string) => pathname === href;

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
                <NavItem active={isActive('/')} onClick={() => go('/')}>
                    <ListItemIcon><DashboardIcon/></ListItemIcon>
                    <ListItemText primary="Dashboard"/>
                </NavItem>

                {/* Workdays parent */}
                <NavItem onClick={() => setWorkdaysOpen((p) => !p)}
                         active={pathname.startsWith('/partrides') || pathname.startsWith('/disputes')}>
                    <ListItemIcon><ListIcon/></ListItemIcon>
                    <ListItemText primary="Workdays"/>
                    <KeyboardArrowDown
                        sx={{transform: workdaysOpen ? 'rotate(0deg)' : 'rotate(-90deg)', transition: '.2s'}}
                    />
                </NavItem>

                {/* Workdays children */}
                <Collapse in={workdaysOpen} timeout="auto" unmountOnExit>
                    <List disablePadding>
                        <NavItem active={isActive('/partrides')} onClick={() => go('/partrides')} sx={{pl: 6}}>
                            <ListItemText primary="Overview List"/>
                        </NavItem>
                        <NavItem active={isActive('/disputes')} onClick={() => go('/disputes')} sx={{pl: 6}}>
                            <ListItemText primary="Disputes List"/>
                        </NavItem>
                        <NavItem active={isActive('/weeks-to-submit')} onClick={() => go('/')} sx={{pl: 6}}>
                            <ListItemText primary="Weeks to Submit"/>
                        </NavItem>
                    </List>
                </Collapse>

                {/* Drivers */}
                <NavItem active={isActive('/drivers')} onClick={() => go('/drivers')}>
                    <ListItemIcon><PersonIcon/></ListItemIcon>
                    <ListItemText primary="Drivers"/>
                </NavItem>

                {/* Vehicles */}
                <NavItem active={isActive('/cars')} onClick={() => go('/cars')}>
                    <ListItemIcon><LocalShippingIcon/></ListItemIcon>
                    <ListItemText primary="Vehicles"/>
                </NavItem>

                {/* Clients */}
                <NavItem active={isActive('/clients')} onClick={() => go('/clients')}>
                    <ListItemIcon><TargetIcon/></ListItemIcon>
                    <ListItemText primary="Clients"/>
                </NavItem>

                {/* Reports parent */}
                <NavItem onClick={() => setReportsOpen((p) => !p)} active={pathname.startsWith('/reports')}>
                    <ListItemIcon><AssessmentIcon/></ListItemIcon>
                    <ListItemText primary="Reports"/>
                    <KeyboardArrowDown
                        sx={{transform: reportsOpen ? 'rotate(0deg)' : 'rotate(-90deg)', transition: '.2s'}}
                    />
                </NavItem>

                {/* Reports children */}
                <Collapse in={reportsOpen} timeout="auto" unmountOnExit>
                    <List disablePadding>
                        <NavItem active={isActive('/reports/earnings')} onClick={() => go('/')} sx={{pl: 6}}>
                            <ListItemText primary="Earnings"/>
                        </NavItem>
                        <NavItem active={isActive('/reports/time')} onClick={() => go('/')} sx={{pl: 6}}>
                            <ListItemText primary="Time Reports"/>
                        </NavItem>
                    </List>
                </Collapse>

                <Divider sx={{my: 3}}/>

                {/* Settings */}
                <NavItem active={isActive('/settings')} onClick={() => go('/')}>
                    <ListItemIcon><SettingsIcon/></ListItemIcon>
                    <ListItemText primary="Settings"/>
                </NavItem>
            </List>

            {/* ───────── Bottom Actions ───────── */}
            <Box sx={{mt: 3}}>
                {/* Create Workday */}
                <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon/>}
                    onClick={() => router.push('/partrides/create')}
                    sx={{px: 1, py: 1}}
                >
                    Create New Workday
                </Button>

                <Divider sx={{my: 3}}/>

                {/* Profile */}
                <NavItem
                    onClick={() => router.push('/profile')}
                    sx={{p: 0}}
                >
                    <ListItemIcon>
                        <Avatar sx={{width: 40, height: 40, bgcolor: 'grey.300'}}>{initials}</Avatar>
                        {/*<CircleIcon*/}
                        {/*    sx={{color: 'success.main', fontSize: 10, position: 'absolute', left: 30, bottom: 4}}/>*/}
                    </ListItemIcon>

                    <Box sx={{flexGrow: 1}}>
                        <ListItemText
                            primary={fullName}
                            secondary={user?.roles?.[0] ?? 'Profile'}
                            primaryTypographyProps={{sx: {fontSize: 12, fontWeight: 600}}}
                            secondaryTypographyProps={{fontSize: 10}}
                        />
                        {/* green online indicator */}

                    </Box>
                    {/*<MoreHorizIcon fontSize="small"/>*/}
                </NavItem>
            </Box>
        </Box>
    );
}
