import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './hooks/useAuth';
import Navbar from './components/Navbar';
import FloatingActions from './components/FloatingActions';
import Home from './pages/Home';
import Explore from './pages/Explore';
import Library from './pages/Library';
import Tools from './pages/Tools';
import Creators from './pages/Creators';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Upload from './pages/Upload';
import './index.css';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/library" element={<Library />} />
          <Route path="/tools" element={<Tools />} />
          <Route path="/creators" element={<Creators />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/upload" element={<Upload />} />
        </Routes>
        <FloatingActions />
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              background: '#111',
              color: '#f0f0f0',
              border: '1px solid #1e1e1e',
              borderRadius: 12,
              fontSize: 14,
            },
            success: {
              iconTheme: { primary: '#00E5FF', secondary: '#000' },
            },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}
