import { Link } from 'react-router-dom';
import { 
  MessageCircle, 
  MessageSquare, 
  Video, 
  Image as ImageIcon, 
  Users, 
  Bell, 
  Smartphone, 
  ChevronRight,
  Shield,
  Zap,
  CheckCircle2,
  Phone,
  MoreVertical,
  Send,
  Smile,
  Paperclip
} from 'lucide-react';

export const Home = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-green-200">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-lg border-b border-white/20 shadow-sm">
        <div className="container mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-2xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
            <MessageCircle className="w-8 h-8 text-green-600" />
            Chat App
          </Link>
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#home" className="hover:text-green-600 transition-colors">Trang chủ</a>
            <a href="#features" className="hover:text-green-600 transition-colors">Tính năng</a>
            <a href="#groups" className="hover:text-green-600 transition-colors">Nhóm chat</a>
            <a href="#video" className="hover:text-green-600 transition-colors">Gọi video</a>
            <a href="#contact" className="hover:text-green-600 transition-colors">Liên hệ</a>
          </nav>

          <div className="flex items-center gap-4">
            <Link 
              to="/login" 
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-green-600 to-teal-600 text-white font-medium hover:shadow-lg hover:shadow-green-500/30 transition-all active:scale-95"
            >
              Bắt đầu trò chuyện
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="home" className="relative pt-24 pb-32 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] opacity-40 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-green-300 to-teal-300 blur-[100px] rounded-full mix-blend-multiply"></div>
        </div>

        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100/50 border border-green-200 text-green-700 text-sm font-semibold mb-6 backdrop-blur-md">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                Sẵn sàng cho năm 2026
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6 text-slate-900">
                Kết nối mọi cuộc trò chuyện theo cách <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-teal-600">hiện đại hơn.</span>
              </h1>
              <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Nhắn tin realtime, gọi video HD và cộng tác nhóm — tất cả trong một nơi. Tận hưởng trải nghiệm giao diện mượt mà, bảo mật tuyệt đối đa nền tảng.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link to="/register" className="w-full sm:w-auto px-8 py-4 rounded-full bg-slate-900 text-white font-semibold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all hover:shadow-xl hover:-translate-y-1">
                  Trò chuyện ngay
                  <ChevronRight className="w-5 h-5" />
                </Link>
                <a href="#features" className="w-full sm:w-auto px-8 py-4 rounded-full bg-white text-slate-700 font-semibold flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 transition-all hover:shadow-sm">
                  Khám phá tính năng
                </a>
              </div>
              
              <div className="mt-10 flex items-center justify-center lg:justify-start gap-6 text-sm text-slate-500 font-medium">
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Miễn phí sử dụng</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Không cần tải app</div>
              </div>
            </div>

            {/* Hero Mockup */}
            <div className="flex-1 w-full max-w-lg lg:max-w-none relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/40 bg-white/40 backdrop-blur-xl">
                {/* Mockup Header */}
                <div className="h-16 border-b border-slate-200/50 flex items-center justify-between px-6 bg-white/60">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-green-400 to-teal-400 p-[2px]">
                      <div className="w-full h-full bg-white rounded-full border-2 border-white overflow-hidden">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Avatar" className="w-full h-full object-cover" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 text-sm">Nhóm Thiết Kế UI/UX</h3>
                      <p className="text-xs text-green-500 font-medium">Đang hoạt động</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500">
                    <Phone className="w-5 h-5 cursor-pointer hover:text-green-600 transition-colors" />
                    <Video className="w-5 h-5 cursor-pointer hover:text-green-600 transition-colors" />
                    <MoreVertical className="w-5 h-5 cursor-pointer" />
                  </div>
                </div>
                
                {/* Mockup Body */}
                <div className="p-6 h-[320px] flex flex-col gap-4 overflow-hidden relative bg-slate-50/50">
                  <div className="flex gap-3">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Mia" alt="Avatar" className="w-8 h-8 rounded-full bg-white" />
                    <div className="bg-white px-4 py-2.5 rounded-2xl rounded-tl-none shadow-sm border border-slate-100 max-w-[80%]">
                      <p className="text-sm text-slate-700">Chào mọi người! File thiết kế concept mới mình vừa up lên nhé. ✨</p>
                    </div>
                  </div>
                  <div className="flex gap-3 flex-row-reverse">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex" alt="Avatar" className="w-8 h-8 rounded-full bg-white" />
                    <div className="bg-gradient-to-r from-green-600 to-teal-600 px-4 py-2.5 rounded-2xl rounded-tr-none shadow-sm max-w-[80%]">
                      <p className="text-sm text-white">Tuyệt vời quá! Để mình xem qua luôn.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Mia" alt="Avatar" className="w-8 h-8 rounded-full bg-white" />
                    <div className="bg-white p-2 rounded-2xl rounded-tl-none shadow-sm border border-slate-100 max-w-[80%] group cursor-pointer">
                      <div className="w-48 h-32 bg-slate-200 rounded-xl overflow-hidden relative">
                         <div className="absolute inset-0 bg-gradient-to-tr from-green-400 to-teal-400 opacity-20"></div>
                         <div className="absolute inset-0 flex items-center justify-center text-slate-400"><ImageIcon className="w-8 h-8" /></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Floating Mini Video Call */}
                  <div className="absolute top-4 right-4 w-28 h-40 bg-slate-800 rounded-xl shadow-xl overflow-hidden border-2 border-slate-700">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-900"></div>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
                       <div className="w-6 h-6 rounded-full bg-red-500/80 flex items-center justify-center backdrop-blur-sm"><Phone className="w-3 h-3 text-white" /></div>
                    </div>
                  </div>
                </div>

                {/* Mockup Input */}
                <div className="h-16 border-t border-slate-200/50 bg-white/80 flex items-center px-4 gap-3">
                  <button className="text-slate-400 hover:text-slate-600"><Paperclip className="w-5 h-5" /></button>
                  <div className="flex-1 h-10 bg-slate-100 rounded-full px-4 flex items-center text-sm text-slate-400">
                    Nhập tin nhắn...
                  </div>
                  <button className="text-slate-400 hover:text-slate-600"><Smile className="w-5 h-5" /></button>
                  <button className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center hover:bg-green-700 shadow-md shadow-green-500/20">
                    <Send className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-teal-400 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob"></div>
              <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-green-400 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob animation-delay-2000"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Intro Section */}
      <section className="py-20 bg-white relative">
        <div className="container mx-auto px-4 md:px-6 text-center max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-slate-900">Định nghĩa lại cách chúng ta giao tiếp</h2>
          <p className="text-lg text-slate-600 leading-relaxed">
            Chat App không chỉ là một ứng dụng nhắn tin. Đây là nền tảng giao tiếp hiện đại dành cho cá nhân, nhóm bạn và đội ngũ làm việc. 
            Chúng tôi tập trung vào <span className="font-semibold text-green-600">tốc độ trải nghiệm realtime</span>, 
            <span className="font-semibold text-teal-600"> bảo mật dữ liệu</span> và một <span className="font-semibold text-slate-800">giao diện UI thân thiện</span> mang đến cảm giác kết nối thực sự.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mb-4 text-green-600">
                <Zap className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Tốc độ cao</h3>
              <p className="text-slate-500 text-sm">Gửi và nhận tin nhắn tức thì không độ trễ nhờ công nghệ realtime tối ưu.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center mb-4 text-teal-600">
                <Shield className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Bảo mật</h3>
              <p className="text-slate-500 text-sm">Mã hóa đầu cuối đảm bảo mọi cuộc trò chuyện của bạn luôn được riêng tư.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-pink-50 flex items-center justify-center mb-4 text-pink-600">
                <Smartphone className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Đa nền tảng</h3>
              <p className="text-slate-500 text-sm">Trải nghiệm đồng nhất và mượt mà trên cả máy tính, máy tính bảng và điện thoại.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-slate-50 relative">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Tính năng nổi bật</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">Mọi công cụ bạn cần để giữ liên lạc, chia sẻ và làm việc hiệu quả, được thiết kế với sự tinh tế tối đa.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="bg-white/70 backdrop-blur-md rounded-3xl p-8 border border-white/40 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mb-6 text-green-600">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Chat Realtime</h3>
              <p className="text-slate-600 text-sm">Trò chuyện mượt mà không độ trễ. Hiển thị trạng thái đang gõ, đã xem một cách trực quan và sinh động.</p>
            </div>

            {/* Card 2 */}
            <div className="bg-white/70 backdrop-blur-md rounded-3xl p-8 border border-white/40 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center mb-6 text-teal-600">
                <Video className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Gọi Video HD</h3>
              <p className="text-slate-600 text-sm">Kết nối mặt đối mặt với chất lượng hình ảnh sắc nét, âm thanh chống ồn, hỗ trợ share screen dễ dàng.</p>
            </div>

            {/* Card 3 */}
            <div className="bg-white/70 backdrop-blur-md rounded-3xl p-8 border border-white/40 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center mb-6 text-pink-600">
                <ImageIcon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Chia sẻ Media</h3>
              <p className="text-slate-600 text-sm">Gửi ảnh chất lượng cao, video, tài liệu dung lượng lớn với tốc độ tải lên/tải xuống cực nhanh.</p>
            </div>

            {/* Card 4 */}
            <div className="bg-white/70 backdrop-blur-md rounded-3xl p-8 border border-white/40 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center mb-6 text-orange-600">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Chat Nhóm</h3>
              <p className="text-slate-600 text-sm">Tạo nhóm không giới hạn thành viên, phân quyền quản trị viên, tag tên và trả lời tin nhắn cụ thể.</p>
            </div>

            {/* Card 5 */}
            <div className="bg-white/70 backdrop-blur-md rounded-3xl p-8 border border-white/40 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mb-6 text-green-600">
                <Bell className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Thông báo thông minh</h3>
              <p className="text-slate-600 text-sm">Nhận thông báo tức thì trên mọi thiết bị. Tùy chỉnh chế độ không làm phiền theo lịch trình của bạn.</p>
            </div>

            {/* Card 6 */}
            <div className="bg-white/70 backdrop-blur-md rounded-3xl p-8 border border-white/40 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center mb-6 text-indigo-600">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Đồng bộ đa thiết bị</h3>
              <p className="text-slate-600 text-sm">Bắt đầu câu chuyện trên điện thoại, tiếp tục trên máy tính. Dữ liệu luôn đồng bộ mọi lúc mọi nơi.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Preview Section */}
      <section className="py-24 bg-white overflow-hidden">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Trải nghiệm giao diện tương lai</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">Thiết kế tối giản, dark mode tinh tế, thao tác mượt mà — mang lại cảm hứng cho từng đoạn chat.</p>
          </div>

          <div className="relative max-w-5xl mx-auto">
            {/* Desktop UI Abstract */}
            <div className="w-full h-[500px] bg-slate-900 rounded-[2rem] shadow-2xl p-2 relative z-10 border border-slate-800">
              <div className="w-full h-full bg-[#0f172a] rounded-[1.5rem] overflow-hidden flex">
                 {/* Sidebar */}
                 <div className="w-64 border-r border-slate-800 bg-slate-900/50 flex flex-col p-4">
                    <div className="h-8 w-24 bg-slate-800 rounded-full mb-8"></div>
                    <div className="flex flex-col gap-3">
                      <div className="h-12 w-full bg-green-600/20 rounded-xl border border-green-500/30 flex items-center px-3 gap-3">
                         <div className="w-8 h-8 rounded-full bg-slate-700"></div>
                         <div className="flex-1 space-y-2">
                           <div className="h-2 w-16 bg-slate-600 rounded"></div>
                           <div className="h-1.5 w-24 bg-slate-700 rounded"></div>
                         </div>
                      </div>
                      <div className="h-12 w-full hover:bg-slate-800/50 rounded-xl flex items-center px-3 gap-3 cursor-pointer">
                         <div className="w-8 h-8 rounded-full bg-slate-800"></div>
                         <div className="flex-1 space-y-2">
                           <div className="h-2 w-20 bg-slate-700 rounded"></div>
                           <div className="h-1.5 w-16 bg-slate-800 rounded"></div>
                         </div>
                      </div>
                      <div className="h-12 w-full hover:bg-slate-800/50 rounded-xl flex items-center px-3 gap-3 cursor-pointer">
                         <div className="w-8 h-8 rounded-full bg-slate-800"></div>
                         <div className="flex-1 space-y-2">
                           <div className="h-2 w-12 bg-slate-700 rounded"></div>
                           <div className="h-1.5 w-20 bg-slate-800 rounded"></div>
                         </div>
                      </div>
                    </div>
                 </div>
                 {/* Main Chat */}
                 <div className="flex-1 flex flex-col bg-[#0b1120]">
                    <div className="h-16 border-b border-slate-800 flex items-center px-6">
                      <div className="w-8 h-8 rounded-full bg-slate-700 mr-3"></div>
                      <div className="h-3 w-32 bg-slate-700 rounded"></div>
                    </div>
                    <div className="flex-1 p-6 flex flex-col gap-6 justify-end relative">
                       {/* Chat bubbles */}
                       <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800"></div>
                          <div className="h-12 w-64 bg-slate-800 rounded-2xl rounded-tl-none"></div>
                       </div>
                       <div className="flex gap-3 flex-row-reverse">
                          <div className="w-8 h-8 rounded-full bg-teal-900"></div>
                          <div className="h-16 w-72 bg-green-600 rounded-2xl rounded-tr-none"></div>
                       </div>
                    </div>
                    <div className="p-4 border-t border-slate-800">
                       <div className="h-12 w-full bg-slate-900 rounded-full border border-slate-700"></div>
                    </div>
                 </div>
              </div>
            </div>

            {/* Mobile UI Mockup */}
            <div className="absolute -bottom-12 -right-8 w-64 h-[450px] bg-white rounded-[2.5rem] shadow-2xl p-2 z-20 border-4 border-slate-100 rotate-[-5deg] hover:rotate-0 transition-all duration-500">
               <div className="w-full h-full bg-slate-50 rounded-[2rem] overflow-hidden flex flex-col relative border border-slate-200">
                  <div className="h-6 w-full flex justify-center pt-2">
                    <div className="w-16 h-1.5 bg-slate-300 rounded-full"></div>
                  </div>
                  <div className="p-4 flex-1 mt-4 space-y-4">
                     <div className="flex gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-300"></div>
                        <div className="h-10 w-32 bg-white shadow-sm rounded-xl rounded-tl-none border border-slate-100"></div>
                     </div>
                     <div className="flex gap-2 flex-row-reverse">
                        <div className="h-14 w-40 bg-gradient-to-r from-green-500 to-teal-500 shadow-sm rounded-xl rounded-tr-none"></div>
                     </div>
                  </div>
                  <div className="h-16 bg-white border-t border-slate-100 flex items-center px-4">
                     <div className="h-8 w-full bg-slate-100 rounded-full"></div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-slate-900"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-green-600/20 to-teal-600/20 mix-blend-screen"></div>
        
        <div className="container mx-auto px-4 md:px-6 relative z-10 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Bắt đầu kết nối cùng <br className="hidden md:block" /> Chat App ngay hôm nay.
          </h2>
          <p className="text-green-100 text-lg mb-10 max-w-2xl mx-auto">
            Gia nhập cộng đồng người dùng thông thái. Trải nghiệm giao tiếp nhanh hơn, mượt mà hơn và hoàn toàn bảo mật.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="w-full sm:w-auto px-8 py-4 rounded-full bg-white text-slate-900 font-bold hover:bg-slate-50 transition-all shadow-lg shadow-white/10 hover:shadow-xl hover:-translate-y-1">
              Tạo tài khoản miễn phí
            </Link>
            <Link to="/login" className="w-full sm:w-auto px-8 py-4 rounded-full bg-transparent text-white font-semibold border border-white/30 hover:bg-white/10 transition-all">
              Đăng nhập
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 pt-16 pb-8 border-t border-slate-200">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-1">
              <Link to="/" className="flex items-center gap-2 text-xl font-bold text-slate-900 mb-4">
                <MessageCircle className="w-6 h-6 text-green-600" />
                Chat App
              </Link>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">
                Nền tảng giao tiếp hiện đại, bảo mật và thân thiện. Nâng tầm cách bạn kết nối với thế giới.
              </p>
              <div className="flex gap-4">
                 {/* Social placeholders */}
                 <div className="w-8 h-8 rounded-full bg-slate-200 hover:bg-green-100 text-slate-500 hover:text-green-600 flex items-center justify-center cursor-pointer transition-colors">in</div>
                 <div className="w-8 h-8 rounded-full bg-slate-200 hover:bg-green-100 text-slate-500 hover:text-green-600 flex items-center justify-center cursor-pointer transition-colors">tw</div>
                 <div className="w-8 h-8 rounded-full bg-slate-200 hover:bg-green-100 text-slate-500 hover:text-green-600 flex items-center justify-center cursor-pointer transition-colors">fb</div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-slate-900 mb-4">Sản phẩm</h4>
              <ul className="space-y-3 text-sm text-slate-600">
                <li><a href="#" className="hover:text-green-600">Tính năng</a></li>
                <li><a href="#" className="hover:text-green-600">Bảo mật</a></li>
                <li><a href="#" className="hover:text-green-600">Tích hợp</a></li>
                <li><a href="#" className="hover:text-green-600">Tải ứng dụng</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-slate-900 mb-4">Tài nguyên</h4>
              <ul className="space-y-3 text-sm text-slate-600">
                <li><a href="#" className="hover:text-green-600">Hướng dẫn sử dụng</a></li>
                <li><a href="#" className="hover:text-green-600">Blog</a></li>
                <li><a href="#" className="hover:text-green-600">Trung tâm hỗ trợ</a></li>
                <li><a href="#" className="hover:text-green-600">Cộng đồng</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-slate-900 mb-4">Công ty</h4>
              <ul className="space-y-3 text-sm text-slate-600">
                <li><a href="#" className="hover:text-green-600">Về chúng tôi</a></li>
                <li><a href="#" className="hover:text-green-600">Nghề nghiệp</a></li>
                <li><a href="#" className="hover:text-green-600">Liên hệ</a></li>
                <li><a href="#" className="hover:text-green-600">Đối tác</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
            <p>&copy; 2026 Chat App. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-slate-800">Chính sách bảo mật</a>
              <a href="#" className="hover:text-slate-800">Điều khoản dịch vụ</a>
              <a href="#" className="hover:text-slate-800">Cài đặt Cookie</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};


