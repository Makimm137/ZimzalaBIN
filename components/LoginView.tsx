
import React, { useState } from 'react';
import { supabase } from '../supabase';

interface LoginViewProps {
  onLoginSuccess: () => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError(null);

    try {
      // 1. 尝试登录
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        // 2. 如果登录失败是因为用户不存在，则尝试注册
        if (signInError.message.includes('Invalid login credentials') || signInError.status === 400) {
          const { error: signUpError } = await supabase.auth.signUp({
            email,
            password,
          });
          if (signUpError) throw signUpError;
          // 注册成功后 Supabase 通常会自动登录或需要再次登录
          // 这里再次尝试登录以确保获取 session
          await supabase.auth.signInWithPassword({ email, password });
        } else {
          throw signInError;
        }
      }
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || '认证失败，请检查输入');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF5F8] flex flex-col items-center justify-center p-6 animate-in fade-in duration-700">
      {/* Logo Section */}
      <div className="mb-10 flex flex-col items-center">
        <div className="relative w-32 h-32 mb-6">
          <div className="absolute inset-0 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
          <svg viewBox="0 0 200 160" className="w-full h-full drop-shadow-2xl">
            <path d="M40 70 C10 40 10 90 40 100 Z" fill="#FFF" stroke="#FF6B9D" strokeWidth="4" />
            <path d="M160 70 C190 40 190 90 160 100 Z" fill="#FFF" stroke="#FF6B9D" strokeWidth="4" />
            <rect x="55" y="50" width="90" height="70" rx="12" fill="#FFD166" stroke="#1b0d14" strokeWidth="5" />
            <rect x="55" y="75" width="90" height="20" fill="#FFF" opacity="0.9" />
            <circle cx="85" cy="85" r="4" fill="#1b0d14" />
            <circle cx="115" cy="85" r="4" fill="#1b0d14" />
            <path d="M92 105 Q100 115 108 105" fill="#FF83A4" stroke="#1b0d14" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">求求你别再买了</h1>
        <p className="text-sm text-slate-400 mt-2 font-medium">收藏的小垃圾</p>
      </div>

      {/* Form Section */}
      <div className="w-full max-w-sm bg-white rounded-[2.5rem] shadow-xl shadow-primary/5 p-8 border border-white">
        <form onSubmit={handleAuth} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 ml-2 uppercase tracking-widest">账号 / Email</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">mail</span>
              <input 
                type="email"
                placeholder="yourname@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-14 pl-12 pr-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all outline-none text-sm font-medium"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 ml-2 uppercase tracking-widest">密码 / Password</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">lock</span>
              <input 
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-14 pl-12 pr-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all outline-none text-sm font-medium"
                required
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-500 text-[11px] font-bold p-3 rounded-xl animate-in slide-in-from-top-2">
              {error}
            </div>
          )}

          <button 
            disabled={loading}
            className="w-full h-14 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/30 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <span>进入收藏世界</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </>
            )}
          </button>
        </form>

        <p className="text-center text-[10px] text-slate-400 mt-8 leading-relaxed px-4">
          首次进入将自动为您创建账号<br/>
          数据将实时同步至您的云端空间
        </p>
      </div>

      <div className="mt-auto pb-8">
        <p className="text-[10px] text-slate-300 font-bold tracking-[0.3em] uppercase">Built for Collectors</p>
      </div>
    </div>
  );
};

export default LoginView;
