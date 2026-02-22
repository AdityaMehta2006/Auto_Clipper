import { useState, useEffect } from 'react';
import {
    Box, Typography, Skeleton, ToggleButtonGroup, ToggleButton, Button,
    Accordion, AccordionSummary, AccordionDetails, Chip, Grid,
    IconButton, Tooltip,
} from '@mui/material';
import {
    MovieFilter, ArrowBack, FolderOpen, ExpandMore,
    UnfoldLess, UnfoldMore, CheckCircle, HourglassEmpty,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import client from '../api/client';
import ClipCard from '../components/ClipCard';
import FeedbackModal from '../components/FeedbackModal';
import { useNavigate } from 'react-router-dom';

export default function Clips() {
    const [clips, setClips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [feedbackClip, setFeedbackClip] = useState(null);
    // Track which video groups are expanded (default: all open)
    const [expanded, setExpanded] = useState({});
    const navigate = useNavigate();

    const fetchClips = async () => {
        setLoading(true);
        try {
            const res = await client.get('/api/clips');
            setClips(res.data);
            // Auto-expand all groups on first load
            const titles = [...new Set(res.data.map((c) => c.video_title || 'Unknown Video'))];
            setExpanded((prev) => {
                const next = { ...prev };
                titles.forEach((t) => { if (!(t in next)) next[t] = true; });
                return next;
            });
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
            toast.success('Clip approved!');
            fetchClips();
        } catch {
            toast.error('Failed to approve');
        }
    };

    const handleReject = async (clipId) => {
        try {
            await client.delete(`/api/clips/${clipId}/reject`);
            toast('Clip removed', { icon: '👋' });
            fetchClips();
        } catch {
            toast.error('Failed to reject');
        }
    };

    const handleFeedback = async (clipId, feedback) => {
        if (feedback === null) {
            // FeedbackModal already handled the SSE call — hard reload to show new clips
            toast.success('New suggestion ready!');
            window.location.reload();
            return;
        }
        try {
            await client.post(`/api/clips/${clipId}/feedback`, { user_feedback: feedback });
            toast.success('New suggestion ready! Click Generate to create it.');
            fetchClips();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Redo failed');
        }
    };

    const handleGenerate = async (clipId) => {
        try {
            await client.post(`/api/clips/${clipId}/generate`);
            toast.success('Clip generated!');
            fetchClips();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Generation failed');
        }
    };

    // ── Filter ──
    const filtered = clips.filter((c) => {
        if (filter === 'approved') return c.is_approved === true;
        if (filter === 'pending') return c.is_approved === null;
        return true;
    });

    // ── Group by video title ──
    const grouped = filtered.reduce((acc, clip) => {
        const title = clip.video_title || 'Unknown Video';
        if (!acc[title]) acc[title] = [];
        acc[title].push(clip);
        return acc;
    }, {});

    const groupEntries = Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
    const allExpanded = groupEntries.every(([t]) => expanded[t]);

    const toggleAll = () => {
        const next = {};
        groupEntries.forEach(([t]) => { next[t] = !allExpanded; });
        setExpanded((prev) => ({ ...prev, ...next }));
    };

    const toggleGroup = (title) =>
        setExpanded((prev) => ({ ...prev, [title]: !prev[title] }));

    // Counts for filter badges
    const approvedTotal = clips.filter((c) => c.is_approved === true).length;
    const pendingTotal = clips.filter((c) => c.is_approved === null).length;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1280, mx: 'auto' }}>

                {/* ── Header ── */}
                <Box sx={{
                    mb: 4,
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    justifyContent: 'space-between',
                    alignItems: { xs: 'stretch', md: 'center' },
                    gap: 2,
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <IconButton
                            size="small"
                            onClick={() => navigate('/')}
                            sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
                        >
                            <ArrowBack fontSize="small" />
                        </IconButton>
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
                                Clip Library
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {clips.length} clip{clips.length !== 1 ? 's' : ''} across {Object.keys(grouped).length} video{Object.keys(grouped).length !== 1 ? 's' : ''}
                            </Typography>
                        </Box>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        {/* Collapse / Expand all */}
                        {groupEntries.length > 1 && (
                            <Tooltip title={allExpanded ? 'Collapse all' : 'Expand all'}>
                                <IconButton size="small" onClick={toggleAll} sx={{ color: 'text.secondary' }}>
                                    {allExpanded ? <UnfoldLess fontSize="small" /> : <UnfoldMore fontSize="small" />}
                                </IconButton>
                            </Tooltip>
                        )}

                        {/* Filter Pills */}
                        <Box sx={{ bgcolor: '#f8fafc', p: 0.5, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
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
                                        fontSize: '0.82rem',
                                        color: 'text.secondary',
                                        '&.Mui-selected': {
                                            bgcolor: '#fff',
                                            color: 'primary.dark',
                                            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                                        },
                                        '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' },
                                    },
                                }}
                            >
                                <ToggleButton value="all">All</ToggleButton>
                                <ToggleButton value="pending">
                                    Pending{pendingTotal > 0 ? ` (${pendingTotal})` : ''}
                                </ToggleButton>
                                <ToggleButton value="approved">
                                    Approved{approvedTotal > 0 ? ` (${approvedTotal})` : ''}
                                </ToggleButton>
                            </ToggleButtonGroup>
                        </Box>
                    </Box>
                </Box>

                {/* ── Content ── */}
                {loading ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {[1, 2].map((i) => (
                            <Skeleton key={i} variant="rounded" height={72} sx={{ borderRadius: 3 }} />
                        ))}
                        <Box sx={{ mt: 1 }}>
                            <Grid container spacing={2.5}>
                                {[1, 2, 3].map((i) => (
                                    <Grid item xs={12} sm={6} lg={4} key={i}>
                                        <Skeleton variant="rounded" height={340} sx={{ borderRadius: 3 }} />
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    </Box>
                ) : filtered.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 12 }}>
                        <MovieFilter sx={{ fontSize: 52, color: 'text.disabled', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                            {clips.length === 0 ? 'No clips yet' : 'No matches for this filter'}
                        </Typography>
                        <Button
                            variant="outlined"
                            sx={{ mt: 3, borderRadius: 2, textTransform: 'none' }}
                            onClick={() => navigate('/files')}
                        >
                            Browse Files
                        </Button>
                    </Box>
                ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <AnimatePresence>
                            {groupEntries.map(([title, groupClips]) => {
                                const approvedCount = groupClips.filter((c) => c.is_approved === true).length;
                                const pendingCount = groupClips.filter((c) => c.is_approved === null).length;
                                const isOpen = !!expanded[title];

                                return (
                                    <motion.div
                                        key={title}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.25 }}
                                    >
                                        <Accordion
                                            expanded={isOpen}
                                            onChange={() => toggleGroup(title)}
                                            disableGutters
                                            elevation={0}
                                            sx={{
                                                border: '1px solid',
                                                borderColor: 'divider',
                                                borderRadius: '12px !important',
                                                '&:before': { display: 'none' },
                                                overflow: 'hidden',
                                            }}
                                        >
                                            <AccordionSummary
                                                expandIcon={<ExpandMore />}
                                                sx={{
                                                    px: 2.5,
                                                    minHeight: 56,
                                                    bgcolor: isOpen ? '#fafafa' : '#fff',
                                                    '&:hover': { bgcolor: '#f8f8f8' },
                                                    '& .MuiAccordionSummary-content': {
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 1.5,
                                                        my: 1.5,
                                                    },
                                                }}
                                            >
                                                <Box sx={{ p: 0.75, bgcolor: 'primary.50', borderRadius: 1.5, color: 'primary.main', display: 'flex' }}>
                                                    <FolderOpen fontSize="small" />
                                                </Box>
                                                <Typography variant="subtitle1" sx={{ fontWeight: 700, flex: 1 }}>
                                                    {title}
                                                </Typography>
                                                {/* Clip count badges */}
                                                <Box sx={{ display: 'flex', gap: 0.75 }}>
                                                    {approvedCount > 0 && (
                                                        <Chip
                                                            icon={<CheckCircle sx={{ fontSize: '12px !important' }} />}
                                                            label={`${approvedCount} approved`}
                                                            size="small"
                                                            color="success"
                                                            variant="outlined"
                                                            sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600 }}
                                                        />
                                                    )}
                                                    {pendingCount > 0 && (
                                                        <Chip
                                                            icon={<HourglassEmpty sx={{ fontSize: '12px !important' }} />}
                                                            label={`${pendingCount} pending`}
                                                            size="small"
                                                            variant="outlined"
                                                            sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600, color: 'text.secondary', borderColor: 'divider' }}
                                                        />
                                                    )}
                                                    <Chip
                                                        label={`${groupClips.length} total`}
                                                        size="small"
                                                        variant="filled"
                                                        sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600, bgcolor: 'action.hover', color: 'text.secondary' }}
                                                    />
                                                </Box>
                                            </AccordionSummary>

                                            <AccordionDetails sx={{ p: 2.5, pt: 1.5, bgcolor: '#fff' }}>
                                                <Grid container spacing={2}>
                                                    {groupClips.map((clip) => (
                                                        <Grid item xs={12} sm={6} lg={4} key={clip.id}>
                                                            <ClipCard
                                                                clip={clip}
                                                                onApprove={handleApprove}
                                                                onReject={handleReject}
                                                                onFeedback={(c) => setFeedbackClip(c)}
                                                                onGenerate={handleGenerate}
                                                            />
                                                        </Grid>
                                                    ))}
                                                </Grid>
                                            </AccordionDetails>
                                        </Accordion>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </Box>
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
