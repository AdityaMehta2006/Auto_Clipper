import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Typography, Grid, Button, Skeleton, Chip, Alert,
} from '@mui/material';
import { Refresh, CloudOff, CreateNewFolder } from '@mui/icons-material';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import FileCard from '../components/FileCard';
import StorageBrowserModal from '../components/StorageBrowserModal';

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

export default function FileBrowser() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [analyzingId, setAnalyzingId] = useState(null);
    const [importModalOpen, setImportModalOpen] = useState(false);

    const fetchVideos = async () => {
        setLoading(true);
        try {
            const res = await client.get('/api/videos');
            setVideos(res.data);
        } catch {
            toast.error('Failed to load videos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchVideos(); }, []);

    const handleAnalyze = async (videoId, mode = 'standard') => {
        setAnalyzingId(videoId);
        try {
            await client.post(`/api/analyze/${videoId}?mode=${mode}`);
            toast.success('Clip generated successfully!');
            fetchVideos();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Analysis failed');
        } finally {
            setAnalyzingId(null);
        }
    };

    const handleConnectDrive = async () => {
        try {
            const res = await client.get('/api/auth/google/connect');
            window.location.href = res.data.auth_url;
        } catch {
            toast.error('Failed to start Google OAuth');
        }
    };

    const handleImport = async (importData) => {
        try {
            await client.post('/api/videos/import', importData);
            toast.success('Folder imported successfully!');
            fetchVideos();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Import failed');
        }
    };

    const statusCounts = {
        pending: videos.filter((v) => v.status === 'pending').length,
        clipped: videos.filter((v) => v.status === 'clipped').length,
        failed: videos.filter((v) => v.status === 'failed').length,
    };

    const isDriveMode = user?.data_source === 'google_drive';
    const showConnectDrive = isDriveMode && !user?.has_google_token;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h4">Files</Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <motion.div whileTap={{ scale: 0.95 }}>
                            <Button
                                startIcon={<CreateNewFolder />}
                                onClick={() => setImportModalOpen(true)}
                                variant="contained"
                                size="small"
                                disabled={showConnectDrive}
                            >
                                Import Folder
                            </Button>
                        </motion.div>
                        <motion.div whileTap={{ scale: 0.95 }}>
                            <Button startIcon={<Refresh />} onClick={fetchVideos} variant="outlined" size="small">
                                Refresh
                            </Button>
                        </motion.div>
                    </Box>
                </Box>

                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                    Current Source: <Box component="span" fontWeight={600} color="primary.main">
                        {isDriveMode ? 'Google Drive' : 'Local Storage'}
                    </Box>
                </Typography>

                {/* Status legend */}
                <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
                    <Chip label={`${statusCounts.pending} Pending`} color="warning" variant="outlined" size="small" />
                    <Chip label={`${statusCounts.clipped} Clipped`} color="success" variant="outlined" size="small" />
                    <Chip label={`${statusCounts.failed} Failed`} color="error" variant="outlined" size="small" />
                </Box>

                {/* Drive not connected warning */}
                {showConnectDrive && (
                    <Alert
                        severity="warning"
                        sx={{ mb: 3, borderRadius: 3, alignItems: 'center' }}
                        action={
                            <Button color="inherit" size="small" variant="outlined" onClick={handleConnectDrive}
                                sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}
                            >
                                Connect Drive
                            </Button>
                        }
                    >
                        Connect Google Drive to import and analyze videos.
                    </Alert>
                )}

                {loading ? (
                    <Grid container spacing={2.5}>
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
                                <Skeleton variant="rounded" height={200} sx={{ borderRadius: 4 }} />
                            </Grid>
                        ))}
                    </Grid>
                ) : videos.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 10 }}>
                        <CloudOff sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }} />
                        <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>
                            No videos imported yet
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                            Click "Import Folder" to add videos from {isDriveMode ? 'Google Drive' : 'Local Storage'}
                        </Typography>
                    </Box>
                ) : (
                    <motion.div variants={stagger} initial="hidden" animate="show">
                        <Grid container spacing={2.5}>
                            {videos.map((video) => (
                                <Grid key={video.id} size={{ xs: 12, sm: 6, md: 4 }}>
                                    <motion.div variants={fadeUp}>
                                        <FileCard
                                            video={video}
                                            onAnalyze={handleAnalyze}
                                            onViewClips={(id) => navigate(`/videos/${id}`)}
                                            analyzing={analyzingId === video.id}
                                        />
                                    </motion.div>
                                </Grid>
                            ))}
                        </Grid>
                    </motion.div>
                )}
            </Box>

            <StorageBrowserModal
                open={importModalOpen}
                onClose={() => setImportModalOpen(false)}
                onImport={handleImport}
            />
        </motion.div>
    );
}
