import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from '@/components';

export const Layout = () => {
  const { pathname } = useLocation();
  const isHomePage = pathname === '/';
  const isChatPage = pathname === '/chat';
  const isFullBleed = isHomePage || isChatPage;

  return (
    <div
      className={`min-h-screen relative overflow-x-hidden font-sans ${
        isChatPage ? 'bg-[#1e1f22]' : 'bg-slate-50'
      }`}
    >
      {!isChatPage && (
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-green-200/40 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-200/40 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>
      )}

      <div className="relative z-10 flex flex-col min-h-screen">
        {!isFullBleed && <Navbar />}
        <main className={isChatPage ? 'flex-1 h-full' : 'flex-1'}>
          <Outlet />
        </main>
        {!isFullBleed && (
          <footer className="py-8 text-center text-slate-500 text-sm border-t border-slate-200/50 backdrop-blur-md bg-white/30">
            <p>&copy; 2026 Chat App. Tất cả quyền được bảo lưu.</p>
          </footer>
        )}
      </div>
    </div>
  );
};


