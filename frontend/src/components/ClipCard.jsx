import { Card, CardContent, Box, Typography, Chip, Button, LinearProgress, Grid } from '@mui/material';
import { AccessTime, Star, ThumbUp, Replay } from '@mui/icons-material';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

export default function ClipCard({ clip, onApprove, onFeedback }) {
    const videoUrl = clip.file_path
        ? `${import.meta.env.VITE_API_URL}/clips/${clip.file_path.split(/[/\\]/).pop()}`
        : '';

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -3 }}
        >
            <Card variant="outlined" sx={{ borderRadius: 3, borderColor: 'divider', overflow: 'hidden', bgcolor: '#fff' }}>
                <Grid container>
                    {/* Video Player Section */}
                    <Grid item xs={12} md={7} sx={{ bgcolor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {videoUrl ? (
                            <video
                                controls
                                src={videoUrl}
                                style={{ width: '100%', maxHeight: '400px', display: 'block' }}
                            />
                        ) : (
                            <Box sx={{ p: 4, color: '#fff' }}>Video not available</Box>
                        )}
                    </Grid>

                    {/* Info Section */}
                    <Grid item xs={12} md={5} sx={{ display: 'flex', flexDirection: 'column' }}>
                        {/* Score bar */}
                        <LinearProgress
                            variant="determinate"
                            value={(clip.virality_score || 0) * 10}
                            sx={{
                                height: 4,
                                bgcolor: 'rgba(198, 151, 95, 0.2)',
                                '& .MuiLinearProgress-bar': {
                                    bgcolor: 'secondary.main',
                                },
                            }}
                        />
                        <CardContent sx={{ p: 2.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1.5 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2, mb: 0.5, letterSpacing: '-0.01em' }}>
                                    {clip.suggested_title || 'Untitled Clip'}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: '#fffbeb', px: 1, py: 0.25, borderRadius: 1.5, border: '1px solid', borderColor: '#fcd34d' }}>
                                    <Star sx={{ color: 'secondary.main', fontSize: 14 }} />
                                    <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: 'secondary.dark' }}>
                                        {(clip.virality_score || 0).toFixed(1)}
                                    </Typography>
                                </Box>
                            </Box>

                            {/* Time range */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 2.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: 'action.hover', px: 1, py: 0.25, borderRadius: 1 }}>
                                    <AccessTime sx={{ fontSize: 14, color: 'text.secondary' }} />
                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                                        {clip.start_time} - {clip.end_time}
                                    </Typography>
                                </Box>
                                {clip.is_approved !== null && (
                                    <Chip
                                        label={clip.is_approved ? 'Approved' : 'Rejected'}
                                        color={clip.is_approved ? 'success' : 'default'}
                                        size="small"
                                        sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600 }}
                                    />
                                )}
                            </Box>

                            {/* AI Reasoning */}
                            {clip.ai_reason && (
                                <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#f8fafc', border: '1px solid', borderColor: 'divider', mb: 2.5, flex: 1 }}>
                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem' }}>
                                        AI Insight
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'text.primary', lineHeight: 1.6, fontSize: '0.875rem' }}>
                                        {clip.ai_reason}
                                    </Typography>
                                </Box>
                            )}

                            {/* Actions */}
                            <Box sx={{ display: 'flex', gap: 1.5, mt: 'auto' }}>
                                {clip.is_approved !== true && (
                                    <Button
                                        variant="contained"
                                        fullWidth
                                        disableElevation
                                        startIcon={<ThumbUp sx={{ fontSize: 18 }} />}
                                        onClick={() => onApprove(clip.id)}
                                        sx={{
                                            bgcolor: '#16a34a',
                                            color: '#fff',
                                            '&:hover': { bgcolor: '#15803d' },
                                            borderRadius: 1.5,
                                            textTransform: 'none',
                                            fontWeight: 600,
                                        }}
                                    >
                                        Approve
                                    </Button>
                                )}
                                <Button
                                    variant="outlined"
                                    fullWidth
                                    startIcon={<Replay sx={{ fontSize: 18 }} />}
                                    onClick={() => onFeedback(clip)}
                                    sx={{
                                        borderColor: 'divider',
                                        color: 'text.primary',
                                        '&:hover': { borderColor: 'text.primary', bgcolor: 'transparent' },
                                        borderRadius: 1.5,
                                        textTransform: 'none',
                                        fontWeight: 600,
                                    }}
                                >
                                    Redo
                                </Button>
                            </Box>
                        </CardContent>
                    </Grid>
                </Grid>
            </Card>
        </motion.div>
    );
}
