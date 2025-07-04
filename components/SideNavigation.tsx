'use client';

import React from 'react';
import {
    Box,
    Collapse,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Divider,
    styled,
} from '@mui/material';
import { usePathname, useRouter } from 'next/navigation';

// ── MUI Icons ────────────────────────────────
import DashboardIcon        from '@mui/icons-material/GridViewRounded';
import ListIcon             from '@mui/icons-material/ListRounded';
import KeyboardArrowDown    from '@mui/icons-material/KeyboardArrowDownRounded';
import PersonIcon           from '@mui/icons-material/PersonRounded';
import LocalShippingIcon    from '@mui/icons-material/LocalShippingRounded';
import TargetIcon           from '@mui/icons-material/ExploreRounded';
import AssessmentIcon       from '@mui/icons-material/AssessmentRounded';
import StorageIcon          from '@mui/icons-material/StorageRounded';
import SettingsIcon         from '@mui/icons-material/SettingsRounded';

// small helper for active styling
const NavItem = styled(ListItemButton, {
    shouldForwardProp: (prop) => prop !== 'active',
})<{ active?: boolean }>(({ theme, active }) => ({
    borderRadius: 8,
    paddingLeft: theme.spacing(2),
    marginBottom: theme.spacing(0.5),
    ...(active && {
        backgroundColor: theme.palette.action.selected,
        '&:hover': { backgroundColor: theme.palette.action.selected },
    }),
}));

// ─────────────────────────────────────────────
export default function SideNavigation() {
    const router = useRouter();
    const pathname = usePathname();

    /* expansion states */
    const [workdaysOpen, setWorkdaysOpen] = React.useState<boolean>(true);
    const [reportsOpen,  setReportsOpen]  = React.useState<boolean>(false);

    /* helpers */
    const go = (href: string) => router.push(href);
    const isActive = (href: string) => pathname === href;

    return (
        <Box
            sx={{
                width: 260,
                px: 3,
                py: 4,
                height: '100vh',
                borderRight: '1px solid',
                borderColor: 'divider',
                overflowY: 'auto',
            }}
        >
            <Divider sx={{ my: 3 }} />

            <List disablePadding>
                {/* Dashboard */}
                <NavItem active={isActive('/dashboard')} onClick={() => go('/dashboard')}>
                    <ListItemIcon><DashboardIcon /></ListItemIcon>
                    <ListItemText primary="Dashboard" />
                </NavItem>

                {/* Workdays parent */}
                <NavItem onClick={() => setWorkdaysOpen((p) => !p)} active={pathname.startsWith('/workdays')}>
                    <ListItemIcon><ListIcon /></ListItemIcon>
                    <ListItemText primary="Workdays" />
                    <KeyboardArrowDown
                        sx={{ transform: workdaysOpen ? 'rotate(0deg)' : 'rotate(-90deg)', transition: '.2s' }}
                    />
                </NavItem>

                {/* Workdays children */}
                <Collapse in={workdaysOpen} timeout="auto" unmountOnExit>
                    <List disablePadding sx={{ pl: 4 }}>
                        <NavItem active={isActive('/partrides')} onClick={() => go('/partrides')}>
                            <ListItemText primary="Overview List" />
                        </NavItem>
                        <NavItem active={isActive('/disputes')} onClick={() => go('/disputes')}>
                            <ListItemText primary="Disputes List" />
                        </NavItem>
                        <NavItem active={isActive('/weeks-to-submit')} onClick={() => go('/weeks-to-submit')}>
                            <ListItemText primary="Weeks to Submit" />
                        </NavItem>
                    </List>
                </Collapse>

                {/* Drivers */}
                <NavItem active={isActive('/drivers')} onClick={() => go('/drivers')}>
                    <ListItemIcon><PersonIcon /></ListItemIcon>
                    <ListItemText primary="Drivers" />
                </NavItem>

                {/* Vehicles */}
                <NavItem active={isActive('/cars')} onClick={() => go('/cars')}>
                    <ListItemIcon><LocalShippingIcon /></ListItemIcon>
                    <ListItemText primary="Vehicles" />
                </NavItem>

                {/* Clients */}
                <NavItem active={isActive('/clients')} onClick={() => go('/clients')}>
                    <ListItemIcon><TargetIcon /></ListItemIcon>
                    <ListItemText primary="Clients" />
                </NavItem>

                {/* Reports parent */}
                <NavItem onClick={() => setReportsOpen((p) => !p)} active={pathname.startsWith('/reports')}>
                    <ListItemIcon><AssessmentIcon /></ListItemIcon>
                    <ListItemText primary="Reports" />
                    <KeyboardArrowDown
                        sx={{ transform: reportsOpen ? 'rotate(0deg)' : 'rotate(-90deg)', transition: '.2s' }}
                    />
                </NavItem>

                {/* Reports children */}
                <Collapse in={reportsOpen} timeout="auto" unmountOnExit>
                    <List disablePadding sx={{ pl: 4 }}>
                        <NavItem active={isActive('/reports/earnings')} onClick={() => go('/reports/earnings')}>
                            <ListItemText primary="Earnings" />
                        </NavItem>
                        <NavItem active={isActive('/reports/time')} onClick={() => go('/reports/time')}>
                            <ListItemText primary="Time Reports" />
                        </NavItem>
                    </List>
                </Collapse>

                <Divider sx={{ my: 3 }} />

                {/* Settings */}
                <NavItem active={isActive('/settings')} onClick={() => go('/settings')}>
                    <ListItemIcon><SettingsIcon /></ListItemIcon>
                    <ListItemText primary="Settings" />
                </NavItem>
            </List>
        </Box>
    );
}
