import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';

const pulse = {
    animate: {
        scale: [1, 1.08, 1],
        opacity: [0.7, 1, 0.7],
        transition: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' },
    },
};

const shimmer = {
    animate: {
        backgroundPosition: ['200% 0', '-200% 0'],
        transition: { duration: 2.5, repeat: Infinity, ease: 'linear' },
    },
};

const dots = [0, 1, 2];

export default function PageLoader({ message = 'Loading' }) {
    return (
        <Box
            sx={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(160deg, #0F2444 0%, #1A3A6B 40%, #0F2444 100%)',
            }}
        >
            {/* Ambient glow */}
            <Box sx={{
                position: 'absolute',
                width: 280, height: 280,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(184,137,79,0.15) 0%, transparent 70%)',
                filter: 'blur(40px)',
                pointerEvents: 'none',
            }} />

            {/* Logo */}
            <motion.div variants={pulse} animate="animate">
                <Typography
                    variant="h4"
                    sx={{
                        fontWeight: 800,
                        letterSpacing: '-0.03em',
                        fontSize: '2rem',
                        mb: 3,
                        userSelect: 'none',
                    }}
                >
                    <Box component="span" sx={{ color: '#D4A843' }}>Auto</Box>
                    <Box component="span" sx={{ color: '#fff' }}>Clipper</Box>
                </Typography>
            </motion.div>

            {/* Progress bar shimmer */}
            <motion.div
                variants={shimmer}
                animate="animate"
                style={{
                    width: 160,
                    height: 3,
                    borderRadius: 4,
                    background: 'linear-gradient(90deg, transparent, #D4A843, #B8894F, transparent)',
                    backgroundSize: '200% 100%',
                    marginBottom: 20,
                }}
            />

            {/* Message with animated dots */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                <Typography
                    variant="body2"
                    sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 500, fontSize: '0.85rem' }}
                >
                    {message}
                </Typography>
                {dots.map((i) => (
                    <motion.span
                        key={i}
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{
                            duration: 1.2,
                            repeat: Infinity,
                            delay: i * 0.3,
                            ease: 'easeInOut',
                        }}
                        style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}
                    >
                        .
                    </motion.span>
                ))}
            </Box>
        </Box>
    );
}
