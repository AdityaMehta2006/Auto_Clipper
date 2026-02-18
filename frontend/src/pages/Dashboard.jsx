import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Box, Typography, Grid, Card, CardContent, Chip, Skeleton, Button, Alert,
} from '@mui/material';
import {
    FolderOpen, MovieFilter, CheckCircle, HourglassEmpty, Error as ErrorIcon,
    CloudDone, CloudOff, ArrowForward,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

function StatCard({ icon, label, value, accent }) {
    return (
        <motion.div variants={fadeUp}>
            <Card sx={{ height: '100%', position: 'relative', overflow: 'visible' }}>
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0,
                        height: 4,
                        borderRadius: '16px 16px 0 0',
                        background: accent,
                    }}
                />
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2.5, py: 3, px: 3 }}>
                    <Box
                        sx={{
                            width: 48, height: 48,
                            borderRadius: 3,
                            background: `${accent}12`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                        }}
                    >
                        {icon}
                    </Box>
                    <Box>
                        <Typography sx={{ fontSize: '1.75rem', fontWeight: 700, lineHeight: 1, color: 'text.primary' }}>
                            {value}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5, fontWeight: 500 }}>
                            {label}
                        </Typography>
                    </Box>
                </CardContent>
            </Card>
        </motion.div>
    );
}

export default function Dashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                const [videosRes, clipsRes] = await Promise.all([
                    client.get('/api/videos'),
                    client.get('/api/clips'),
                ]);
                const videos = videosRes.data;
                const clips = clipsRes.data;
                setStats({
                    totalVideos: videos.length,
                    pending: videos.filter((v) => v.status === 'pending').length,
                    clipped: videos.filter((v) => v.status === 'clipped').length,
                    failed: videos.filter((v) => v.status === 'failed').length,
                    totalClips: clips.length,
                });
            } catch {
                setStats({ totalVideos: 0, pending: 0, clipped: 0, failed: 0, totalClips: 0 });
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, []);

    const handleConnectDrive = async () => {
        try {
            const res = await client.get('/api/auth/google/connect');
            window.location.href = res.data.auth_url;
        } catch {
            // If Google credentials aren't configured
        }
    };

    if (loading) {
        return (
            <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
                <Skeleton variant="text" width={200} height={40} sx={{ mb: 3 }} />
                <Grid container spacing={2.5}>
                    {[1, 2, 3, 4].map((i) => (
                        <Grid key={i} size={{ xs: 6, md: 3 }}>
                            <Skeleton variant="rounded" height={110} sx={{ borderRadius: 4 }} />
                        </Grid>
                    ))}
                </Grid>
            </Box>
        );
    }

    const hasGoogle = user?.has_google_token;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
                {/* Header */}
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h4" sx={{ mb: 0.5 }}>Dashboard</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Overview of your video library and clips
                    </Typography>
                </Box>

                {/* Google Drive connection banner */}
                {!hasGoogle && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
                        <Alert
                            severity="info"
                            icon={<CloudOff />}
                            action={
                                <Button color="inherit" size="small" variant="outlined" onClick={handleConnectDrive}
                                    sx={{ borderColor: 'rgba(255,255,255,0.5)', fontWeight: 600, whiteSpace: 'nowrap' }}
                                >
                                    Connect Drive
                                </Button>
                            }
                            sx={{
                                mb: 3, borderRadius: 3,
                                bgcolor: 'primary.dark', color: '#fff',
                                '& .MuiAlert-icon': { color: '#fff' },
                                alignItems: 'center',
                            }}
                        >
                            Connect your Google Drive to browse and analyze videos.
                        </Alert>
                    </motion.div>
                )}

                {hasGoogle && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
                        <Chip
                            icon={<CloudDone />}
                            label="Google Drive Connected"
                            color="success"
                            sx={{ mb: 3, fontWeight: 600, py: 2.5, px: 1.5 }}
                        />
                    </motion.div>
                )}

                {/* Stats */}
                <motion.div variants={stagger} initial="hidden" animate="show">
                    <Grid container spacing={2.5}>
                        <Grid item xs={6} md={3}>
                            <StatCard
                                icon={<FolderOpen sx={{ color: '#1A3A6B', fontSize: 24 }} />}
                                label="Total Videos"
                                value={stats?.totalVideos ?? 0}
                                accent="#1A3A6B"
                            />
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <StatCard
                                icon={<HourglassEmpty sx={{ color: '#D4A843', fontSize: 24 }} />}
                                label="Pending"
                                value={stats?.pending ?? 0}
                                accent="#D4A843"
                            />
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <StatCard
                                icon={<CheckCircle sx={{ color: '#1D8348', fontSize: 24 }} />}
                                label="Clipped"
                                value={stats?.clipped ?? 0}
                                accent="#1D8348"
                            />
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <StatCard
                                icon={<MovieFilter sx={{ color: '#B8894F', fontSize: 24 }} />}
                                label="Total Clips"
                                value={stats?.totalClips ?? 0}
                                accent="#B8894F"
                            />
                        </Grid>
                    </Grid>
                </motion.div>

                <Typography variant="h6" sx={{ mt: 5, mb: 2.5, fontWeight: 700 }}>Quick Actions</Typography>
                <Grid container spacing={2.5}>
                    <Grid item xs={12} sm={6}>
                        <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                            <Card
                                component={Link}
                                to="/files"
                                variant="outlined"
                                sx={{
                                    textDecoration: 'none',
                                    p: 2.5,
                                    borderRadius: 3,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 2.5,
                                    borderColor: 'divider',
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                        borderColor: 'primary.main',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                        bgcolor: 'rgba(255,255,255,0.5)',
                                    },
                                }}
                            >
                                <Box sx={{
                                    width: 50, height: 50, borderRadius: 2,
                                    bgcolor: 'primary.50', color: 'primary.main',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    border: '1px solid', borderColor: 'primary.100',
                                }}>
                                    <FolderOpen fontSize="medium" />
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="subtitle1" sx={{ color: 'text.primary', fontWeight: 700 }}>
                                        Browse Files
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                        Import and manage videos
                                    </Typography>
                                </Box>
                                <ArrowForward sx={{ color: 'text.disabled' }} />
                            </Card>
                        </motion.div>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                            <Card
                                component={Link}
                                to="/clips"
                                variant="outlined"
                                sx={{
                                    textDecoration: 'none',
                                    p: 2.5,
                                    borderRadius: 3,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 2.5,
                                    borderColor: 'divider',
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                        borderColor: 'secondary.main',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                        bgcolor: 'rgba(255,255,255,0.5)',
                                    },
                                }}
                            >
                                <Box sx={{
                                    width: 50, height: 50, borderRadius: 2,
                                    bgcolor: '#FFF8E1', color: '#F57C00',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    border: '1px solid', borderColor: '#FFE0B2',
                                }}>
                                    <MovieFilter fontSize="medium" />
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="subtitle1" sx={{ color: 'text.primary', fontWeight: 700 }}>
                                        View Clips
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                        Review viral highlights
                                    </Typography>
                                </Box>
                                <ArrowForward sx={{ color: 'text.disabled' }} />
                            </Card>
                        </motion.div>
                    </Grid>
                </Grid>
            </Box>
        </motion.div>
    );
}
