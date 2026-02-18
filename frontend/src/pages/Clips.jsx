import { useState, useEffect } from 'react';
import {
    Box, Typography, Grid, Skeleton, ToggleButtonGroup, ToggleButton, Button,
} from '@mui/material';
import { MovieFilter, ArrowBack, FolderOpen } from '@mui/icons-material';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import client from '../api/client';
import ClipCard from '../components/ClipCard';
import FeedbackModal from '../components/FeedbackModal';
import { useNavigate } from 'react-router-dom';

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

export default function Clips() {
    const [clips, setClips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [feedbackClip, setFeedbackClip] = useState(null);
    const navigate = useNavigate();

    const fetchClips = async () => {
        setLoading(true);
        try {
            const res = await client.get('/api/clips');
            setClips(res.data);
        } catch {
            toast.error('Failed to load clips');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchClips(); }, []);

    const handleApprove = async (clipId) => {
        try {
            await client.patch(`/api/clips/${clipId}/approve`);
            toast.success('Clip approved! Others removed.');
            fetchClips();
        } catch {
            toast.error('Failed to approve');
        }
    };

    const handleFeedback = async (clipId, feedback) => {
        try {
            await client.post(`/api/clips/${clipId}/feedback`, { user_feedback: feedback });
            toast.success('New clip generated!');
            fetchClips();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Redo failed');
        }
    };

    const handleGenerate = async (clipId) => {
        try {
            await client.post(`/api/clips/${clipId}/generate`);
            toast.success('Clip generated successfully!');
            fetchClips();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Generation failed');
        }
    };

    const filtered = clips.filter((c) => {
        if (filter === 'approved') return c.is_approved === true;
        if (filter === 'pending') return c.is_approved === null;
        return true;
    });

    // Group by video title
    const grouped = filtered.reduce((acc, clip) => {
        const title = clip.video_title || 'Unknown Video';
        if (!acc[title]) acc[title] = [];
        acc[title].push(clip);
        return acc;
    }, {});

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
                <Box sx={{ mb: 4, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'start', md: 'center' }, gap: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Button
                            startIcon={<ArrowBack />}
                            onClick={() => navigate('/')}
                            sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main', bgcolor: 'transparent' }, minWidth: 'auto', p: 1 }}
                        />
                        <Box>
                            <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: '-0.02em', mb: 0.5 }}>
                                Clip Library
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Organized by video folder
                            </Typography>
                        </Box>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, bgcolor: '#f8fafc', p: 0.5, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                        <ToggleButtonGroup
                            value={filter}
                            exclusive
                            onChange={(_, v) => v && setFilter(v)}
                            size="small"
                            sx={{
                                '& .MuiToggleButton-root': {
                                    border: 'none',
                                    borderRadius: '8px !important',
                                    px: 2,
                                    py: 0.5,
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    fontSize: '0.85rem',
                                    color: 'text.secondary',
                                    '&.Mui-selected': {
                                        bgcolor: '#fff',
                                        color: 'primary.dark',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                    },
                                    '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' },
                                },
                            }}
                        >
                            <ToggleButton value="all">All Clips</ToggleButton>
                            <ToggleButton value="pending">Pending</ToggleButton>
                            <ToggleButton value="approved">Approved</ToggleButton>
                        </ToggleButtonGroup>
                    </Box>
                </Box>

                {loading ? (
                    <Grid container spacing={3}>
                        {[1, 2, 3, 4].map((i) => (
                            <Grid item xs={12} md={6} key={i}>
                                <Skeleton variant="rounded" height={240} sx={{ borderRadius: 4 }} />
                            </Grid>
                        ))}
                    </Grid>
                ) : filtered.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 10 }}>
                        <MovieFilter sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                            {clips.length === 0 ? 'No clips yet' : 'No matches found'}
                        </Typography>
                        <Button variant="outlined" sx={{ mt: 3 }} onClick={() => navigate('/files')}>Browse Files</Button>
                    </Box>
                ) : (
                    <motion.div variants={stagger} initial="hidden" animate="show">
                        {Object.entries(grouped).sort().map(([title, groupClips]) => (
                            <Box key={title} sx={{ mb: 6 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3, pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                                    <Box sx={{ p: 1, bgcolor: 'primary.50', borderRadius: 1.5, color: 'primary.main' }}>
                                        <FolderOpen fontSize="small" />
                                    </Box>
                                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                        {title}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, bgcolor: 'action.hover', px: 1, py: 0.5, borderRadius: 1 }}>
                                        {groupClips.length} clips
                                    </Typography>
                                </Box>

                                <Grid container spacing={3}>
                                    {groupClips.map((clip) => (
                                        <Grid item xs={12} md={6} key={clip.id}>
                                            <motion.div variants={fadeUp}>
                                                <ClipCard
                                                    clip={clip}
                                                    onApprove={handleApprove}
                                                    onFeedback={(c) => setFeedbackClip(c)}
                                                    onGenerate={handleGenerate}
                                                />
                                            </motion.div>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>
                        ))}
                    </motion.div>
                )}
            </Box>

            <FeedbackModal
                open={!!feedbackClip}
                onClose={() => setFeedbackClip(null)}
                clip={feedbackClip}
                onSubmit={handleFeedback}
            />
        </motion.div>
    );
}
