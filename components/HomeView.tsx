
import React, { useState, useMemo } from 'react';
import { CollectionItem, ItemStatus, ItemCategory, SourceType } from '../types';

interface HomeViewProps {
  items: CollectionItem[];
  profile: { name: string; bio: string; avatar: string };
  onEdit: (item: CollectionItem) => void;
  onToggleReminder: (id: string) => void;
  onNavigateToProfile: () => void;
}

const HomeView: React.FC<HomeViewProps> = ({ items, profile, onEdit, onToggleReminder, onNavigateToProfile }) => {
  const [activeStatus, setActiveStatus] = useState<string>('全部');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [showSideDrawer, setShowSideDrawer] = useState(false);
  const [showRemindersDrawer, setShowRemindersDrawer] = useState(false);
  const [filterCategory, setFilterCategory] = useState<'分类' | 'IP' | '角色' | '类型'>('分类');
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({
    '分类': [],
    'IP': [],
    '角色': [],
    '类型': []
  });

  const allIps = useMemo(() => Array.from(new Set(items.map(i => i.ip))), [items]);
  const allCharacters = useMemo(() => Array.from(new Set(items.map(i => i.character))), [items]);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesStatus = activeStatus === '全部' || item.status === activeStatus;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           item.ip.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.character.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesSource = selectedFilters['分类'].length === 0 || selectedFilters['分类'].includes(item.sourceType || '');
      const matchesIp = selectedFilters['IP'].length === 0 || selectedFilters['IP'].includes(item.ip);
      const matchesChar = selectedFilters['角色'].length === 0 || selectedFilters['角色'].includes(item.character);
      const matchesType = selectedFilters['类型'].length === 0 || selectedFilters['类型'].includes(item.category);

      return matchesStatus && matchesSearch && matchesSource && matchesIp && matchesChar && matchesType;
    });
  }, [items, activeStatus, searchQuery, selectedFilters]);

  // Reminder items: Transit or Reserved, sorted by date (Earliest to Latest)
  const reminderItems = useMemo(() => {
    return items
      .filter(item => item.status === ItemStatus.TRANSIT || item.status === ItemStatus.RESERVED)
      .sort((a, b) => {
        const dateA = a.purchaseDate || '9999-12-31';
        const dateB = b.purchaseDate || '9999-12-31';
        return dateA.localeCompare(dateB);
      });
  }, [items]);

  const toggleFilter = (type: string, value: string) => {
    setSelectedFilters(prev => {
      const current = prev[type] || [];
      const updated = current.includes(value) 
        ? current.filter(v => v !== value) 
        : [...current, value];
      return { ...prev, [type]: updated };
    });
  };

  const activeChips = useMemo(() => {
    const chips: { type: string, value: string }[] = [];
    Object.entries(selectedFilters).forEach(([type, values]) => {
      values.forEach(v => chips.push({ type, value: v }));
    });
    return chips;
  }, [selectedFilters]);

  const handleProfileJump = () => {
    setShowSideDrawer(false);
    onNavigateToProfile();
  };

  return (
    <div className="animate-in fade-in duration-500">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md px-5 pt-6 pb-2 border-b border-slate-50 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowSideDrawer(true)}
              className="w-10 h-10 rounded-full border-2 border-primary/20 p-0.5 shadow-sm active:scale-90 transition-transform focus:outline-none overflow-hidden"
            >
              <img 
                src={profile.avatar} 
                className="w-full h-full object-cover rounded-full"
                alt="avatar"
              />
            </button>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">我的收藏</h1>
                <span className="text-[11px] text-primary font-bold bg-primary/5 px-2 py-0.5 rounded-full">{items.length} 件藏品</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-4 space-y-3">
          <div className="relative w-full h-11 bg-slate-100 rounded-full flex items-center px-4 gap-2 border border-transparent focus-within:border-primary/20 focus-within:bg-white transition-all shadow-sm">
            <span className="material-symbols-outlined text-slate-400 text-lg">search</span>
            <input 
              className="bg-transparent border-none focus:ring-0 text-[13px] text-slate-600 w-full p-0 placeholder:text-slate-400" 
              placeholder="搜索藏品名称" 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="h-6 w-[1px] bg-slate-300 mx-1"></div>
            <button 
              onClick={() => setShowFilterDrawer(true)}
              className={`flex items-center justify-center transition-transform active:scale-90 ${activeChips.length > 0 ? 'text-primary' : 'text-slate-400'}`}
            >
              <span className="material-symbols-outlined text-[22px]">tune</span>
            </button>
          </div>
          
          {activeChips.length > 0 && (
            <div className="flex gap-2 overflow-x-auto hide-scrollbar py-1">
              {activeChips.map(chip => (
                <div key={`${chip.type}-${chip.value}`} className="flex items-center gap-1.5 bg-primary/5 border border-primary/10 text-primary px-3 py-1.5 rounded-full shrink-0 shadow-sm">
                  <span className="text-[11px] font-bold whitespace-nowrap">{chip.type}: {chip.value}</span>
                  <button onClick={() => toggleFilter(chip.type, chip.value)} className="flex items-center justify-center">
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
          {['全部', ItemStatus.OWNED, ItemStatus.TRANSIT, ItemStatus.WISHLIST].map(status => (
            <button
              key={status}
              onClick={() => setActiveStatus(status)}
              className={`flex h-7 shrink-0 items-center justify-center rounded-full px-3 text-[10px] font-bold transition-all ${
                activeStatus === status 
                ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </header>

      <main className="p-4 min-h-[50vh]">
        <div className="grid grid-cols-3 gap-x-2 gap-y-5">
          {filteredItems.map(item => (
            <button 
              key={item.id} 
              onClick={() => onEdit(item)}
              className="flex flex-col gap-1.5 text-left active:scale-[0.96] transition-transform focus:outline-none"
            >
              <div className="relative w-full aspect-square overflow-hidden rounded-2xl bg-slate-100 shadow-sm border border-slate-50">
                <StatusTag status={item.status} absolute />
                <div 
                  className="w-full h-full bg-cover bg-center" 
                  style={{ backgroundImage: `url(${item.imageUrl})` }}
                />
                <div className="absolute bottom-1.5 left-1.5 scale-90 origin-bottom-left">
                  <span className="text-[9px] font-bold text-slate-700 bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-lg shadow-sm">
                    数量: {item.quantity}
                  </span>
                </div>
              </div>
              <div className="px-1">
                <h3 className="text-[11px] font-bold text-slate-900 truncate leading-tight">{item.name}</h3>
                <p className="text-[9px] text-slate-500 font-medium truncate mt-0.5">
                  {item.ip} • ¥{item.price}
                </p>
              </div>
            </button>
          ))}
        </div>
      </main>

      {/* Side Drawer (Left) */}
      <div 
        className={`fixed inset-0 z-[100] flex transition-opacity duration-300 ease-in-out ${showSideDrawer ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      >
        <div 
          className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
          onClick={() => setShowSideDrawer(false)}
        ></div>
        <div 
          className={`relative w-[75%] h-full bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out transform ${showSideDrawer ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <div className="flex-1 overflow-y-auto hide-scrollbar flex flex-col">
            <div className="p-8 pt-16 bg-slate-50/50">
              <button 
                onClick={handleProfileJump}
                className="flex flex-col items-start gap-4 text-left group focus:outline-none"
              >
                <div 
                  className="w-20 h-20 rounded-full border-4 border-white shadow-lg bg-cover bg-center transition-transform group-active:scale-95" 
                  style={{ backgroundImage: `url(${profile.avatar})` }} 
                />
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-slate-900 group-active:text-primary transition-colors">{profile.name}</h2>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">{profile.bio}</p>
                </div>
                <div className="flex items-center gap-1.5 mt-1 bg-white px-3 py-1.5 rounded-full border border-slate-100 shadow-sm text-primary text-[10px] font-bold">
                  <span className="material-symbols-outlined text-[14px]">edit_note</span>
                  进入个人中心
                </div>
              </button>
            </div>

            <div className="px-4 py-8 space-y-1.5 flex-1">
              <p className="px-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">系统设置</p>
              <SideMenuItem icon="palette" label="外观与个性化" />
              <SideMenuItem 
                icon="notifications" 
                label="提醒与通知" 
                onClick={() => {
                  setShowSideDrawer(false);
                  setShowRemindersDrawer(true);
                }}
              />
              <SideMenuItem icon="help_center" label="帮助中心" />
              <SideMenuItem icon="info" label="关于此小程序" />
            </div>
          </div>

          <div className="p-6 border-t border-slate-50 bg-white shrink-0">
            <button className="flex items-center gap-3 w-full py-4 px-5 text-slate-500 hover:text-red-500 font-bold text-sm transition-all rounded-2xl hover:bg-red-50 active:scale-95">
              <span className="material-symbols-outlined text-lg">logout</span>
              退出当前账号
            </button>
            <div className="mt-4 flex flex-col items-center gap-1 opacity-20">
              <p className="text-[9px] font-medium tracking-widest">V2.5.0 STABLE</p>
            </div>
          </div>
        </div>
      </div>

      {/* Reminders Drawer (Bottom) - Updated to match screenshot with alarm icons */}
      <div 
        className={`fixed inset-0 z-[110] flex items-end transition-opacity duration-300 ${showRemindersDrawer ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowRemindersDrawer(false)}></div>
        <div className={`relative w-full bg-white rounded-t-[2.5rem] shadow-2xl p-6 transition-transform duration-300 ease-out transform ${showRemindersDrawer ? 'translate-y-0' : 'translate-y-full'}`}>
          <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6"></div>
          <div className="flex items-center gap-2 mb-6">
             <h3 className="text-lg font-bold text-slate-800">在途与预定提醒</h3>
             <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">{reminderItems.length}项</span>
          </div>
          
          <div className="max-h-[60vh] overflow-y-auto hide-scrollbar space-y-3 pb-8">
            {reminderItems.length > 0 ? (
              reminderItems.map(item => (
                <div key={item.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-100 transition-transform active:scale-[0.99]">
                  <div className="w-12 h-12 rounded-xl bg-cover bg-center shrink-0 shadow-sm" style={{ backgroundImage: `url(${item.imageUrl})` }}></div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[13px] font-bold text-slate-800 truncate">{item.name}</h4>
                    <p className="text-[10px] text-slate-400 font-medium truncate">{item.ip} • {item.purchaseDate || '日期未定'}</p>
                  </div>
                  
                  <div className="flex items-center gap-2.5">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleReminder(item.id);
                      }}
                      className={`flex items-center justify-center p-1.5 rounded-full transition-all active:scale-90 ${item.isReminderEnabled ? 'text-primary' : 'text-slate-300 hover:text-slate-400'}`}
                    >
                      <span className={`material-symbols-outlined text-[20px] ${item.isReminderEnabled ? 'fill-[1]' : ''}`}>notifications</span>
                    </button>
                    <StatusTag status={item.status} />
                  </div>
                </div>
              ))
            ) : (
              <div className="py-20 flex flex-col items-center justify-center opacity-30 gap-4">
                <span className="material-symbols-outlined text-6xl">notifications_off</span>
                <p className="text-sm font-bold">暂无在途或预定中的藏品</p>
              </div>
            )}
          </div>
          
          <button 
            onClick={() => setShowRemindersDrawer(false)}
            className="w-full py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl active:scale-95 transition-transform"
          >
            关闭
          </button>
        </div>
      </div>

      {/* Filter Drawer (Right) */}
      <div 
        className={`fixed inset-0 z-[100] flex justify-end transition-opacity duration-300 ease-in-out ${showFilterDrawer ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      >
        <div 
          className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
          onClick={() => setShowFilterDrawer(false)}
        ></div>
        <div 
          className={`relative w-[85%] h-full bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out transform ${showFilterDrawer ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">筛选条件</h2>
            <button onClick={() => setShowFilterDrawer(false)} className="text-slate-400 flex items-center justify-center p-2"><span className="material-symbols-outlined">close</span></button>
          </div>
          
          <div className="flex-1 flex overflow-hidden">
            <div className="w-24 bg-slate-50 border-r border-slate-100 flex flex-col">
              {(['分类', 'IP', '角色', '类型'] as const).map(cat => (
                <button 
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`py-5 text-sm font-bold transition-all relative ${filterCategory === cat ? 'bg-white text-primary' : 'text-slate-500'}`}
                >
                  {filterCategory === cat && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full"></div>}
                  {cat}
                </button>
              ))}
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-2 gap-2">
                {(filterCategory === '分类' ? Object.values(SourceType) : 
                  filterCategory === '类型' ? Object.values(ItemCategory) :
                  filterCategory === 'IP' ? allIps : allCharacters).map((item) => (
                  <button
                    key={item}
                    onClick={() => toggleFilter(filterCategory, item)}
                    className={`px-3 py-3 rounded-xl text-[11px] font-bold border transition-all text-center ${
                      selectedFilters[filterCategory].includes(item)
                        ? 'bg-primary/5 border-primary text-primary'
                        : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-slate-100 grid grid-cols-2 gap-4 bg-white shadow-inner">
            <button 
              onClick={() => setSelectedFilters({ '分类': [], 'IP': [], '角色': [], '类型': [] })}
              className="py-4 rounded-2xl bg-slate-100 text-slate-600 font-bold text-sm active:scale-95 transition-transform"
            >
              重置
            </button>
            <button 
              onClick={() => setShowFilterDrawer(false)}
              className="py-4 rounded-2xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20 active:scale-95 transition-transform"
            >
              确定
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const SideMenuItem: React.FC<{ icon: string; label: string; onClick?: () => void }> = ({ icon, label, onClick }) => (
  <button 
    onClick={onClick}
    className="flex items-center gap-4 w-full py-4 px-5 text-slate-600 hover:text-primary transition-all rounded-2xl active:bg-slate-50 group"
  >
    <span className="material-symbols-outlined text-[22px] text-slate-400 group-hover:text-primary transition-colors">{icon}</span>
    <span className="text-sm font-bold">{label}</span>
    <span className="material-symbols-outlined text-slate-300 text-sm ml-auto opacity-0 group-hover:opacity-100 transition-all">chevron_right</span>
  </button>
);

const StatusTag: React.FC<{ status: ItemStatus; absolute?: boolean }> = ({ status, absolute = false }) => {
  const styles = {
    [ItemStatus.OWNED]: 'bg-tag-owned text-emerald-800',
    [ItemStatus.TRANSIT]: 'bg-tag-transit text-orange-800',
    [ItemStatus.WISHLIST]: 'bg-tag-wish text-lime-800',
    [ItemStatus.RESERVED]: 'bg-indigo-100 text-indigo-800',
    [ItemStatus.SOLD]: 'bg-rose-100 text-rose-800',
  };

  return (
    <div className={`${absolute ? 'absolute top-0 left-0 z-10 rounded-br-2xl' : 'relative rounded-lg'} text-[10px] font-bold px-3 py-1 shadow-sm whitespace-nowrap ${styles[status]}`}>
      {status}
    </div>
  );
};

export default HomeView;
