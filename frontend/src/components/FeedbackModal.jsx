import { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, Typography, Box, IconButton,
} from '@mui/material';
import { Close, Send } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

export default function FeedbackModal({ open, onClose, clip, onSubmit }) {
    const [feedback, setFeedback] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!feedback.trim()) return;
        setLoading(true);
        try {
            await onSubmit(clip.id, feedback);
            setFeedback('');
            onClose();
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {open && (
                <Dialog
                    open={open}
                    onClose={onClose}
                    maxWidth="sm"
                    fullWidth
                    PaperProps={{
                        component: motion.div,
                        initial: { opacity: 0, y: 20, scale: 0.97 },
                        animate: { opacity: 1, y: 0, scale: 1 },
                        exit: { opacity: 0, y: 20, scale: 0.97 },
                        transition: { duration: 0.25 },
                        sx: { borderRadius: 4, overflow: 'visible' },
                    }}
                >
                    <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
                        <Typography variant="h6">Redo Clip</Typography>
                        <IconButton onClick={onClose} size="small">
                            <Close />
                        </IconButton>
                    </DialogTitle>

                    <DialogContent>
                        {clip && (
                            <Box
                                sx={{
                                    p: 2,
                                    mb: 2,
                                    borderRadius: 3,
                                    bgcolor: 'primary.light',
                                    border: '1px solid',
                                    borderColor: 'divider',
                                }}
                            >
                                <Typography variant="caption" sx={{ fontWeight: 600, color: 'primary.dark' }}>
                                    Current clip: {clip.start_time} → {clip.end_time}
                                </Typography>
                                <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
                                    {clip.ai_reason}
                                </Typography>
                            </Box>
                        )}

                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
                            Tell the AI what you'd like to change. It will pick a different segment based on your feedback.
                        </Typography>

                        <TextField
                            multiline
                            rows={3}
                            fullWidth
                            placeholder="e.g., Too long, I want something funnier and shorter..."
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 3,
                                },
                            }}
                        />
                    </DialogContent>

                    <DialogActions sx={{ px: 3, pb: 2.5 }}>
                        <Button onClick={onClose} sx={{ color: 'text.secondary' }}>
                            Cancel
                        </Button>
                        <motion.div whileTap={{ scale: 0.97 }}>
                            <Button
                                onClick={handleSubmit}
                                variant="contained"
                                disabled={!feedback.trim() || loading}
                                endIcon={<Send />}
                                sx={{
                                    background: 'linear-gradient(135deg, #C6975F, #D4A843)',
                                    '&:hover': { background: 'linear-gradient(135deg, #A67B3D, #C6975F)' },
                                }}
                            >
                                {loading ? 'Sending…' : 'Submit Feedback'}
                            </Button>
                        </motion.div>
                    </DialogActions>
                </Dialog>
            )}
        </AnimatePresence>
    );
}
