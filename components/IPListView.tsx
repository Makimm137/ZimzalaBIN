
import React, { useState, useMemo, useRef } from 'react';
import { CollectionItem, ItemStatus } from '../types';

interface IPListViewProps {
  items: CollectionItem[];
  onBack: () => void;
  onEdit: (item: CollectionItem) => void;
  onTogglePin: (id: string) => void;
}

const IPListView: React.FC<IPListViewProps> = ({ items, onBack, onEdit, onTogglePin }) => {
  const [activeStatus, setActiveStatus] = useState<string>('全部');
  const [activeIP, setActiveIP] = useState<string>('全部');

  const allIPs = useMemo(() => {
    const ips = Array.from(new Set(items.map(i => i.ip))).filter(Boolean);
    return ['全部', ...ips];
  }, [items]);

  const statuses = ['全部', '已入手', '在途', '愿望单', '预定中'];

  const filteredItems = useMemo(() => {
    return items
      .filter(item => {
        const matchesIP = activeIP === '全部' || item.ip === activeIP;
        const matchesStatus = activeStatus === '全部' || item.status === activeStatus;
        return matchesIP && matchesStatus;
      })
      .sort((a, b) => {
        // 置顶的项目排在前面
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return 0;
      });
  }, [items, activeIP, activeStatus]);

  // 长按逻辑处理
  const LongPressButton: React.FC<{ item: CollectionItem; children: React.ReactNode }> = ({ item, children }) => {
    const timerRef = useRef<number | null>(null);
    const [isPressing, setIsPressing] = useState(false);

    const start = () => {
      setIsPressing(true);
      timerRef.current = window.setTimeout(() => {
        onTogglePin(item.id);
        setIsPressing(false);
        // 震动反馈 (如果浏览器支持)
        if (navigator.vibrate) navigator.vibrate(50);
      }, 600);
    };

    const stop = () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setIsPressing(false);
    };

    return (
      <div 
        onMouseDown={start} 
        onMouseUp={stop} 
        onMouseLeave={stop}
        onTouchStart={start}
        onTouchEnd={stop}
        onClick={() => !isPressing && onEdit(item)}
        className={`relative transition-all duration-200 ${isPressing ? 'scale-95 brightness-90' : 'active:scale-[0.98]'}`}
      >
        {children}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden">
      {/* 顶部状态筛选栏 - 严格还原截图样式 */}
      <div className="flex items-center bg-white border-b border-slate-100 overflow-x-auto hide-scrollbar shrink-0 px-4 h-14 sticky top-0 z-50">
        <button onClick={onBack} className="mr-4 text-slate-400 flex items-center justify-center p-1 active:scale-90 transition-transform">
          <span className="material-symbols-outlined text-xl">arrow_back_ios</span>
        </button>
        <div className="flex items-center gap-1">
          {statuses.map(status => (
            <button
              key={status}
              onClick={() => setActiveStatus(status)}
              className={`flex-shrink-0 px-4 h-14 flex flex-col items-center justify-center text-[13px] font-bold transition-all relative ${
                activeStatus === status ? 'text-slate-900' : 'text-slate-400'
              }`}
            >
              {status}
              {activeStatus === status && (
                <div className="absolute bottom-0 left-4 right-4 h-1 bg-slate-900 rounded-t-full"></div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* 左侧 IP 侧边栏 - 还原粉色激活条 */}
        <div className="w-[88px] bg-slate-50 flex flex-col overflow-y-auto border-r border-slate-100 shrink-0">
          <div className="flex flex-col">
            {allIPs.map(ip => (
              <button
                key={ip}
                onClick={() => setActiveIP(ip)}
                className={`py-6 px-3 text-[13px] font-bold transition-all relative leading-tight text-center ${
                  activeIP === ip ? 'bg-white text-primary' : 'text-slate-400'
                }`}
              >
                {activeIP === ip && <div className="absolute left-0 top-4 bottom-4 w-1 bg-primary rounded-r-full"></div>}
                {ip}
              </button>
            ))}
          </div>
          
          <button className="mt-4 mb-32 mx-3 py-4 flex flex-col items-center gap-2 text-primary bg-primary/5 rounded-2xl border border-primary/10 active:scale-95 transition-transform">
            <span className="material-symbols-outlined text-xl font-bold">add</span>
            <span className="text-[10px] font-bold tracking-tighter">添加主题</span>
          </button>
        </div>

        {/* 右侧主内容网格 - 还原置顶标签和价格样式 */}
        <div className="flex-1 overflow-y-auto p-4 bg-white grid grid-cols-2 gap-x-3 gap-y-6 auto-rows-max pb-36 hide-scrollbar">
          {filteredItems.map(item => (
            <LongPressButton key={item.id} item={item}>
              <div className="flex flex-col gap-2 group">
                <div className="relative aspect-square rounded-[20px] overflow-hidden shadow-sm bg-slate-100 border border-slate-50">
                  <img src={item.imageUrl} className="w-full h-full object-cover" alt={item.name} />
                  
                  {item.isPinned && (
                    <div className="absolute top-0 right-0 bg-[#7CACEF] text-white text-[10px] font-bold px-2 py-1 rounded-bl-xl flex items-center gap-1 shadow-sm">
                       置顶
                    </div>
                  )}

                  {/* Character Name badge at bottom right of image container */}
                  <div className="absolute bottom-2 right-2 scale-90 origin-bottom-right">
                    <span className="text-[9px] font-bold text-slate-500 bg-white/80 backdrop-blur-md px-2 py-1 rounded-lg shadow-sm">
                      {item.character}
                    </span>
                  </div>
                </div>

                <div className="px-1">
                  <h3 className="text-[14px] font-bold text-slate-800 line-clamp-1 leading-tight mb-1.5">
                    {item.name}
                  </h3>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-primary font-bold text-[15px]">¥{item.price}</span>
                    </div>
                    <button className="text-slate-300">
                      <span className="material-symbols-outlined text-[18px]">more_vert</span>
                    </button>
                  </div>
                </div>
              </div>
            </LongPressButton>
          ))}

          {filteredItems.length === 0 && (
            <div className="col-span-2 flex flex-col items-center justify-center py-24 text-slate-300">
              <span className="material-symbols-outlined text-5xl mb-3 opacity-20">inventory_2</span>
              <p className="text-sm font-bold">暂无该状态下的藏品</p>
            </div>
          )}
          
          {/* 长按提示气泡 */}
          {activeIP === '全部' && filteredItems.length > 0 && (
            <div className="col-span-2 mt-4 px-4 py-3 bg-[#EAF2FF] rounded-2xl flex items-center justify-center gap-2 border border-[#7CACEF]/20 animate-pulse">
              <span className="material-symbols-outlined text-[#7CACEF] text-sm font-bold">info</span>
              <p className="text-[11px] text-[#7CACEF] font-bold">长按置顶，再长按可以取消置顶</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IPListView;
