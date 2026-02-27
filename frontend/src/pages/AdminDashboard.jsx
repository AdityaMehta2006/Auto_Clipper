import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Typography, Grid, Card, CardContent, Button, Chip,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    IconButton, Tooltip, Skeleton, Avatar, Paper, Alert,
} from '@mui/material';
import {
    People, VideoLibrary, MovieFilter, TrendingUp,
    PersonAdd, Delete, Block, CheckCircle, AdminPanelSettings,
    BarChart, ArrowForward,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import client from '../api/client';
import CreateUserModal from '../components/CreateUserModal';

const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};
const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08 } },
};

function StatCard({ icon, label, value, accent, subtitle }) {
    return (
        <motion.div variants={fadeUp}>
            <Card sx={{
                height: '100%', position: 'relative', overflow: 'visible',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(240,243,248,0.8))',
                backdropFilter: 'blur(12px)',
            }}>
                <Box sx={{
                    position: 'absolute', top: 0, left: 0, right: 0,
                    height: 4, borderRadius: '16px 16px 0 0', background: accent,
                }} />
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2.5, py: 3, px: 3 }}>
                    <Box sx={{
                        width: 52, height: 52, borderRadius: 3,
                        background: `${accent}15`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, border: `1px solid ${accent}25`,
                    }}>
                        {icon}
                    </Box>
                    <Box>
                        <Typography sx={{ fontSize: '1.85rem', fontWeight: 700, lineHeight: 1, color: 'text.primary' }}>
                            {value}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5, fontWeight: 500 }}>
                            {label}
                        </Typography>
                        {subtitle && (
                            <Typography variant="caption" sx={{ color: accent, fontWeight: 600 }}>
                                {subtitle}
                            </Typography>
                        )}
                    </Box>
                </CardContent>
            </Card>
        </motion.div>
    );
}

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [createOpen, setCreateOpen] = useState(false);
    const navigate = useNavigate();

    const fetchData = async () => {
        try {
            const [statsRes, usersRes] = await Promise.all([
                client.get('/api/admin/stats/overview'),
                client.get('/api/admin/users'),
            ]);
            setStats(statsRes.data);
            setUsers(usersRes.data);
        } catch (err) {
            toast.error('Failed to load admin data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleToggleActive = async (userId, isActive) => {
        try {
            await client.patch(`/api/admin/users/${userId}`, { is_active: !isActive });
            toast.success(isActive ? 'User deactivated' : 'User activated');
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to update user');
        }
    };

    const handleDeleteUser = async (userId, email) => {
        if (!confirm(`Delete ${email} and ALL their data? This cannot be undone.`)) return;
        try {
            await client.delete(`/api/admin/users/${userId}`);
            toast.success('User deleted');
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to delete user');
        }
    };

    if (loading) {
        return (
            <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1400, mx: 'auto' }}>
                <Skeleton variant="text" width={300} height={48} sx={{ mb: 3 }} />
                <Grid container spacing={2.5}>
                    {[1, 2, 3, 4].map((i) => (
                        <Grid item xs={6} md={3} key={i}>
                            <Skeleton variant="rounded" height={120} sx={{ borderRadius: 4 }} />
                        </Grid>
                    ))}
                </Grid>
            </Box>
        );
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1400, mx: 'auto' }}>

                {/* Header */}
                <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                            <AdminPanelSettings sx={{ color: 'secondary.main', fontSize: 28 }} />
                            <Typography variant="h4" sx={{ fontWeight: 700 }}>Admin Panel</Typography>
                        </Box>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            Manage users and monitor platform activity
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                        <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}>
                            <Button
                                variant="outlined"
                                startIcon={<BarChart />}
                                onClick={() => navigate('/admin/metrics')}
                                sx={{
                                    borderColor: 'secondary.main', color: 'secondary.main',
                                    '&:hover': { bgcolor: 'rgba(184,137,79,0.08)', borderColor: 'secondary.dark' },
                                    borderRadius: 2, textTransform: 'none', fontWeight: 600,
                                }}
                            >
                                View Metrics
                            </Button>
                        </motion.div>
                        <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}>
                            <Button
                                variant="contained"
                                startIcon={<PersonAdd />}
                                onClick={() => setCreateOpen(true)}
                                disableElevation
                                sx={{
                                    background: 'linear-gradient(135deg, #0F2444, #1A3A6B)',
                                    '&:hover': { background: 'linear-gradient(135deg, #1A3A6B, #0F2444)' },
                                    borderRadius: 2, textTransform: 'none', fontWeight: 600,
                                }}
                            >
                                Create User
                            </Button>
                        </motion.div>
                    </Box>
                </Box>

                {/* Stats */}
                <motion.div variants={stagger} initial="hidden" animate="show">
                    <Grid container spacing={2.5} sx={{ mb: 4 }}>
                        <Grid item xs={6} md={3}>
                            <StatCard
                                icon={<People sx={{ color: '#1A3A6B', fontSize: 26 }} />}
                                label="Total Users"
                                value={stats?.total_users ?? 0}
                                accent="#1A3A6B"
                            />
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <StatCard
                                icon={<VideoLibrary sx={{ color: '#B8894F', fontSize: 26 }} />}
                                label="Total Videos"
                                value={stats?.total_videos ?? 0}
                                accent="#B8894F"
                            />
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <StatCard
                                icon={<MovieFilter sx={{ color: '#1D8348', fontSize: 26 }} />}
                                label="Total Clips"
                                value={stats?.total_clips ?? 0}
                                accent="#1D8348"
                                subtitle={`${stats?.approved_clips ?? 0} approved`}
                            />
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <StatCard
                                icon={<TrendingUp sx={{ color: '#16a34a', fontSize: 26 }} />}
                                label="Approval Rate"
                                value={`${stats?.approval_rate ?? 0}%`}
                                accent="#16a34a"
                            />
                        </Grid>
                    </Grid>
                </motion.div>

                {/* User Table */}
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>Users</Typography>
                    <Chip label={`${users.length} total`} size="small" variant="outlined"
                        sx={{ fontWeight: 600, borderRadius: 1.5 }} />
                </Box>

                <TableContainer component={Paper} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary' }}>User</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary' }}>Role</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary' }} align="center">Videos</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary' }} align="center">Clips</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary' }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary' }} align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            <AnimatePresence>
                                {users.map((u) => (
                                    <motion.tr
                                        key={u.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        component={TableRow}
                                        style={{ display: 'table-row' }}
                                    >
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <Avatar sx={{
                                                    width: 36, height: 36, fontSize: '0.85rem', fontWeight: 700,
                                                    bgcolor: u.role === 'admin' ? 'secondary.main' : 'primary.main',
                                                }}>
                                                    {u.email?.[0]?.toUpperCase()}
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
                                                        {u.display_name || u.email.split('@')[0]}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                        {u.email}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={u.role}
                                                size="small"
                                                sx={{
                                                    fontWeight: 600, fontSize: '0.7rem', borderRadius: 1,
                                                    bgcolor: u.role === 'admin' ? 'rgba(184,137,79,0.12)' : 'action.hover',
                                                    color: u.role === 'admin' ? 'secondary.dark' : 'text.secondary',
                                                    textTransform: 'capitalize',
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{u.video_count}</Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{u.clip_count}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                icon={u.is_active ? <CheckCircle sx={{ fontSize: '14px !important' }} /> : <Block sx={{ fontSize: '14px !important' }} />}
                                                label={u.is_active ? 'Active' : 'Inactive'}
                                                size="small"
                                                color={u.is_active ? 'success' : 'default'}
                                                variant="outlined"
                                                sx={{ fontWeight: 600, fontSize: '0.7rem', borderRadius: 1 }}
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                                                <Tooltip title={u.is_active ? 'Deactivate' : 'Activate'}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleToggleActive(u.id, u.is_active)}
                                                        sx={{ color: u.is_active ? 'warning.main' : 'success.main' }}
                                                    >
                                                        {u.is_active ? <Block fontSize="small" /> : <CheckCircle fontSize="small" />}
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Delete user">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleDeleteUser(u.id, u.email)}
                                                        sx={{ color: 'error.main', '&:hover': { bgcolor: 'rgba(192,57,43,0.08)' } }}
                                                    >
                                                        <Delete fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </TableCell>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            <CreateUserModal
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                onCreated={() => { setCreateOpen(false); fetchData(); }}
            />
        </motion.div>
    );
}
