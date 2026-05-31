import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from '@/components';
import { MessageCircle } from 'lucide-react';

export const Layout = () => {
  const { pathname } = useLocation();
  const isHomePage = pathname === '/';
  const isChatPage = pathname === '/chat';
  const isFullBleed = isHomePage || isChatPage;

  return (
    <div
      className={`app-page-shell min-h-screen relative overflow-x-hidden font-sans selection:bg-green-200 ${
        isChatPage ? 'bg-transparent' : 'bg-slate-50'
      }`}
    >
      {!isChatPage && (
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-green-200/40 blur-[120px] rounded-full animate-blob"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-200/40 blur-[120px] rounded-full animate-blob animation-delay-2000"></div>
      </div>
      )}

      <div className="relative z-10 flex flex-col min-h-screen">
        {!isFullBleed && <Navbar />}
        <main className={isChatPage ? 'flex-1 h-full' : 'flex-1'}>
          <Outlet />
        </main>
        {!isFullBleed && (
          <footer className="py-10 border-t border-slate-200/50 backdrop-blur-md bg-white/35">
            <div className="container mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm font-bold app-gradient-text">
                  Chat App
                </span>
              </div>
              <p className="text-slate-500 text-sm">&copy; 2026 Chat App. Tất cả quyền được bảo lưu.</p>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
};
