import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    AppBar, Toolbar, Typography, Button, Box, IconButton,
    Drawer, List, ListItemButton, ListItemIcon, ListItemText,
    Avatar, Divider, useMediaQuery, useTheme,
} from '@mui/material';
import {
    Menu as MenuIcon,
    Dashboard as DashboardIcon,
    FolderOpen as FolderIcon,
    MovieFilter as ClipsIcon,
    Logout as LogoutIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const navItems = [
    { label: 'Dashboard', path: '/', icon: <DashboardIcon /> },
    { label: 'Files', path: '/files', icon: <FolderIcon /> },
    { label: 'Clips', path: '/clips', icon: <ClipsIcon /> },
];

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [drawerOpen, setDrawerOpen] = useState(false);

    if (!user) return null;

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <>
            <AppBar
                position="sticky"
                elevation={0}
                sx={{
                    bgcolor: '#0F2444',
                    borderBottom: '2px solid',
                    borderColor: 'secondary.main',
                }}
            >
                <Toolbar sx={{ justifyContent: 'space-between', maxWidth: 1200, mx: 'auto', width: '100%', px: { xs: 2, md: 3 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {isMobile && (
                            <IconButton color="inherit" onClick={() => setDrawerOpen(true)} sx={{ mr: 0.5 }}>
                                <MenuIcon />
                            </IconButton>
                        )}
                        <motion.div whileHover={{ scale: 1.02 }}>
                            <Typography
                                variant="h6"
                                component={Link}
                                to="/"
                                sx={{
                                    color: '#fff',
                                    textDecoration: 'none',
                                    fontWeight: 700,
                                    letterSpacing: '-0.5px',
                                    fontSize: '1.15rem',
                                }}
                            >
                                <Box component="span" sx={{ color: 'secondary.main' }}>Auto</Box>Clipper
                            </Typography>
                        </motion.div>
                    </Box>

                    {!isMobile && (
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                            {navItems.map((item) => {
                                const isActive = location.pathname === item.path;
                                return (
                                    <motion.div key={item.path} whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}>
                                        <Button
                                            component={Link}
                                            to={item.path}
                                            startIcon={item.icon}
                                            sx={{
                                                color: isActive ? 'secondary.main' : 'rgba(255,255,255,0.7)',
                                                fontWeight: isActive ? 700 : 500,
                                                fontSize: '0.85rem',
                                                bgcolor: isActive ? 'rgba(184,137,79,0.1)' : 'transparent',
                                                borderRadius: 2,
                                                px: 2,
                                                '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.06)' },
                                            }}
                                        >
                                            {item.label}
                                        </Button>
                                    </motion.div>
                                );
                            })}
                        </Box>
                    )}

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar
                            sx={{
                                width: 34, height: 34,
                                bgcolor: 'secondary.main',
                                fontSize: '0.85rem',
                                fontWeight: 700,
                                border: '2px solid rgba(255,255,255,0.2)',
                            }}
                        >
                            {user.email?.[0]?.toUpperCase()}
                        </Avatar>
                        {!isMobile && (
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>
                                {user.email}
                            </Typography>
                        )}
                        <motion.div whileTap={{ scale: 0.95 }}>
                            <IconButton size="small" onClick={handleLogout} sx={{ color: 'rgba(255,255,255,0.5)', '&:hover': { color: '#fff' } }}>
                                <LogoutIcon sx={{ fontSize: 20 }} />
                            </IconButton>
                        </motion.div>
                    </Box>
                </Toolbar>
            </AppBar>

            {/* Mobile drawer */}
            <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}
                PaperProps={{ sx: { bgcolor: '#0F2444', color: '#fff', width: 260 } }}
            >
                <Box sx={{ pt: 2 }}>
                    <Typography variant="h6" sx={{ px: 2.5, pb: 2, fontWeight: 700 }}>
                        <Box component="span" sx={{ color: 'secondary.main' }}>Auto</Box>Clipper
                    </Typography>
                    <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />
                    <List sx={{ px: 2, pt: 2 }}>
                        {navItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <ListItemButton
                                    key={item.path}
                                    component={Link}
                                    to={item.path}
                                    onClick={() => setDrawerOpen(false)}
                                    sx={{
                                        borderRadius: 2,
                                        mb: 1,
                                        py: 1.5,
                                        px: 2,
                                        width: '100%',
                                        bgcolor: isActive ? 'rgba(184,137,79,0.15)' : 'transparent',
                                        color: isActive ? 'secondary.main' : 'rgba(255,255,255,0.7)',
                                        '&:hover': {
                                            bgcolor: 'rgba(255,255,255,0.08)',
                                            color: '#fff',
                                        },
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    <ListItemIcon
                                        sx={{
                                            color: 'inherit',
                                            minWidth: 42,
                                        }}
                                    >
                                        {item.icon}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={item.label}
                                        primaryTypographyProps={{
                                            fontWeight: isActive ? 600 : 500,
                                            fontSize: '0.95rem',
                                        }}
                                    />
                                </ListItemButton>
                            );
                        })}
                    </List>
                </Box>
            </Drawer>
        </>
    );
}
