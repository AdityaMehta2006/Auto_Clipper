import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Box, Card, CardContent, TextField, Button, Typography, Alert,
    IconButton, InputAdornment,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

/* Floating orb config for the animated background */
const orbs = [
    { size: 320, x: '10%', y: '15%', color: 'rgba(184,137,79,0.12)', delay: 0, dur: 14 },
    { size: 220, x: '75%', y: '65%', color: 'rgba(184,137,79,0.08)', delay: 2, dur: 18 },
    { size: 160, x: '60%', y: '10%', color: 'rgba(26,58,107,0.15)', delay: 4, dur: 16 },
    { size: 100, x: '25%', y: '80%', color: 'rgba(26,58,107,0.10)', delay: 1, dur: 20 },
];

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPwd, setShowPwd] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            toast.success('Welcome back!');
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.detail || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(160deg, #0F2444 0%, #1A3A6B 40%, #0F2444 100%)',
                px: 2,
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Floating background orbs */}
            {orbs.map((orb, i) => (
                <motion.div
                    key={i}
                    style={{
                        position: 'absolute',
                        width: orb.size,
                        height: orb.size,
                        borderRadius: '50%',
                        background: orb.color,
                        left: orb.x,
                        top: orb.y,
                        filter: 'blur(60px)',
                        pointerEvents: 'none',
                    }}
                    animate={{
                        y: [0, -30, 0, 30, 0],
                        x: [0, 15, 0, -15, 0],
                    }}
                    transition={{
                        duration: orb.dur,
                        delay: orb.delay,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />
            ))}

            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
                style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1 }}
            >
                <Card sx={{
                    borderRadius: 4,
                    border: '1px solid rgba(255,255,255,0.08)',
                    backdropFilter: 'blur(12px)',
                    bgcolor: 'rgba(255,255,255,0.97)',
                }}>
                    <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                        <Typography variant="h4" align="center" sx={{ mb: 0.5, fontSize: '1.5rem' }}>
                            <Box component="span" sx={{ color: 'secondary.main' }}>Auto</Box>Clipper
                        </Typography>
                        <Typography variant="body2" align="center" sx={{ color: 'text.secondary', mb: 4 }}>
                            Sign in to start clipping
                        </Typography>

                        {error && (
                            <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2.5 }}>{error}</Alert>
                        )}

                        <form onSubmit={handleSubmit}>
                            <TextField
                                label="Email"
                                type="email"
                                fullWidth
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                size="medium"
                                sx={{ mb: 2.5 }}
                            />
                            <TextField
                                label="Password"
                                type={showPwd ? 'text' : 'password'}
                                fullWidth
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                size="medium"
                                sx={{ mb: 3.5 }}
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
                            <motion.div whileTap={{ scale: 0.98 }}>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    fullWidth
                                    disabled={loading}
                                    size="large"
                                    sx={{
                                        py: 1.5,
                                        fontSize: '0.95rem',
                                        background: 'linear-gradient(135deg, #0F2444, #1A3A6B)',
                                        '&:hover': { background: 'linear-gradient(135deg, #1A3A6B, #0F2444)' },
                                    }}
                                >
                                    {loading ? 'Signing in…' : 'Sign In'}
                                </Button>
                            </motion.div>
                        </form>

                        <Typography variant="caption" align="center" sx={{ mt: 3, display: 'block', color: 'text.disabled' }}>
                            Need an account? Contact your administrator.
                        </Typography>
                    </CardContent>
                </Card>
            </motion.div>
        </Box>
    );
}
