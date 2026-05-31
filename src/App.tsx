import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, ChatProvider, useAuth } from '@/context';
import { ProtectedRoute } from '@/components';
import { Layout } from '@/pages/Layout';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { Home } from '@/pages/Home';
import { Dashboard } from '@/pages/Dashboard';
import { Chat } from '@/pages/Chat';
import { NotFound } from '@/pages/NotFound';
import { MessageCircle } from 'lucide-react';

function FullScreenLoader() {
  return (
    <div className="app-page-shell min-h-screen flex flex-col items-center justify-center gap-6 relative overflow-hidden px-4">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-green-200/40 blur-[120px] rounded-full animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-200/40 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>

      {/* Logo + Spinner */}
      <div className="relative z-10 flex flex-col items-center gap-5">
        <div className="relative">
          <div className="w-20 h-20 rounded-[1.5rem] app-hero-banner flex items-center justify-center shadow-xl shadow-green-500/20">
            <MessageCircle className="w-10 h-10 text-white" />
          </div>
          <div className="absolute -inset-2 rounded-[1.75rem] bg-gradient-to-tr from-green-600/20 to-teal-600/20 blur-lg animate-pulse"></div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-2xl font-extrabold app-gradient-text">
            Chat App
          </span>
        </div>

        {/* Loading indicator */}
        <div className="flex items-center gap-2 mt-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
        <p className="text-slate-500 font-medium text-sm">Đang khởi tạo...</p>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <FullScreenLoader />;
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route
          path="chat"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />
        <Route
          path="dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <ChatProvider>
          <AppRoutes />
        </ChatProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
