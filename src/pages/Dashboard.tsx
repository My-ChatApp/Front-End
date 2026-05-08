import { useEffect, useState } from 'react';
import { useAuth } from '@/context';
import { userApiService } from '@/services';
import { LoadingSpinner } from '@/components';
import { LayoutDashboard, User, ShieldCheck, Star } from 'lucide-react';

export const Dashboard = () => {
  const { user } = useAuth();
  const [content, setContent] = useState({ user: '', special: '', admin: '' });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      const [u, s, a] = await Promise.allSettled([
        userApiService.getUserContent(),
        userApiService.getSpecialContent(),
        userApiService.getAdminContent(),
      ]);
      setContent({
        user: u.status === 'fulfilled' ? u.value : '',
        special: s.status === 'fulfilled' ? s.value : '',
        admin: a.status === 'fulfilled' ? a.value : ''
      });
      setIsLoading(false);
    };
    fetchContent();
  }, []);

  if (isLoading) return <div className="h-screen flex items-center justify-center"><LoadingSpinner /></div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black text-slate-900 flex items-center gap-3">
            <LayoutDashboard className="text-green-600" size={36} />
            Bảng điều khiển
          </h1>
          <p className="text-slate-500 mt-2 text-lg">Chào mừng quay trở lại, <span className="font-bold text-slate-800">{user?.email}</span></p>
        </div>
        <div className="px-6 py-3 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center gap-3">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-ping"></div>
          <span className="text-sm font-bold text-slate-700">Hệ thống ổn định</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* User Content Card */}
        <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 hover:scale-[1.02] transition-transform">
          <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center text-green-600 mb-6">
            <User size={28} />
          </div>
          <h2 className="text-xl font-bold mb-4 text-slate-800">Thông tin người dùng</h2>
          <div className="p-4 bg-slate-50 rounded-xl text-slate-600 text-sm leading-relaxed border border-slate-100 italic">
            "{content.user || 'Đang cập nhật...'}"
          </div>
        </div>

        {/* Special Content Card */}
        <div className="bg-gradient-to-br from-green-600 to-teal-600 p-8 rounded-[2rem] shadow-xl shadow-blue-500/20 text-white hover:scale-[1.02] transition-transform">
          <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white mb-6">
            <Star size={28} />
          </div>
          <h2 className="text-xl font-bold mb-4">Nội dung đặc biệt</h2>
          <div className="p-4 bg-white/10 backdrop-blur-md rounded-xl text-blue-50 text-sm leading-relaxed border border-white/20">
            {content.special || 'Nội dung dành riêng cho bạn chưa sẵn sàng.'}
          </div>
        </div>

        {/* Admin Content Card */}
        <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 hover:scale-[1.02] transition-transform">
          <div className="w-14 h-14 bg-teal-100 rounded-2xl flex items-center justify-center text-teal-600 mb-6">
            <ShieldCheck size={28} />
          </div>
          <h2 className="text-xl font-bold mb-4 text-slate-800">Quản trị hệ thống</h2>
          <div className="p-4 bg-purple-50 rounded-xl text-slate-600 text-sm leading-relaxed border border-teal-100">
             {content.admin || 'Bạn không có quyền xem nội dung này.'}
          </div>
        </div>
      </div>
    </div>
  );
};


