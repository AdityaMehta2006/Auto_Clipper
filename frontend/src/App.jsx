import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import theme from './theme';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import PageLoader from './components/PageLoader';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import FileBrowser from './pages/FileBrowser';
import VideoDetail from './pages/VideoDetail';
import Clips from './pages/Clips';
import AdminDashboard from './pages/AdminDashboard';
import AdminMetrics from './pages/AdminMetrics';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader message="Verifying access" />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

/* Page transition wrapper */
const pageVariants = {
  initial: { opacity: 0, y: 6 },
  enter: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.12 } },
};

function PageTransition({ children }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="enter"
      exit="exit"
    >
      {children}
    </motion.div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  const { user, loading } = useAuth();

  // Show premium loader while checking auth
  if (loading) return <PageLoader />;

  return (
    <>
      <Navbar />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* Public */}
          <Route path="/login" element={user ? <Navigate to="/" /> : <PageTransition><Login /></PageTransition>} />

          {/* Protected */}
          <Route path="/" element={<ProtectedRoute><PageTransition><Dashboard /></PageTransition></ProtectedRoute>} />
          <Route path="/files" element={<ProtectedRoute><PageTransition><FileBrowser /></PageTransition></ProtectedRoute>} />
          <Route path="/videos/:videoId" element={<ProtectedRoute><PageTransition><VideoDetail /></PageTransition></ProtectedRoute>} />
          <Route path="/clips" element={<ProtectedRoute><PageTransition><Clips /></PageTransition></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin" element={<AdminRoute><PageTransition><AdminDashboard /></PageTransition></AdminRoute>} />
          <Route path="/admin/metrics" element={<AdminRoute><PageTransition><AdminMetrics /></PageTransition></AdminRoute>} />

          {/* Redirects */}
          <Route path="/register" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AnimatePresence>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <AnimatedRoutes />
            <Toaster
              position="bottom-right"
              toastOptions={{
                style: {
                  background: '#1B3A5C',
                  color: '#fff',
                  borderRadius: '10px',
                  fontSize: '0.9rem',
                },
                success: {
                  iconTheme: { primary: '#27AE60', secondary: '#fff' },
                },
                error: {
                  iconTheme: { primary: '#E74C3C', secondary: '#fff' },
                },
              }}
            />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
