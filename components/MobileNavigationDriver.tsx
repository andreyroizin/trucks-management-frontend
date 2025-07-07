'use client';

import {
    AppBar,
    Badge,
    Box,
    Divider,
    Drawer,
    IconButton,
    List,
    ListItemButton,
    ListItemText,
    Toolbar,
    Typography,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/MenuRounded';
import GlobeIcon from '@mui/icons-material/PublicRounded';
import BellIcon from '@mui/icons-material/NotificationsNoneRounded';
import PersonIcon from '@mui/icons-material/PersonRounded';
import CloseIcon from '@mui/icons-material/CloseRounded';
import ArrowRightIcon from '@mui/icons-material/ChevronRightRounded';
import {useRouter} from 'next/navigation';
import {useAuth} from '@/hooks/useAuth';
import {useState} from "react"; // adjust path to your auth hook

/* ------------------------------------------------- */
export default function MobileNavigationDriver() {
    const router = useRouter();
    const {isAuthenticated, user, logout} = useAuth();

    const [open, setOpen] = useState(false);
    const toggle = (state: boolean) => () => setOpen(state);

    const go = (href: string) => {
        router.push(href);
        setOpen(false);
    };

    if (!isAuthenticated || !user?.roles.includes("driver")) return null;

    return (
        <>
            {/* TOP BAR ------------------------------------------------ */}
            <AppBar position="static" sx={{bgcolor: '#0D243F', boxShadow: 'none'}}>
                <Toolbar sx={{justifyContent: 'space-between', minHeight: 56}}>
                    <Typography variant="h7" fontWeight={500}>
                        Vervoer-Manager
                    </Typography>

                    <Box sx={{display: 'flex', gap: 1}}>
                        <IconButton color="inherit"><GlobeIcon/></IconButton>

                        <IconButton color="inherit" onClick={() => go('/')}>
                            <Badge
                                badgeContent={3}
                                color="primary"
                                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                            >
                                <BellIcon/>
                            </Badge>
                        </IconButton>

                        <IconButton color="inherit" onClick={toggle(true)}>
                            <MenuIcon sx={{fontSize: 28}}/>
                        </IconButton>
                    </Box>
                </Toolbar>
            </AppBar>

            {/* DRAWER ------------------------------------------------- */}
            <Drawer anchor="right" open={open} onClose={toggle(false)}>
                <Box sx={{ width: { xs: '80vw', sm: 320 }, height:"100vh", backgroundColor: '#F5F5F5' }}>
                    {/* menu items */}
                    <List sx={{p: 0}}>
                        <ListItemButton onClick={() => go('/profile')} sx={{
                            backgroundColor: '#fff',
                            pt:4, pb: 2, pl: 3, pr: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                                <PersonIcon sx={{
                                    width: 24,
                                    height: 24,
                                    color: '#fff',
                                    bgcolor: '#D9D9D9',
                                    borderRadius: '50%',
                                    p: 0.5
                                }}/>
                                <ListItemText primary="My Account"/>
                            </Box>
                            <ArrowRightIcon fontSize="small"/>
                        </ListItemButton>
                        <Divider/>

                        <ListItemButton onClick={() => go('/partrides/create')} sx={{backgroundColor: '#fff', py: 2, pl: 3, pr: 2}}>
                            <ListItemText primary="Submit Workday"/>
                            <ArrowRightIcon fontSize="small"/>
                        </ListItemButton>
                        <Divider/>

                        <ListItemButton onClick={() => go('/periods/driver/current')} sx={{backgroundColor: '#fff', py: 2, pl: 3, pr: 2}}>
                            <ListItemText primary="My Workdays"/>
                            <ArrowRightIcon fontSize="small"/>
                        </ListItemButton>
                        <Divider/>

                        <ListItemButton onClick={() => go('/periods/driver/pending')} sx={{backgroundColor: '#fff', py: 2, pl: 3, pr: 2}}>
                            <ListItemText primary="Pending Periods"/>
                            <ArrowRightIcon fontSize="small"/>
                        </ListItemButton>
                        <Divider/>

                        <ListItemButton onClick={() => go('/disputes')} sx={{backgroundColor: '#fff', py: 2, pl: 3, pr: 2}}>
                            <ListItemText primary="Disputes"/>
                            <ArrowRightIcon fontSize="small"/>
                        </ListItemButton>
                        <Divider/>

                        <ListItemButton onClick={() => go('/periods/driver/archived')} sx={{backgroundColor: '#fff', py: 2, pl: 3, pr: 2}}>
                            <ListItemText primary="Archived Periods"/>
                            <ArrowRightIcon fontSize="small"/>
                        </ListItemButton>
                        <Divider/>

                        <ListItemButton onClick={() => {
                            logout();
                            setOpen(false);
                        }} sx={{backgroundColor: '#fff', py: 2, pl: 3, pr: 2}}>
                            <ListItemText primary="Log out"/>
                            <ArrowRightIcon fontSize="small"/>
                        </ListItemButton>
                        <Divider/>
                    </List>

                    {/* footer */}
                    <Box sx={{px: 3, py:2}}>
                        <Typography variant="body1" fontWeight={500} sx={{mb: 1}}>© Vervoer-Manager</Typography>
                        <Typography variant="body2">
                            If something is wrong with the app, please let us know by email&nbsp;
                            <a href="mailto:support@vervoer-manager.com">support@vervoer-manager.com</a>
                        </Typography>
                    </Box>
                </Box>
            </Drawer>

            {/* GLOBAL CLOSE ICON (overlay) */}
            {open && (
                <IconButton
                    onClick={toggle(false)}
                    sx={{
                        position: 'fixed',
                        top: 16,
                        left: 16,
                        zIndex: (theme) => theme.zIndex.drawer + 1,
                        color: '#fff',
                        bgcolor: 'rgba(0,0,0,0.4)',
                        '&:hover': {bgcolor: 'rgba(0,0,0,0.55)'},
                    }}
                >
                    <CloseIcon/>
                </IconButton>
            )}
        </>
    );
}
