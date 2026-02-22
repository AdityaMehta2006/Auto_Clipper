import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        primary: {
            main: '#1A3A6B',
            dark: '#0F2444',
            light: '#E3EBF5',
            50: '#EEF2F9',
            100: '#D6E0F0',
            contrastText: '#FFFFFF',
        },
        secondary: {
            main: '#B8894F',
            dark: '#9A6E34',
            light: '#D4A843',
            contrastText: '#FFFFFF',
        },
        background: {
            default: '#F0F3F8',
            paper: '#FFFFFF',
        },
        text: {
            primary: '#1A2332',
            secondary: '#5A6B80',
        },
        success: { main: '#1D8348', contrastText: '#fff' },
        error: { main: '#C0392B', contrastText: '#fff' },
        warning: { main: '#D4A843', contrastText: '#fff' },
        divider: 'rgba(15, 36, 68, 0.08)',
    },
    typography: {
        fontFamily: '"Inter", sans-serif',
        h4: { fontWeight: 700, color: '#0F2444', letterSpacing: '-0.5px' },
        h5: { fontWeight: 600, color: '#0F2444', letterSpacing: '-0.3px' },
        h6: { fontWeight: 600, color: '#0F2444' },
        subtitle1: { fontWeight: 600, fontSize: '0.95rem' },
        body2: { fontSize: '0.875rem', lineHeight: 1.6 },
    },
    shape: { borderRadius: 14 },
    shadows: [
        'none',
        '0 1px 3px rgba(15,36,68,0.04)',
        '0 2px 8px rgba(15,36,68,0.06)',
        '0 4px 16px rgba(15,36,68,0.08)',
        '0 6px 24px rgba(15,36,68,0.10)',
        ...Array(20).fill('0 8px 32px rgba(15,36,68,0.12)'),
    ],
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: 10,
                    padding: '10px 22px',
                    fontSize: '0.875rem',
                },
                contained: {
                    boxShadow: '0 2px 8px rgba(15,36,68,0.15)',
                    '&:hover': { boxShadow: '0 4px 14px rgba(15,36,68,0.2)' },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 16,
                    border: '1px solid rgba(15,36,68,0.06)',
                    boxShadow: '0 1px 4px rgba(15,36,68,0.04)',
                    transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                    '&:hover': {
                        boxShadow: '0 8px 28px rgba(15,36,68,0.10)',
                    },
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 10,
                    },
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    fontWeight: 600,
                    borderRadius: 8,
                },
            },
        },
        MuiTooltip: {
            styleOverrides: {
                tooltip: {
                    backgroundColor: '#0F2444',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    borderRadius: 8,
                    padding: '6px 12px',
                    boxShadow: '0 4px 16px rgba(15,36,68,0.25)',
                },
                arrow: {
                    color: '#0F2444',
                },
            },
        },
        MuiAccordion: {
            styleOverrides: {
                root: {
                    borderRadius: '12px !important',
                    '&:before': { display: 'none' },
                    overflow: 'hidden',
                },
            },
        },
    },
});

export default theme;
