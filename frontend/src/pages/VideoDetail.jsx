import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box, Typography, Grid, Button, Skeleton, Chip, IconButton, Divider, Alert,
} from '@mui/material';
import { ArrowBack, Movie, Description, Info } from '@mui/icons-material';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import client from '../api/client';
import ClipCard from '../components/ClipCard';
import FeedbackModal from '../components/FeedbackModal';

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

export default function VideoDetail() {
    const { videoId } = useParams();
    const navigate = useNavigate();
    const [video, setVideo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [transcribing, setTranscribing] = useState(false);
    const [feedbackClip, setFeedbackClip] = useState(null);

    const fetchVideo = async () => {
        try {
            const res = await client.get(`/api/videos/${videoId}`);
            setVideo(res.data);
        } catch {
            toast.error('Failed to load video');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchVideo(); }, [videoId]);

    const handleApprove = async (clipId) => {
        try {
            await client.patch(`/api/clips/${clipId}/approve`);
            toast.success('Clip approved!');
            fetchVideo();
        } catch {
            toast.error('Failed to approve');
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
            fetchVideo();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Redo failed');
        }
    };

    const handleReject = async (clipId) => {
        try {
            await client.delete(`/api/clips/${clipId}/reject`);
            toast('Clip removed', { icon: '👋' });
            fetchVideo();
        } catch {
            toast.error('Failed to reject');
        }
    };

    const handleGenerate = async (clipId) => {
        try {
            await client.post(`/api/clips/${clipId}/generate`);
            toast.success('Clip generated!');
            fetchVideo();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Generation failed');
        }
    };

    const handleTranscribe = async () => {
        setTranscribing(true);
        try {
            await client.post(`/api/videos/${videoId}/transcribe`);
            toast.success('Transcript generated!');
            fetchVideo();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Transcription failed');
        } finally {
            setTranscribing(false);
        }
    };

    const handleAnalyze = async () => {
        setLoading(true);
        try {
            await client.post(`/api/analyze/${videoId}`);
            toast.success('Analysis complete!');
            fetchVideo();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Analysis failed');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
                <Skeleton variant="text" width={300} height={40} />
                <Skeleton variant="rounded" height={200} sx={{ mt: 3, borderRadius: 4 }} />
            </Box>
        );
    }

    if (!video) {
        return (
            <Box sx={{ p: 4, textAlign: 'center', mt: 4 }}>
                <Typography variant="h6" color="text.secondary">Video not found</Typography>
                <Button onClick={() => navigate('/files')} sx={{ mt: 2 }}>Back to Files</Button>
            </Box>
        );
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1280, mx: 'auto' }}>
                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                    <motion.div whileTap={{ scale: 0.9 }}>
                        <IconButton onClick={() => navigate('/files')}
                            sx={{ bgcolor: '#fff', border: '1px solid', borderColor: 'divider', '&:hover': { bgcolor: '#f5f7fa' } }}
                        >
                            <ArrowBack fontSize="small" />
                        </IconButton>
                    </motion.div>
                    <Typography variant="h4" sx={{ flex: 1, fontSize: { xs: '1.5rem', md: '2rem' } }}>
                        {video.title}
                    </Typography>
                    <Chip
                        label={video.status}
                        color={video.status === 'clipped' ? 'success' : video.status === 'failed' ? 'error' : 'warning'}
                        sx={{ fontWeight: 600, textTransform: 'capitalize', px: 1, height: 32 }}
                    />
                </Box>

                {/* Meta */}
                <Box sx={{ display: 'flex', gap: 3, ml: { xs: 0, sm: 7 }, mb: 5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        <Movie sx={{ fontSize: 18, color: 'primary.main' }} />
                        <Typography variant="body2" color="text.secondary" fontWeight={500}>Video file</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        <Description sx={{ fontSize: 18, color: 'secondary.main' }} />
                        {(video.transcript_text || video.drive_transcript_id) ? (
                            <Typography variant="body2" color="text.secondary" fontWeight={500}>Transcript available</Typography>
                        ) : (
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={handleTranscribe}
                                disabled={transcribing}
                                sx={{ borderRadius: 2, textTransform: 'none', py: 0 }}
                            >
                                {transcribing ? 'Generating...' : 'Generate Transcript'}
                            </Button>
                        )}
                    </Box>
                </Box>

                {/* Transcript recommendation */}
                {(!video.transcript_text && !video.drive_transcript_id) && (
                    <Alert
                        severity="info"
                        icon={<Info sx={{ fontSize: 20 }} />}
                        sx={{
                            mb: 3, borderRadius: 2.5,
                            bgcolor: 'rgba(26,58,107,0.06)',
                            border: '1px solid rgba(26,58,107,0.12)',
                            '& .MuiAlert-message': { fontSize: '0.85rem' },
                        }}
                    >
                        <strong>Tip:</strong> For faster results, place a pre-made transcript file
                        (e.g., <code>transcript.txt</code>, <code>transcript.srt</code>) alongside your video.
                        Whisper AI transcription is available as a fallback but may be slower.
                    </Alert>
                )}

                <Divider sx={{ mb: 4, opacity: 0.6 }} />

                {/* Clips */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                    <Typography variant="h5">
                        Clips <Typography component="span" color="text.secondary" fontWeight={500}>({video.clips?.length || 0})</Typography>
                    </Typography>
                </Box>

                {video.clips?.length ? (
                    <motion.div variants={stagger} initial="hidden" animate="show">
                        <Grid container spacing={2.5}>
                            {video.clips.map((clip) => (
                                <Grid key={clip.id} item xs={12} sm={6} lg={4}>
                                    <motion.div variants={fadeUp} style={{ height: '100%' }}>
                                        <ClipCard
                                            clip={clip}
                                            onApprove={handleApprove}
                                            onReject={handleReject}
                                            onFeedback={(c) => setFeedbackClip(c)}
                                            onGenerate={handleGenerate}
                                        />
                                    </motion.div>
                                </Grid>
                            ))}
                        </Grid>
                    </motion.div>
                ) : (
                    <Box sx={{ textAlign: 'center', py: 8, bgcolor: '#fff', borderRadius: 4, border: '1px dashed', borderColor: 'divider' }}>
                        <Typography color="text.secondary" sx={{ mb: 2 }}>
                            No clips generated yet.
                        </Typography>
                        <Button variant="outlined" onClick={() => navigate('/files')}>
                            Back to Files
                        </Button>

                        <Box sx={{ mt: 2 }}>
                            {(!video.transcript_text && !video.drive_transcript_id) ? (
                                <Button
                                    variant="contained"
                                    onClick={handleTranscribe}
                                    disabled={transcribing}
                                >
                                    {transcribing ? 'Generating Transcript...' : 'Generate Transcript to Start'}
                                </Button>
                            ) : (
                                <Button
                                    variant="contained"
                                    onClick={handleAnalyze}
                                    disabled={loading}
                                >
                                    {loading ? 'Analyzing...' : 'Analyze Video'}
                                </Button>
                            )}
                        </Box>
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
