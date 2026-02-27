import {
    Card, CardContent, Box, Typography, Chip, Button,
    LinearProgress, CircularProgress, Tooltip, Divider,
} from '@mui/material';
import {
    AccessTime, Star, ThumbUp, ThumbDown, Replay, PlayArrow,
    AutoAwesome, Download, CheckCircle,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useState } from 'react';

export default function ClipCard({ clip, onApprove, onReject, onFeedback, onGenerate }) {
    const [generating, setGenerating] = useState(false);
    const [rejecting, setRejecting] = useState(false);

    const clipFilename = clip.file_path
        ? clip.file_path.replace(/\\/g, '/').split('/').pop()
        : null;

    // Prevent double slashing (e.g., //clips/...) which breaks the player
    const baseApiUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
    const videoUrl = clipFilename
        ? `${baseApiUrl}/clips/${clipFilename}`
        : '';
    const isSuggestion = !clip.file_path;
    const isApproved = clip.is_approved === true;

    const handleGenerateClick = async () => {
        setGenerating(true);
        await onGenerate(clip.id);
        setGenerating(false);
    };

    const handleRejectClick = async () => {
        setRejecting(true);
        await onReject(clip.id);
        setRejecting(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            whileHover={{ y: -2 }}
            transition={{ duration: 0.25 }}
            style={{ height: '100%', width: '100%' }}
        >
            <Card
                variant="outlined"
                sx={{
                    borderRadius: 3,
                    height: '100%',
                    borderColor: isApproved
                        ? '#16a34a'
                        : isSuggestion
                            ? 'rgba(198,151,95,0.35)'
                            : 'divider',
                    borderStyle: isSuggestion ? 'dashed' : 'solid',
                    borderWidth: isApproved ? 2 : 1,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'border-color 0.25s ease',
                }}
            >
                {/* Score bar */}
                <LinearProgress
                    variant="determinate"
                    value={(clip.virality_score || 0) * 10}
                    sx={{
                        height: 3,
                        bgcolor: 'rgba(198,151,95,0.15)',
                        '& .MuiLinearProgress-bar': { bgcolor: 'secondary.main' },
                    }}
                />

                {/* Video / Placeholder — fixed height */}
                <Box
                    sx={{
                        bgcolor: '#0a0a0a',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        aspectRatio: '16 / 9',
                        width: '100%',
                        flexShrink: 0,
                        overflow: 'hidden',
                    }}
                >
                    {videoUrl ? (
                        <video
                            controls
                            src={videoUrl}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                    ) : (
                        <Box sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
                            <Box
                                sx={{
                                    width: 48, height: 48, borderRadius: '50%',
                                    bgcolor: 'rgba(198,151,95,0.15)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}
                            >
                                <AutoAwesome sx={{ fontSize: 24, color: 'secondary.main' }} />
                            </Box>
                            <Box>
                                <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 600 }}>
                                    AI Suggestion
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)' }}>
                                    Click "Generate" to create this clip
                                </Typography>
                            </Box>
                        </Box>
                    )}
                </Box>

                {/* Info */}
                <CardContent sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>

                    {/* Title + score badge */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                        <Typography variant="subtitle1" sx={{
                            fontWeight: 700, lineHeight: 1.25, letterSpacing: '-0.01em', flex: 1,
                            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                            overflow: 'hidden', wordBreak: 'break-word',
                        }}>
                            {clip.suggested_title || 'Untitled Clip'}
                        </Typography>
                        <Tooltip title="Virality score (0-10)" placement="top">
                            <Box sx={{
                                display: 'flex', alignItems: 'center', gap: 0.4,
                                bgcolor: '#fffbeb', px: 0.9, py: 0.25, borderRadius: 1.5,
                                border: '1px solid #fcd34d', flexShrink: 0,
                            }}>
                                <Star sx={{ color: 'secondary.main', fontSize: 13 }} />
                                <Typography sx={{ fontWeight: 700, fontSize: '0.8rem', color: 'secondary.dark' }}>
                                    {(clip.virality_score || 0).toFixed(1)}
                                </Typography>
                            </Box>
                        </Tooltip>
                    </Box>

                    {/* Chips row */}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: 'action.hover', px: 1, py: 0.3, borderRadius: 1 }}>
                            <AccessTime sx={{ fontSize: 13, color: 'text.secondary' }} />
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                                {clip.start_time} – {clip.end_time}
                            </Typography>
                        </Box>
                        {clip.clip_index && (
                            <Chip label={`Clip #${clip.clip_index}`} size="small" variant="outlined"
                                sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600, borderRadius: 1 }} />
                        )}
                        {isSuggestion && (
                            <Chip label="Suggestion" size="small" color="secondary" variant="outlined"
                                sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600, borderRadius: 1 }} />
                        )}
                        {isApproved && (
                            <Chip icon={<CheckCircle sx={{ fontSize: '14px !important' }} />} label="Approved"
                                size="small" color="success"
                                sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600, borderRadius: 1 }} />
                        )}
                    </Box>

                    {/* Filename */}
                    {!isSuggestion && clipFilename && (
                        <Typography variant="caption" sx={{
                            color: 'text.disabled', fontFamily: 'monospace',
                            bgcolor: 'action.hover', px: 1, py: 0.3, borderRadius: 1,
                            display: 'block', overflow: 'hidden', textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap', wordBreak: 'break-all', maxWidth: '100%',
                        }}>
                            {clipFilename}
                        </Typography>
                    )}

                    {/* AI Reasoning */}
                    {clip.ai_reason && (
                        <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#f8fafc', border: '1px solid', borderColor: 'divider' }}>
                            <Typography variant="caption" sx={{
                                color: 'text.secondary', fontWeight: 700, display: 'block', mb: 0.5,
                                textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.65rem',
                            }}>
                                AI Insight
                            </Typography>
                            <Typography variant="body2" sx={{
                                color: 'text.primary', lineHeight: 1.55, fontSize: '0.83rem',
                                display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                            }}>
                                {clip.ai_reason}
                            </Typography>
                        </Box>
                    )}

                    <Divider sx={{ my: 0.5 }} />

                    {/* Action Buttons */}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 'auto' }}>
                        {isSuggestion ? (
                            /* Suggestion: Generate + Reject + Redo */
                            <>
                                <Button
                                    variant="contained" fullWidth disableElevation
                                    onClick={handleGenerateClick} disabled={generating}
                                    startIcon={generating ? <CircularProgress size={16} color="inherit" /> : <PlayArrow />}
                                    sx={{
                                        bgcolor: 'secondary.main', color: '#fff',
                                        '&:hover': { bgcolor: 'secondary.dark' },
                                        borderRadius: 1.5, textTransform: 'none', fontWeight: 600, fontSize: '0.85rem',
                                    }}
                                >
                                    {generating ? 'Generating…' : 'Generate'}
                                </Button>
                                <Tooltip title="Reject — permanently removes this suggestion">
                                    <Button variant="outlined" onClick={handleRejectClick} disabled={rejecting}
                                        sx={{
                                            borderColor: 'rgba(192,57,43,0.3)', color: '#C0392B',
                                            '&:hover': { borderColor: '#C0392B', bgcolor: 'rgba(192,57,43,0.04)' },
                                            borderRadius: 1.5, minWidth: 44, px: 1.5,
                                        }}>
                                        <ThumbDown fontSize="small" />
                                    </Button>
                                </Tooltip>
                                <Tooltip title="Give feedback for a different suggestion">
                                    <Button variant="outlined" onClick={() => onFeedback(clip)}
                                        sx={{
                                            borderColor: 'divider', color: 'text.secondary',
                                            '&:hover': { borderColor: 'text.primary', bgcolor: 'transparent' },
                                            borderRadius: 1.5, minWidth: 44, px: 1.5,
                                        }}>
                                        <Replay fontSize="small" />
                                    </Button>
                                </Tooltip>
                            </>
                        ) : (
                            /* Generated clip: Approve/Download + Reject + Redo */
                            <>
                                {!isApproved && (
                                    <Button variant="contained" fullWidth disableElevation
                                        startIcon={<ThumbUp sx={{ fontSize: 16 }} />}
                                        onClick={() => onApprove(clip.id)}
                                        sx={{
                                            bgcolor: '#16a34a', color: '#fff', '&:hover': { bgcolor: '#15803d' },
                                            borderRadius: 1.5, textTransform: 'none', fontWeight: 600, fontSize: '0.85rem',
                                        }}>
                                        Approve
                                    </Button>
                                )}
                                {isApproved && (
                                    <Button variant="outlined" fullWidth component="a"
                                        href={videoUrl} download={clipFilename}
                                        startIcon={<Download sx={{ fontSize: 16 }} />}
                                        sx={{
                                            borderColor: '#16a34a', color: '#16a34a',
                                            '&:hover': { bgcolor: 'rgba(22,163,74,0.06)' },
                                            borderRadius: 1.5, textTransform: 'none', fontWeight: 600, fontSize: '0.85rem',
                                        }}>
                                        Download
                                    </Button>
                                )}
                                {!isApproved && (
                                    <Tooltip title="Reject — permanently removes this clip">
                                        <Button variant="outlined" onClick={handleRejectClick} disabled={rejecting}
                                            sx={{
                                                borderColor: 'rgba(192,57,43,0.3)', color: '#C0392B',
                                                '&:hover': { borderColor: '#C0392B', bgcolor: 'rgba(192,57,43,0.04)' },
                                                borderRadius: 1.5, minWidth: 44, px: 1.5,
                                            }}>
                                            <ThumbDown fontSize="small" />
                                        </Button>
                                    </Tooltip>
                                )}
                                <Tooltip title="Give feedback to get a different clip">
                                    <Button variant="outlined" onClick={() => onFeedback(clip)}
                                        sx={{
                                            borderColor: 'divider', color: 'text.secondary',
                                            '&:hover': { borderColor: 'text.primary', bgcolor: 'transparent' },
                                            borderRadius: 1.5, minWidth: 44, px: 1.5,
                                        }}>
                                        <Replay fontSize="small" />
                                    </Button>
                                </Tooltip>
                            </>
                        )}
                    </Box>
                </CardContent>
            </Card>
        </motion.div>
    );
}
