import { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    List, ListItem, ListItemIcon, ListItemText, ListItemButton,
    Button, Typography, Box, CircularProgress, Breadcrumbs, Link
} from '@mui/material';
import { Folder, InsertDriveFile, ArrowBack, CheckCircle } from '@mui/icons-material';
import toast from 'react-hot-toast';
import client from '../api/client';

export default function StorageBrowserModal({ open, onClose, onImport }) {
    const [folders, setFolders] = useState([]);
    const [files, setFiles] = useState([]);
    const [currentFolder, setCurrentFolder] = useState(null); // null = root
    const [loading, setLoading] = useState(false);
    const [analyzingIds, setAnalyzingIds] = useState({ video: null, transcript: null });

    useEffect(() => {
        if (open) {
            loadRoot();
        } else {
            // Reset state on close
            setCurrentFolder(null);
            setFiles([]);
        }
    }, [open]);

    const loadRoot = async () => {
        setLoading(true);
        try {
            const res = await client.get('/api/files/folders');
            setFolders(res.data);
            setFiles([]);
            setCurrentFolder(null);
        } catch (err) {
            toast.error('Failed to load folders');
        } finally {
            setLoading(false);
        }
    };

    const loadFiles = async (folder) => {
        setLoading(true);
        setCurrentFolder(folder);
        try {
            const res = await client.get(`/api/files/folders/${folder.id}/files`);
            // Filter for video and transcript candidates
            const fileList = res.data;
            setFiles(fileList);

            // Auto-detect candidates
            const videoExtensions = ['.mp4', '.mkv', '.mov', '.avi', '.webm', '.ts'];
            const transcriptExtensions = ['.srt', '.vtt', '.txt', '.json'];

            const video = fileList.find(f =>
                f.mime_type.startsWith('video/') ||
                videoExtensions.some(ext => f.name.toLowerCase().endsWith(ext))
            );
            const transcript = fileList.find(f =>
                transcriptExtensions.some(ext => f.name.toLowerCase().endsWith(ext)) ||
                f.name.toLowerCase().includes('transcript')
            );

            setAnalyzingIds({
                video: video?.id || null,
                transcript: transcript?.id || null
            });

        } catch (err) {
            toast.error('Failed to load files');
            setCurrentFolder(null); // Go back on error
        } finally {
            setLoading(false);
        }
    };

    const handleImport = () => {
        if (!analyzingIds.video) {
            toast.error('Need a video file');
            return;
        }

        // Pass back the details for import
        onImport({
            drive_folder_id: currentFolder.id,
            title: currentFolder.name,
            drive_video_id: analyzingIds.video,
            drive_transcript_id: analyzingIds.transcript
        });
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, height: '60vh' } }}>
            <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {currentFolder && (
                        <ListItemIcon sx={{ minWidth: 'auto', mr: 1, cursor: 'pointer' }} onClick={loadRoot}>
                            <ArrowBack />
                        </ListItemIcon>
                    )}
                    <Typography variant="h6" fontWeight={600}>
                        {currentFolder ? currentFolder.name : 'Select Folder to Import'}
                    </Typography>
                </Box>
            </DialogTitle>

            <DialogContent sx={{ p: 0 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                        <CircularProgress size={32} />
                    </Box>
                ) : (
                    <List>
                        {!currentFolder ? (
                            // Folder List
                            folders.length === 0 ? (
                                <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>No folders found</Box>
                            ) : (
                                folders.map((folder) => (
                                    <ListItemButton key={folder.id} onClick={() => loadFiles(folder)}>
                                        <ListItemIcon><Folder color="primary" /></ListItemIcon>
                                        <ListItemText primary={folder.name} secondary={`${folder.files?.length || 0} files detected`} />
                                    </ListItemButton>
                                ))
                            )
                        ) : (
                            // File List in Selected Folder
                            <>
                                <Box sx={{ p: 2, bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider' }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                                        DETECTED ASSETS
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                        {analyzingIds.video ? (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: '#e3f2fd', px: 1, py: 0.5, borderRadius: 1 }}>
                                                <CheckCircle sx={{ fontSize: 16, color: 'primary.main' }} />
                                                <Typography variant="caption" fontWeight={600}>Video Found</Typography>
                                            </Box>
                                        ) : (
                                            <Typography variant="caption" color="error">Missing Video</Typography>
                                        )}
                                        {analyzingIds.transcript ? (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: '#e8f5e9', px: 1, py: 0.5, borderRadius: 1 }}>
                                                <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
                                                <Typography variant="caption" fontWeight={600}>Transcript Found</Typography>
                                            </Box>
                                        ) : (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: '#fff3e0', px: 1, py: 0.5, borderRadius: 1 }}>
                                                <Typography variant="caption" color="warning.main" fontWeight={600}>Missing Transcript (Can Generate Later)</Typography>
                                            </Box>
                                        )}
                                    </Box>
                                </Box>
                                {files.map((file) => {
                                    const isVideo = file.id === analyzingIds.video;
                                    const isTranscript = file.id === analyzingIds.transcript;
                                    return (
                                        <ListItem key={file.id} dense>
                                            <ListItemIcon>
                                                <InsertDriveFile color={isVideo ? 'primary' : isTranscript ? 'success' : 'action'} />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={file.name}
                                                secondary={file.size ? `${(parseInt(file.size) / 1024 / 1024).toFixed(1)} MB` : ''}
                                                primaryTypographyProps={{ fontWeight: (isVideo || isTranscript) ? 600 : 400 }}
                                            />
                                        </ListItem>
                                    );
                                })}
                            </>
                        )}
                    </List>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                <Button onClick={onClose} color="inherit">Cancel</Button>
                <Button
                    variant="contained"
                    onClick={handleImport}
                    disabled={!currentFolder || !analyzingIds.video}
                >
                    Import Analysis
                </Button>
            </DialogActions>
        </Dialog>
    );
}
