import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Typography, Grid, Card, CardContent, Skeleton,
    IconButton,
} from '@mui/material';
import { ArrowBack, Analytics } from '@mui/icons-material';
import { motion } from 'framer-motion';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
    ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis,
    PolarRadiusAxis, Treemap, PieChart, Pie, Cell, Legend,
} from 'recharts';
import toast from 'react-hot-toast';
import client from '../api/client';

const COLORS = {
    navy: '#1A3A6B',
    navyDark: '#0F2444',
    gold: '#B8894F',
    goldLight: '#D4A843',
    green: '#1D8348',
    greenLight: '#16a34a',
    red: '#C0392B',
};

const gradientId = 'areaGradient';
const radarGradientId = 'radarGradient';

function ChartCard({ title, subtitle, children, minHeight = 340 }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            style={{ height: '100%' }}
        >
            <Card sx={{
                borderRadius: 3, height: '100%',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.97), rgba(240,243,248,0.85))',
                border: '1px solid', borderColor: 'divider',
            }}>
                <CardContent sx={{ p: { xs: 2, md: 3 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ mb: 2.5 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, letterSpacing: '-0.01em' }}>
                            {title}
                        </Typography>
                        {subtitle && (
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {subtitle}
                            </Typography>
                        )}
                    </Box>
                    <Box sx={{ flex: 1, minHeight }}>
                        {children}
                    </Box>
                </CardContent>
            </Card>
        </motion.div>
    );
}

/* Custom Treemap content renderer */
function TreemapContent({ x, y, width, height, name, count, index }) {
    const treemapColors = [COLORS.navy, COLORS.gold, COLORS.green, COLORS.greenLight, COLORS.red, '#6C5CE7', '#00B894'];
    const fill = treemapColors[index % treemapColors.length];
    if (width < 50 || height < 40) return null;
    return (
        <g>
            <rect x={x} y={y} width={width} height={height} rx={8}
                fill={fill} fillOpacity={0.85} stroke="#fff" strokeWidth={3} />
            <text x={x + width / 2} y={y + height / 2 - 8} textAnchor="middle"
                fill="#fff" fontSize={13} fontWeight={700}>
                {name?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </text>
            <text x={x + width / 2} y={y + height / 2 + 12} textAnchor="middle"
                fill="rgba(255,255,255,0.7)" fontSize={12} fontWeight={500}>
                {count}
            </text>
        </g>
    );
}

export default function AdminMetrics() {
    const [clipsByDay, setClipsByDay] = useState([]);
    const [virality, setVirality] = useState([]);
    const [userActivity, setUserActivity] = useState([]);
    const [actions, setActions] = useState([]);
    const [overview, setOverview] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        let cancelled = false;
        async function fetchAll() {
            try {
                const [cbd, vd, ua, ab, ov] = await Promise.all([
                    client.get('/api/admin/stats/clips-by-day'),
                    client.get('/api/admin/stats/virality-distribution'),
                    client.get('/api/admin/stats/user-activity'),
                    client.get('/api/admin/stats/action-breakdown'),
                    client.get('/api/admin/stats/overview'),
                ]);
                if (cancelled) return;
                setClipsByDay(cbd.data);
                setVirality(vd.data);
                setUserActivity(ua.data);
                setActions(ab.data.map(a => ({ name: a.action, count: a.count })));
                setOverview(ov.data);
            } catch {
                if (!cancelled) toast.error('Failed to load metrics');
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        fetchAll();
        return () => { cancelled = true; };
    }, []);

    if (loading) {
        return (
            <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1400, mx: 'auto' }}>
                <Skeleton variant="text" width={250} height={40} />
                <Grid container spacing={3} sx={{ mt: 2 }}>
                    {[1, 2, 3, 4].map(i => (
                        <Grid item xs={12} md={6} key={i}>
                            <Skeleton variant="rounded" height={400} sx={{ borderRadius: 3 }} />
                        </Grid>
                    ))}
                </Grid>
            </Box>
        );
    }

    // Prepare radar data for user activity (top 6 users)
    const radarData = userActivity.slice(0, 6).map(u => ({
        user: u.display_name || u.user_email.split('@')[0],
        Videos: u.videos,
        Clips: u.clips,
        Approved: u.approved,
        Feedback: u.feedback,
    }));

    // Approval donut data
    const donutData = [
        { name: 'Approved', value: overview?.approved_clips || 0, color: COLORS.greenLight },
        { name: 'Pending', value: overview?.pending_clips || 0, color: COLORS.gold },
        { name: 'Rejected', value: overview?.rejected_clips || 0, color: COLORS.red },
    ].filter(d => d.value > 0);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1400, mx: 'auto' }}>

                {/* Header */}
                <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <IconButton
                        size="small"
                        onClick={() => navigate('/admin')}
                        sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
                    >
                        <ArrowBack fontSize="small" />
                    </IconButton>
                    <Analytics sx={{ color: 'secondary.main', fontSize: 28 }} />
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
                            Platform Metrics
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            Last 30 days analytics
                        </Typography>
                    </Box>
                </Box>

                <Grid container spacing={3}>

                    {/* ── Row 1: Clips Over Time (full width) ── */}
                    <Grid item xs={12}>
                        <ChartCard title="Clips Created Over Time" subtitle="Daily clip generation — last 30 days" minHeight={320}>
                            <ResponsiveContainer width="100%" height={320}>
                                <AreaChart data={clipsByDay} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                                    <defs>
                                        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={COLORS.navy} stopOpacity={0.4} />
                                            <stop offset="50%" stopColor={COLORS.gold} stopOpacity={0.2} />
                                            <stop offset="100%" stopColor={COLORS.gold} stopOpacity={0.02} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,36,68,0.06)" />
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fontSize: 12, fill: '#5A6B80' }}
                                        tickFormatter={v => v.slice(5)}
                                        axisLine={{ stroke: 'rgba(15,36,68,0.08)' }}
                                    />
                                    <YAxis tick={{ fontSize: 12, fill: '#5A6B80' }} axisLine={false} tickLine={false} />
                                    <ReTooltip
                                        contentStyle={{
                                            background: '#0F2444', border: 'none', borderRadius: 10,
                                            color: '#fff', fontSize: '0.85rem', fontWeight: 600,
                                            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                                        }}
                                        labelStyle={{ color: '#D4A843' }}
                                    />
                                    <Area
                                        type="monotone" dataKey="count" name="Clips"
                                        stroke={COLORS.navy} strokeWidth={2.5}
                                        fill={`url(#${gradientId})`}
                                        dot={{ r: 4, fill: COLORS.gold, stroke: COLORS.navy, strokeWidth: 2 }}
                                        activeDot={{ r: 7, fill: COLORS.gold, stroke: '#fff', strokeWidth: 2 }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </ChartCard>
                    </Grid>

                    {/* ── Row 2: Donut + Virality Radar (50/50) ── */}
                    <Grid item xs={12} md={5}>
                        <ChartCard title="Clip Status" subtitle="Approval distribution" minHeight={340}>
                            <ResponsiveContainer width="100%" height={340}>
                                <PieChart>
                                    <Pie
                                        data={donutData.length ? donutData : [{ name: 'No data', value: 1, color: '#e0e0e0' }]}
                                        cx="50%" cy="45%"
                                        innerRadius={75} outerRadius={110}
                                        paddingAngle={4} dataKey="value"
                                        stroke="none"
                                        cornerRadius={8}
                                    >
                                        {(donutData.length ? donutData : [{ color: '#e0e0e0' }]).map((entry, i) => (
                                            <Cell key={i} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Legend
                                        verticalAlign="bottom"
                                        iconType="circle"
                                        iconSize={10}
                                        formatter={(value) => (
                                            <span style={{ color: '#5A6B80', fontSize: '0.85rem', fontWeight: 600 }}>{value}</span>
                                        )}
                                    />
                                    <ReTooltip
                                        contentStyle={{
                                            background: '#0F2444', border: 'none', borderRadius: 10,
                                            color: '#fff', fontSize: '0.85rem',
                                            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </ChartCard>
                    </Grid>

                    <Grid item xs={12} md={7}>
                        <ChartCard title="Virality Score Distribution" subtitle="Score range frequency" minHeight={340}>
                            <ResponsiveContainer width="100%" height={340}>
                                <RadarChart data={virality} cx="50%" cy="48%" outerRadius="72%">
                                    <defs>
                                        <linearGradient id={radarGradientId} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={COLORS.gold} stopOpacity={0.6} />
                                            <stop offset="100%" stopColor={COLORS.navy} stopOpacity={0.3} />
                                        </linearGradient>
                                    </defs>
                                    <PolarGrid stroke="rgba(15,36,68,0.08)" />
                                    <PolarAngleAxis
                                        dataKey="range" tick={{ fontSize: 13, fill: '#5A6B80', fontWeight: 600 }}
                                    />
                                    <PolarRadiusAxis tick={{ fontSize: 11, fill: '#999' }} axisLine={false} />
                                    <Radar
                                        name="Clips" dataKey="count"
                                        stroke={COLORS.gold} strokeWidth={2.5}
                                        fill={`url(#${radarGradientId})`}
                                        dot={{ r: 5, fill: COLORS.gold, stroke: '#fff', strokeWidth: 2 }}
                                    />
                                    <ReTooltip
                                        contentStyle={{
                                            background: '#0F2444', border: 'none', borderRadius: 10,
                                            color: '#fff', fontSize: '0.85rem',
                                            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                                        }}
                                    />
                                </RadarChart>
                            </ResponsiveContainer>
                        </ChartCard>
                    </Grid>

                    {/* ── Row 3: Action Breakdown + User Activity (50/50) ── */}
                    <Grid item xs={12} md={6}>
                        <ChartCard title="Action Breakdown" subtitle="Activity by type — last 30 days" minHeight={360}>
                            {actions.length > 0 ? (
                                <ResponsiveContainer width="100%" height={360}>
                                    <Treemap
                                        data={actions}
                                        dataKey="count"
                                        nameKey="name"
                                        content={<TreemapContent />}
                                        animationDuration={600}
                                    />
                                </ResponsiveContainer>
                            ) : (
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 360 }}>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', maxWidth: 280 }}>
                                        No activity logged yet. Actions will appear here as users interact with the platform.
                                    </Typography>
                                </Box>
                            )}
                        </ChartCard>
                    </Grid>

                    {radarData.length > 0 && (
                        <Grid item xs={12} md={6}>
                            <ChartCard title="User Activity Comparison" subtitle="Top users — multi-metric radar" minHeight={360}>
                                <ResponsiveContainer width="100%" height={360}>
                                    <RadarChart data={radarData} cx="50%" cy="45%" outerRadius="62%">
                                        <PolarGrid stroke="rgba(15,36,68,0.08)" />
                                        <PolarAngleAxis
                                            dataKey="user" tick={{ fontSize: 12, fill: '#5A6B80', fontWeight: 600 }}
                                        />
                                        <PolarRadiusAxis tick={{ fontSize: 10, fill: '#999' }} axisLine={false} />
                                        <Radar name="Videos" dataKey="Videos" stroke={COLORS.navy} fill={COLORS.navy} fillOpacity={0.15} strokeWidth={2} />
                                        <Radar name="Clips" dataKey="Clips" stroke={COLORS.gold} fill={COLORS.gold} fillOpacity={0.15} strokeWidth={2} />
                                        <Radar name="Approved" dataKey="Approved" stroke={COLORS.greenLight} fill={COLORS.greenLight} fillOpacity={0.15} strokeWidth={2} />
                                        <Radar name="Feedback" dataKey="Feedback" stroke={COLORS.red} fill={COLORS.red} fillOpacity={0.1} strokeWidth={2} />
                                        <Legend
                                            verticalAlign="bottom"
                                            iconType="circle"
                                            iconSize={8}
                                            formatter={(value) => (
                                                <span style={{ color: '#5A6B80', fontSize: '0.8rem', fontWeight: 600 }}>{value}</span>
                                            )}
                                        />
                                        <ReTooltip
                                            contentStyle={{
                                                background: '#0F2444', border: 'none', borderRadius: 10,
                                                color: '#fff', fontSize: '0.85rem',
                                                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                                            }}
                                        />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </ChartCard>
                        </Grid>
                    )}
                </Grid>
            </Box>
        </motion.div>
    );
}
