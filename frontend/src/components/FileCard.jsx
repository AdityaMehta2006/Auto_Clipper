import { Card, CardContent, Box, Typography, Chip, Button, LinearProgress, Switch, FormControlLabel } from '@mui/material';
import { Movie, Description, CheckCircle, HourglassEmpty, Error as ErrorIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';

const statusConfig = {
    pending: { label: 'Pending', color: 'warning', icon: <HourglassEmpty sx={{ fontSize: 16 }} /> },
    clipped: { label: 'Clipped', color: 'success', icon: <CheckCircle sx={{ fontSize: 16 }} /> },
    failed: { label: 'Failed', color: 'error', icon: <ErrorIcon sx={{ fontSize: 16 }} /> },
};

import { useState } from 'react';

// ...

export default function FileCard({ video, onAnalyze, onTranscribe, onViewClips, analyzing, transcribing }) {
    const status = statusConfig[video.status] || statusConfig.pending;
    const [mode, setMode] = useState('standard');

    return (
        <motion.div
            whileHover={{ y: -4, boxShadow: '0 8px 24px rgba(27,58,92,0.12)' }}
            whileTap={{ scale: 0.99 }}
            layout
        >
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* Header strip */}
                <Box
                    sx={{
                        height: 6,
                        bgcolor: video.status === 'clipped' ? 'success.main'
                            : video.status === 'failed' ? 'error.main'
                                : 'secondary.main',
                    }}
                />
                <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 2.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'primary.dark', lineHeight: 1.3 }}>
                            {video.title}
                        </Typography>
                        <motion.div
                            animate={video.status === 'pending' ? { scale: [1, 1.06, 1] } : {}}
                            transition={{ repeat: Infinity, duration: 2 }}
                        >
                            <Chip
                                icon={status.icon}
                                label={status.label}
                                color={status.color}
                                size="small"
                                variant="outlined"
                                sx={{ fontWeight: 600 }}
                            />
                        </motion.div>
                    </Box>

                    {/* File indicators */}
                    <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Movie sx={{ fontSize: 16, color: 'primary.main' }} />
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Video</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Description sx={{ fontSize: 16, color: (video.transcript_text || video.drive_transcript_id) ? 'secondary.main' : 'text.disabled' }} />
                            <Typography variant="caption" sx={{ color: (video.transcript_text || video.drive_transcript_id) ? 'text.secondary' : 'text.disabled' }}>Transcript</Typography>
                        </Box>
                    </Box>

                    <Box sx={{ mt: 'auto', pt: 1 }}>
                        {video.status === 'pending' && (
                            analyzing ? (
                                <Box sx={{ width: '100%', mt: 1 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                        <Typography variant="caption" sx={{ color: 'secondary.main', fontWeight: 600 }}>
                                            Analyzing...
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                            Est. 1-2 min
                                        </Typography>
                                    </Box>
                                    <LinearProgress
                                        sx={{
                                            height: 6,
                                            borderRadius: 3,
                                            bgcolor: 'rgba(198, 151, 95, 0.2)',
                                            '& .MuiLinearProgress-bar': { bgcolor: 'secondary.main' }
                                        }}
                                    />
                                </Box>
                            ) : (
                                // Logic: Only show Analyze if transcript exists (text or ID)
                                (video.transcript_text || video.drive_transcript_id) ? (
                                    <motion.div whileTap={{ scale: 0.98 }}>
                                        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <Box>
                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Ready for Analysis</Typography>
                                                <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600, fontSize: '0.65rem' }}>TRANSCRIPT DETECTED</Typography>
                                            </Box>
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        size="small"
                                                        checked={mode === 'short-form'}
                                                        onChange={(e) => setMode(e.target.checked ? 'short-form' : 'standard')}
                                                    />
                                                }
                                                label={<Typography variant="caption" sx={{ fontWeight: 600, color: mode === 'short-form' ? 'secondary.main' : 'text.disabled' }}>Viral</Typography>}
                                                labelPlacement="start"
                                                sx={{ m: 0 }}
                                            />
                                        </Box>
                                        <Button
                                            variant="contained"
                                            fullWidth
                                            disableElevation
                                            onClick={() => onAnalyze(video.id, mode)}
                                            sx={{
                                                bgcolor: mode === 'short-form' ? 'secondary.main' : '#0F2444',
                                                color: mode === 'short-form' ? '#000' : '#fff',
                                                '&:hover': { bgcolor: mode === 'short-form' ? 'secondary.dark' : '#1a3b6e' },
                                                py: 1,
                                                borderRadius: 2,
                                                textTransform: 'none',
                                                fontWeight: 600,
                                            }}
                                        >
                                            Analyze {mode === 'short-form' ? 'Viral' : 'Video'}
                                        </Button>
                                    </motion.div>
                                ) : (
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5, textAlign: 'center' }}>
                                            Transcript required to start analysis
                                        </Typography>
                                        <Button
                                            variant="outlined"
                                            fullWidth
                                            disabled={transcribing}
                                            onClick={() => onTranscribe(video.id)}
                                            sx={{
                                                borderStyle: 'dashed',
                                                color: 'primary.main',
                                                borderColor: 'primary.main',
                                                '&:hover': { bgcolor: 'rgba(15, 36, 68, 0.04)', borderStyle: 'solid' },
                                                fontWeight: 600
                                            }}
                                        >
                                            {transcribing ? 'Generating...' : 'Step 1: Generate Transcript'}
                                        </Button>
                                    </Box>
                                )
                            )
                        )}
                        {video.status === 'clipped' && (
                            <motion.div whileTap={{ scale: 0.97 }}>
                                <Button
                                    variant="outlined"
                                    fullWidth
                                    onClick={() => onViewClips(video.id)}
                                    sx={{ borderColor: 'primary.main', color: 'primary.main' }}
                                >
                                    View Clips
                                </Button>
                            </motion.div>
                        )}
                        {video.status === 'failed' && (
                            <motion.div whileTap={{ scale: 0.97 }}>
                                <Button
                                    variant="outlined"
                                    fullWidth
                                    color="error"
                                    onClick={() => onAnalyze(video.id)}
                                    disabled={analyzing}
                                >
                                    Retry
                                </Button>
                            </motion.div>
                        )}
                    </Box>
                </CardContent>
            </Card>
        </motion.div>
    );
}
