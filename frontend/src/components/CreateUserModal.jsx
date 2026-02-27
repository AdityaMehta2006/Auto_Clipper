import { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Button, Box, Typography, Alert,
    ToggleButton, ToggleButtonGroup, IconButton,
    InputAdornment,
} from '@mui/material';
import { Close, Visibility, VisibilityOff } from '@mui/icons-material';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import client from '../api/client';

export default function CreateUserModal({ open, onClose, onCreated }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [role, setRole] = useState('user');
    const [showPwd, setShowPwd] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }
        setLoading(true);
        try {
            await client.post('/api/admin/users', {
                email,
                password,
                display_name: displayName || null,
                role,
            });
            toast.success(`User ${email} created!`);
            setEmail('');
            setPassword('');
            setDisplayName('');
            setRole('user');
            onCreated();
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to create user');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setError('');
        setEmail('');
        setPassword('');
        setDisplayName('');
        setRole('user');
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 4,
                    border: '1px solid rgba(15,36,68,0.08)',
                    overflow: 'visible',
                },
            }}
        >
            <Box sx={{
                position: 'absolute', top: 0, left: 0, right: 0,
                height: 4, background: 'linear-gradient(90deg, #1A3A6B, #B8894F)',
                borderRadius: '16px 16px 0 0',
            }} />

            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Create New User</Typography>
                <IconButton size="small" onClick={handleClose} sx={{ color: 'text.secondary' }}>
                    <Close fontSize="small" />
                </IconButton>
            </DialogTitle>

            <form onSubmit={handleSubmit}>
                <DialogContent sx={{ pt: 1 }}>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>
                    )}

                    <TextField
                        label="Email"
                        type="email"
                        fullWidth
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        sx={{ mb: 2.5 }}
                    />

                    <TextField
                        label="Display Name"
                        fullWidth
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Optional"
                        sx={{ mb: 2.5 }}
                    />

                    <TextField
                        label="Password"
                        type={showPwd ? 'text' : 'password'}
                        fullWidth
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        sx={{ mb: 2.5 }}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton size="small" onClick={() => setShowPwd(!showPwd)} edge="end" tabIndex={-1}>
                                        {showPwd ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />

                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', mb: 1 }}>
                        Role
                    </Typography>
                    <ToggleButtonGroup
                        value={role}
                        exclusive
                        onChange={(_, v) => v && setRole(v)}
                        fullWidth
                        sx={{
                            '& .MuiToggleButton-root': {
                                textTransform: 'none', fontWeight: 600, borderRadius: '10px !important',
                                '&.Mui-selected': {
                                    bgcolor: 'primary.main', color: '#fff',
                                    '&:hover': { bgcolor: 'primary.dark' },
                                },
                            },
                        }}
                    >
                        <ToggleButton value="user">Regular User</ToggleButton>
                        <ToggleButton value="admin">Admin</ToggleButton>
                    </ToggleButtonGroup>
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button onClick={handleClose} sx={{ textTransform: 'none', color: 'text.secondary' }}>
                        Cancel
                    </Button>
                    <motion.div whileTap={{ scale: 0.97 }}>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={loading}
                            disableElevation
                            sx={{
                                background: 'linear-gradient(135deg, #0F2444, #1A3A6B)',
                                '&:hover': { background: 'linear-gradient(135deg, #1A3A6B, #0F2444)' },
                                borderRadius: 2, textTransform: 'none', fontWeight: 600, px: 3,
                            }}
                        >
                            {loading ? 'Creating…' : 'Create User'}
                        </Button>
                    </motion.div>
                </DialogActions>
            </form>
        </Dialog>
    );
}
