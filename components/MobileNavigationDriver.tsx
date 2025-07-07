'use client';

import React from 'react';
import {
    AppBar,
    Toolbar,
    IconButton,
    Typography,
    Badge,
    Drawer,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Box,
    Divider,
} from '@mui/material';
import MenuIcon        from '@mui/icons-material/MenuRounded';
import GlobeIcon       from '@mui/icons-material/PublicRounded';
import BellIcon        from '@mui/icons-material/NotificationsNoneRounded';
import PersonIcon      from '@mui/icons-material/PersonRounded';
import AddBoxIcon      from '@mui/icons-material/AddBoxRounded';
import HistoryEduIcon  from '@mui/icons-material/HistoryEduRounded';
import HourglassIcon   from '@mui/icons-material/HourglassBottomRounded';
import ReportIcon      from '@mui/icons-material/ReportRounded';
import ArchiveIcon     from '@mui/icons-material/ArchiveRounded';
import CloseIcon       from '@mui/icons-material/CloseRounded';
import { useRouter }   from 'next/navigation';
import { useAuth }     from '@/hooks/useAuth';   // adjust path to your auth hook

/* ------------------------------------------------- */
export default function MobileNavigationDriver() {
    const router = useRouter();
    const { user } = useAuth();

    const [open, setOpen] = React.useState(false);
    const toggle = (state: boolean) => () => setOpen(state);

    const go = (href: string) => {
        router.push(href);
        setOpen(false);
    };

    return (
        <>
            {/* TOP BAR ------------------------------------------------ */}
            <AppBar position="fixed" sx={{ bgcolor: '#0D243F', boxShadow: 'none' }}>
                <Toolbar sx={{ justifyContent: 'space-between', minHeight: 56 }}>
                    <Typography variant="h6" fontWeight={600}>
                        Vervoer-Manager
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                        <IconButton color="inherit"><GlobeIcon /></IconButton>

                        <IconButton color="inherit">
                            <Badge badgeContent={1} color="primary">
                                <BellIcon />
                            </Badge>
                        </IconButton>

                        <IconButton color="inherit" onClick={toggle(true)}>
                            <MenuIcon sx={{ fontSize: 28 }} />
                        </IconButton>
                    </Box>
                </Toolbar>
            </AppBar>

            {/* DRAWER ------------------------------------------------- */}
            <Drawer anchor="right" open={open} onClose={toggle(false)}>
                <Box sx={{ width: 320 }}>
                    {/* header with close */}
                    <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center' }}>
                        <IconButton onClick={toggle(false)} sx={{ mr: 1 }}>
                            <CloseIcon />
                        </IconButton>
                    </Box>

                    <Divider />

                    {/* menu items */}
                    <List>
                        <ListItemButton onClick={() => go('/profile')}>
                            <ListItemIcon><PersonIcon /></ListItemIcon>
                            <ListItemText primary="My Account" />
                        </ListItemButton>

                        <ListItemButton onClick={() => go('/partrides/create')}>
                            <ListItemIcon><AddBoxIcon /></ListItemIcon>
                            <ListItemText primary="Submit Workday" />
                        </ListItemButton>

                        <ListItemButton onClick={() => go('/partrides')}>
                            <ListItemIcon><HistoryEduIcon /></ListItemIcon>
                            <ListItemText primary="My Workdays" />
                        </ListItemButton>

                        <ListItemButton onClick={() => go('/weeks-to-submit')}>
                            <ListItemIcon><HourglassIcon /></ListItemIcon>
                            <ListItemText primary="Pending Periods" />
                        </ListItemButton>

                        <ListItemButton onClick={() => go('/disputes')}>
                            <ListItemIcon><ReportIcon /></ListItemIcon>
                            <ListItemText primary="Disputes" />
                        </ListItemButton>

                        <ListItemButton onClick={() => go('/weeks/archived')}>
                            <ListItemIcon><ArchiveIcon /></ListItemIcon>
                            <ListItemText primary="Archived Periods" />
                        </ListItemButton>
                    </List>

                    <Divider sx={{ mt: 'auto' }} />

                    {/* footer */}
                    <Box sx={{ p: 2 }}>
                        <Typography variant="body2" fontWeight={600}>© Vervoer-Manager</Typography>
                        <Typography variant="caption" color="text.secondary">
                            If something is wrong with the app, please let us know by email&nbsp;
                            <a href="mailto:support@vervoer-manager.com">support@vervoer-manager.com</a>
                        </Typography>
                    </Box>
                </Box>
            </Drawer>
        </>
    );
}
