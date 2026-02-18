import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Box, Card, CardContent, TextField, Button, Typography, Alert,
} from '@mui/material';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function Register() {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (password !== confirm) { setError('Passwords do not match'); return; }
        if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
        setLoading(true);
        try {
            await register(email, password);
            toast.success('Account created!');
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.detail || 'Registration failed');
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
            }}
        >
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
                style={{ width: '100%', maxWidth: 400 }}
            >
                <Card sx={{ borderRadius: 4, border: '1px solid rgba(255,255,255,0.06)' }}>
                    <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                        <Typography variant="h4" align="center" sx={{ mb: 0.5, fontSize: '1.5rem' }}>
                            <Box component="span" sx={{ color: 'secondary.main' }}>Auto</Box>Clipper
                        </Typography>
                        <Typography variant="body2" align="center" sx={{ color: 'text.secondary', mb: 4 }}>
                            Create your account
                        </Typography>

                        {error && (
                            <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2.5 }}>{error}</Alert>
                        )}

                        <form onSubmit={handleSubmit}>
                            <TextField label="Email" type="email" fullWidth required
                                value={email} onChange={(e) => setEmail(e.target.value)} sx={{ mb: 2.5 }} />
                            <TextField label="Password" type="password" fullWidth required
                                value={password} onChange={(e) => setPassword(e.target.value)} sx={{ mb: 2.5 }} />
                            <TextField label="Confirm Password" type="password" fullWidth required
                                value={confirm} onChange={(e) => setConfirm(e.target.value)} sx={{ mb: 3.5 }} />
                            <motion.div whileTap={{ scale: 0.98 }}>
                                <Button type="submit" variant="contained" fullWidth disabled={loading} size="large"
                                    sx={{ py: 1.5, fontSize: '0.95rem', bgcolor: 'primary.dark', '&:hover': { bgcolor: 'primary.main' } }}
                                >
                                    {loading ? 'Creating account…' : 'Create Account'}
                                </Button>
                            </motion.div>
                        </form>

                        <Typography variant="body2" align="center" sx={{ mt: 3, color: 'text.secondary' }}>
                            Already have an account?{' '}
                            <Box component={Link} to="/login"
                                sx={{ color: 'secondary.main', fontWeight: 600, textDecoration: 'none' }}
                            >
                                Sign In
                            </Box>
                        </Typography>
                    </CardContent>
                </Card>
            </motion.div>
        </Box>
    );
}
