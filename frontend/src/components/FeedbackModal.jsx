import { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, Typography, Box, IconButton,
    LinearProgress, Chip,
} from '@mui/material';
import { Close, Send, AutoAwesome, Lightbulb } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

const SUGGESTIONS = [
    'Make it shorter and punchier',
    'Find something funnier',
    'Try a more emotional moment',
    'I want a stronger opening hook',
    'Pick something from a different topic',
];

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function FeedbackModal({ open, onClose, clip, onSubmit }) {
    const [feedback, setFeedback] = useState('');
    const [loading, setLoading] = useState(false);
    const [statusText, setStatusText] = useState('');

    const handleSubmit = async () => {
        if (!feedback.trim()) return;
        setLoading(true);
        setStatusText('Connecting…');

        try {
            const token = localStorage.getItem('token');

            // Use fetch + SSE for streaming progress
            const response = await fetch(`${API_URL}/api/clips/${clip.id}/feedback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'text/event-stream',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ user_feedback: feedback }),
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.detail || `Request failed (${response.status})`);
            }

            // Parse SSE stream
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let resultData = null;
            let errorMsg = null;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });

                // Process complete SSE messages (double newline separated)
                const messages = buffer.split('\n\n');
                buffer = messages.pop(); // Keep incomplete message in buffer

                for (const msg of messages) {
                    if (!msg.trim()) continue;
                    const lines = msg.split('\n');
                    let event = '';
                    let data = '';
                    for (const line of lines) {
                        if (line.startsWith('event: ')) event = line.slice(7);
                        if (line.startsWith('data: ')) data = line.slice(6);
                    }

                    if (event === 'status') {
                        setStatusText(data);
                    } else if (event === 'result') {
                        resultData = JSON.parse(data);
                    } else if (event === 'error') {
                        errorMsg = data;
                    }
                }
            }

            if (errorMsg) {
                throw new Error(errorMsg);
            }

            // Success — refresh parent data first, then close modal
            setFeedback('');
            setStatusText('');
            // Trigger refresh in parent BEFORE closing (so feedbackClip is still valid)
            if (onSubmit) await onSubmit(clip.id, null);
            onClose();

        } catch (err) {
            setStatusText(`Error: ${err.message}`);
            // Keep modal open on error so user can retry
            setTimeout(() => setStatusText(''), 4000);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        // Cmd/Ctrl+Enter submits
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleSubmit();
    };

    return (
        <AnimatePresence>
            {open && (
                <Dialog
                    open={open}
                    onClose={!loading ? onClose : undefined}
                    maxWidth="sm"
                    fullWidth
                    PaperProps={{
                        component: motion.div,
                        initial: { opacity: 0, y: 20, scale: 0.97 },
                        animate: { opacity: 1, y: 0, scale: 1 },
                        exit: { opacity: 0, y: 20, scale: 0.97 },
                        transition: { duration: 0.22 },
                        sx: { borderRadius: 4, overflow: 'hidden' },
                    }}
                >
                    {/* Loading bar at top */}
                    {loading && (
                        <LinearProgress
                            sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                zIndex: 10,
                                '& .MuiLinearProgress-bar': {
                                    background: 'linear-gradient(135deg,#C6975F,#D4A843)',
                                },
                            }}
                        />
                    )}

                    <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1, pt: loading ? 2.5 : 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AutoAwesome sx={{ fontSize: 20, color: 'secondary.main' }} />
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                Redo Clip
                            </Typography>
                        </Box>
                        <IconButton onClick={onClose} size="small" disabled={loading}>
                            <Close />
                        </IconButton>
                    </DialogTitle>

                    <DialogContent sx={{ pt: 0 }}>
                        {/* Live status text */}
                        {loading && statusText && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                transition={{ duration: 0.2 }}
                            >
                                <Box
                                    sx={{
                                        mb: 2,
                                        py: 1,
                                        px: 1.5,
                                        borderRadius: 2,
                                        bgcolor: statusText.startsWith('Error')
                                            ? 'rgba(192,57,43,0.08)'
                                            : 'rgba(198,151,95,0.08)',
                                        border: '1px solid',
                                        borderColor: statusText.startsWith('Error')
                                            ? 'rgba(192,57,43,0.2)'
                                            : 'rgba(198,151,95,0.2)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                    }}
                                >
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                    >
                                        <AutoAwesome sx={{ fontSize: 14, color: 'secondary.main' }} />
                                    </motion.div>
                                    <Typography variant="body2" sx={{
                                        fontWeight: 600, fontSize: '0.82rem',
                                        color: statusText.startsWith('Error') ? '#C0392B' : 'secondary.dark',
                                    }}>
                                        {statusText}
                                    </Typography>
                                </Box>
                            </motion.div>
                        )}

                        {/* Current clip context */}
                        {clip && (
                            <Box
                                sx={{
                                    p: 1.5,
                                    mb: 2,
                                    borderRadius: 2.5,
                                    bgcolor: 'rgba(198,151,95,0.08)',
                                    border: '1px solid',
                                    borderColor: 'rgba(198,151,95,0.25)',
                                }}
                            >
                                <Typography variant="caption" sx={{ fontWeight: 700, color: 'secondary.dark', display: 'block', mb: 0.25 }}>
                                    Current: {clip.start_time} → {clip.end_time}
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.82rem', lineHeight: 1.4 }}>
                                    {clip.suggested_title || clip.ai_reason}
                                </Typography>
                            </Box>
                        )}

                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
                            Tell the AI what you'd like to change — it'll pick a completely different segment.
                        </Typography>

                        {/* Quick suggestions */}
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mr: 0.5 }}>
                                <Lightbulb sx={{ fontSize: 13, color: 'text.disabled' }} />
                                <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.7rem' }}>
                                    Quick picks:
                                </Typography>
                            </Box>
                            {SUGGESTIONS.map((s) => (
                                <Chip
                                    key={s}
                                    label={s}
                                    size="small"
                                    variant="outlined"
                                    onClick={() => setFeedback(s)}
                                    disabled={loading}
                                    sx={{
                                        height: 24,
                                        fontSize: '0.72rem',
                                        cursor: 'pointer',
                                        borderRadius: 1.5,
                                        '&:hover': { bgcolor: 'action.hover' },
                                    }}
                                />
                            ))}
                        </Box>

                        <TextField
                            multiline
                            rows={3}
                            fullWidth
                            placeholder="e.g. Too long, I want something funnier and shorter…"
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={loading}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2.5,
                                    fontSize: '0.9rem',
                                },
                            }}
                        />
                        <Typography variant="caption" sx={{ color: 'text.disabled', mt: 0.5, display: 'block' }}>
                            Tip: Ctrl+Enter to submit
                        </Typography>
                    </DialogContent>

                    <DialogActions sx={{ px: 3, pb: 2.5 }}>
                        <Button onClick={onClose} disabled={loading} sx={{ color: 'text.secondary' }}>
                            Cancel
                        </Button>
                        <motion.div whileTap={{ scale: 0.97 }}>
                            <Button
                                onClick={handleSubmit}
                                variant="contained"
                                disabled={!feedback.trim() || loading}
                                endIcon={loading ? null : <Send />}
                                disableElevation
                                sx={{
                                    background: 'linear-gradient(135deg, #C6975F, #D4A843)',
                                    '&:hover': { background: 'linear-gradient(135deg, #A67B3D, #C6975F)' },
                                    '&:disabled': { opacity: 0.6 },
                                    borderRadius: 2,
                                    fontWeight: 600,
                                    px: 2.5,
                                }}
                            >
                                {loading ? 'Analysing…' : 'Submit Feedback'}
                            </Button>
                        </motion.div>
                    </DialogActions>
                </Dialog>
            )}
        </AnimatePresence>
    );
}
