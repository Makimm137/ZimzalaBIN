
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { CollectionItem, ItemStatus, ItemCategory, PaymentStatus, SourceType } from '../types';

interface ProfileViewProps {
  items: CollectionItem[];
  profile: { name: string; bio: string; avatar: string };
  onUpdateProfile: (profile: { name: string; bio: string; avatar: string }) => void;
  onNavigateToHome: () => void;
  onNavigateToIPList: () => void;
  onUpdateCollection?: (items: CollectionItem[]) => void;
  onSave?: (item: CollectionItem) => void; // <--- [新增] 添加这一行
}

const ProfileView: React.FC<ProfileViewProps> = ({ items, profile, onUpdateProfile, onNavigateToHome, onNavigateToIPList, onUpdateCollection, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localName, setLocalName] = useState(profile.name);
  const [localBio, setLocalBio] = useState(profile.bio);
  const [showDataDrawer, setShowDataDrawer] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const stats = useMemo(() => {
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalDomains = new Set(items.map(i => i.ip)).size;
    
    const totalSpent = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalEarned = items
      .filter(i => i.status === ItemStatus.SOLD)
      .reduce((sum, i) => sum + ((i.soldPrice || 0) * (i.soldQuantity || i.quantity)), 0);

    const formatK = (val: number) => {
      if (val >= 1000) return (val / 1000).toFixed(1) + 'k';
      return val.toString();
    };

    return {
      totalItems: totalItems.toString(),
      totalDomains: totalDomains.toString(),
      totalSpent: formatK(totalSpent),
      totalEarned: formatK(totalEarned)
    };
  }, [items]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateProfile({ ...profile, avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownloadTemplate = () => {
    const headers = ['名称', '来源类型','IP', '角色', '分类', '购入单价', '购入数量', '当前状态', '付款状态', '定金金额', '尾款金额', '购入日期', '卖出单价', '卖出数量', '备注', '图片链接'];
    const csvContent = '\ufeff' + headers.join(',');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', '求求你别再买了导入模板.csv');
    link.click();
  };

  const handleExportCSV = () => {
    if (items.length === 0) {
      alert('当前没有可导出的数据');
      return;
    }
    const headers = [ '名称', '来源类型','IP', '角色', '分类', '购入单价', '购入数量', '当前状态', '付款状态', '定金金额', '尾款金额', '购入日期', '卖出单价', '卖出数量', '备注', '图片链接'];
    const rows = items.map(item => [
      item.name,                // 名称
      item.sourceType,          // 来源类型
      item.ip,                  // IP
      item.character,           // 角色
      item.category,            // 分类
      item.price,               // 购入单价
      item.quantity,            // 购入数量
      item.status,              // 当前状态
      item.paymentStatus,       // 付款状态
      item.depositAmount,       // 定金金额
      item.finalPaymentAmount,  // 尾款金额
      item.purchaseDate,        // 购入日期
      item.soldPrice,           // 卖出单价
      item.soldQuantity,        // 卖出数量
      item.notes,               // 备注
      item.imageUrl             // 图片链接
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `gumi_collection_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
    setShowDataDrawer(false);
  };

  const parseCSV = (text: string): Partial<CollectionItem>[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length <= 1) return [];
    

    // [核心升级] 使用一个更健壮的 CSV 行解析函数
    const parseCsvRow = (row: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < row.length; i++) {
        const char = row[i];
        if (char === '"') {
          if (inQuotes && row[i + 1] === '"') {
            // 处理双引号转义 ("")
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          result.push(current);
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current);
      return result;
    };

    const rows = lines.slice(1).map(line => parseCsvRow(line));


    // [核心修改] 更新解析逻辑，根据你的新列顺序来创建对象
    return rows.map(row => {
      const newItem: Partial<CollectionItem> = {
        id: Math.random().toString(36).substr(2, 9),
        name: row[0] || '未命名',                  // 名称
        sourceType: (row[15] as SourceType) || SourceType.OTHER,      // 来源类型
        ip: row[1] || '其他',                        // IP
        character: row[2] || '其他',                 // 角色
        category: (row[3] as ItemCategory) || ItemCategory.OTHER, // 分类
        price: parseFloat(row[4]) || 0,                 // 购入单价
        quantity: parseInt(row[5]) || 1,                // 购入数量
        status: (row[6] as ItemStatus) || ItemStatus.OWNED,       // 当前状态
        paymentStatus: (row[7] as PaymentStatus) || PaymentStatus.FULL, // 付款状态
        depositAmount: parseFloat(row[8]) || undefined,     // 定金金额
        finalPaymentAmount: parseFloat(row[9]) || undefined, // 尾款金额
        purchaseDate: row[10] || new Date().toISOString().split('T')[0], // 购入日期
        soldPrice: parseFloat(row[11]) || undefined,      // 卖出单价
        soldQuantity: parseInt(row[12]) || undefined,       // 卖出数量
        notes: row[13] || '',                        // 备注
        imageUrl: row[14] || `https://pics_seed/${Math.random()}/400/400`, // 图片链接
      };
      return newItem;
    });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // [修改] 检查 onSave 是否存在，而不是 onUpdateCollection
    if (file && onSave) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          // 解析 CSV 的逻辑不变
          const importedData = parseCSV(content) as CollectionItem[];

          if (importedData.length > 0) {
            // [核心修改] 循环调用 onSave，一条一条地添加和同步
            importedData.forEach(item => {
              onSave(item);
            });
            
            setImportSuccess(true);
            setTimeout(() => {
              setImportSuccess(false);
              setShowDataDrawer(false);
            }, 1500);

          } else {
            alert('未能识别有效的数据内容，请检查文件格式。');
          }
        } catch (err) {
          console.error(err);
          alert('导入失败，请检查文件格式。目前支持 JSON 和 CSV (Excel 导出格式)。');
        }
      };
      reader.readAsText(file);
    }
  };
  

  const clearCollection = () => {
    if (confirm('确定要清空所有收藏数据吗？') && onUpdateCollection) {
      onUpdateCollection([]);
    }
  };

  const toggleEdit = () => {
    if (isEditing) {
      onUpdateProfile({ ...profile, name: localName, bio: localBio });
    }
    setIsEditing(!isEditing);
  };

  useEffect(() => {
    if (isEditing && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [isEditing]);

  return (
    <div className="bg-slate-50/20 min-h-screen pb-20">
      <header className="bg-white px-5 pt-8 pb-4 sticky top-0 z-50 border-b border-slate-50 shadow-sm flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight text-[#1b0d14]">我的</h1>
      </header>

      <div className="px-5 pt-4 space-y-6">
        {/* 用户信息卡片 */}
        <div className="bg-white p-5 rounded-[2.5rem] shadow-sm border border-slate-100">
          <div className="flex items-center gap-5">
            <div className="relative shrink-0">
              <input type="file" ref={fileInputRef} onChange={handleAvatarChange} className="hidden" accept="image/*" />
              <div 
                onClick={() => isEditing && fileInputRef.current?.click()}
                className={`bg-cover bg-center rounded-full h-20 w-20 border-4 border-white shadow-md ring-4 ring-primary/5 ${isEditing ? 'cursor-pointer animate-pulse relative' : ''}`} 
                style={{ backgroundImage: `url(${profile.avatar})` }}
              >
                {isEditing && (
                   <div className="absolute inset-0 bg-black/20 rounded-full flex items-center justify-center text-white">
                      <span className="material-symbols-outlined">camera_alt</span>
                   </div>
                )}
              </div>
            </div>
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-2">
                  <input 
                    ref={nameInputRef}
                    className="w-full text-lg font-bold text-slate-900 bg-slate-50 border-none rounded-lg p-1 px-2 focus:ring-1 focus:ring-primary/20 outline-none"
                    value={localName}
                    onChange={(e) => setLocalName(e.target.value)}
                  />
                  <textarea 
                    className="w-full text-[11px] text-slate-500 bg-slate-50 border-none rounded-lg p-1 px-2 focus:ring-1 focus:ring-primary/20 outline-none min-h-[60px]"
                    value={localBio}
                    onChange={(e) => setLocalBio(e.target.value)}
                  />
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-[#111827] text-lg font-bold tracking-tight">{profile.name}</p>
                  </div>
                  <p className="text-[#6B7280] text-[11px] leading-relaxed whitespace-normal break-words">{profile.bio}</p>
                </>
              )}
              <button 
                onClick={toggleEdit}
                className={`mt-2 px-4 py-1.5 rounded-full text-[10px] font-bold transition-all shadow-sm ${isEditing ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500 hover:bg-primary/10 hover:text-primary'}`}
              >
                {isEditing ? '保存修改' : '修改个人资料'}
              </button>
            </div>
          </div>
        </div>

        {/* 快速统计 */}
        <div className="relative">
          <div className="grid grid-cols-3 gap-2.5">
            <StatMini label="总数" value={stats.totalItems} />
            <StatMini label="总购入" value={stats.totalSpent} />
            <StatMini label="总卖出" value={stats.totalEarned} />
          </div>
        </div>

        {/* 收藏管理 */}
        <div>
          <SectionHeader title="收藏管理" onMore={() => {}} />
          <div className="grid grid-cols-2 gap-3 mt-3">
            <MenuCard 
              icon="grid_view" 
              label="收藏主页" 
              subLabel="点击返回首页" 
              color="bg-blue-50 text-blue-500" 
              onClick={onNavigateToHome}
            />
            <MenuCard 
              icon="category" 
              label="IP" 
              subLabel={`已记录 ${stats.totalDomains} 个`} 
              color="bg-purple-50 text-purple-500" 
              onClick={onNavigateToIPList}
            />
          </div>
        </div>

        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden divide-y divide-slate-50">
          <ListButton icon="cloud_sync" label="云端备份与同步" info="今日 10:24" />
          <ListButton icon="import_export" label="导入导出数据记录" onClick={() => setShowDataDrawer(true)} />
          <ListButton icon="translate" label="语言与显示模式" />
          <ListButton icon="delete_forever" label="清除本地缓存空间" isDanger onClick={clearCollection} />
        </div>

        {/* Branding Footer Section */}
        <div className="pt-10 pb-16 flex flex-col items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-700 delay-300">
           <div className="relative w-20 h-20 flex items-center justify-center">
              <div className="absolute inset-0 bg-primary/5 rounded-full blur-2xl animate-pulse"></div>
              <svg 
                viewBox="0 0 200 160" 
                className="w-full h-full drop-shadow-lg animate-bounce"
                style={{ animationDuration: '4s' }}
              >
                <path d="M40 70 C10 40 10 90 40 100 Z" fill="#FFF" stroke="#2D1B0D" strokeWidth="3" />
                <path d="M160 70 C190 40 190 90 160 100 Z" fill="#FFF" stroke="#2D1B0D" strokeWidth="3" />
                <rect x="55" y="50" width="90" height="70" rx="8" fill="#E89F5D" stroke="#2D1B0D" strokeWidth="4" />
                <rect x="55" y="75" width="90" height="20" fill="#FFF" opacity="0.9" />
                <rect x="90" y="50" width="20" height="70" fill="#FFF" opacity="0.9" />
                <path d="M75 90 Q80 85 85 90 Q80 95 75 90" fill="none" stroke="#2D1B0D" strokeWidth="2" strokeLinecap="round" />
                <path d="M115 90 Q120 85 125 90 Q120 95 115 90" fill="none" stroke="#2D1B0D" strokeWidth="2" strokeLinecap="round" />
                <path d="M92 105 Q100 112 108 105" fill="#FF83A4" stroke="#2D1B0D" strokeWidth="2" strokeLinecap="round" />
                <path d="M165 45 Q175 40 185 50" fill="none" stroke="#2D1B0D" strokeWidth="2" opacity="0.4" />
                <path d="M170 55 Q178 52 185 60" fill="none" stroke="#2D1B0D" strokeWidth="2" opacity="0.3" />
              </svg>
           </div>
           
           <div className="text-center space-y-1">
              <h4 className="text-[16px] font-bold text-slate-800 tracking-wider">求求你别再买了</h4>
              <p className="text-[10px] text-slate-400 font-bold tracking-[0.2em] uppercase opacity-60">V2.5.0 STABLE</p>
           </div>
           
           <div className="flex items-center gap-2 opacity-20">
              <div className="w-6 h-[1px] bg-slate-400"></div>
              <span className="material-symbols-outlined text-[12px] text-slate-400">inventory_2</span>
              <div className="w-6 h-[1px] bg-slate-400"></div>
           </div>
        </div>
      </div>

      {/* 导入导出弹窗 - UI updated to match screenshot */}
      {showDataDrawer && (
        <div className="fixed inset-0 z-[100] flex items-end">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" onClick={() => setShowDataDrawer(false)}></div>
          <div className="relative w-full bg-white rounded-t-[2rem] shadow-2xl p-6 pb-12 animate-in slide-in-from-bottom duration-300">
            <div className="w-12 h-1 bg-slate-100 rounded-full mx-auto mb-8"></div>
            
            {importSuccess ? (
              <div className="py-12 flex flex-col items-center gap-4 animate-in zoom-in duration-300">
                <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-4xl font-bold">check</span>
                </div>
                <h3 className="text-xl font-bold text-emerald-500">导入成功</h3>
              </div>
            ) : (
              <>
                <h3 className="text-center text-[16px] font-bold text-slate-800 mb-8">导入导出数据记录</h3>
                
                <div className="space-y-4">
                  <div className="flex flex-col gap-4">
                    {/* Import Section with dashed border */}
                    <div className="relative flex flex-col items-center border-2 border-dashed border-[#7CACEF]/40 bg-white rounded-2xl p-6">
                      <button 
                        onClick={() => importInputRef.current?.click()}
                        className="flex flex-col items-center gap-2 w-full active:scale-[0.98] transition-transform"
                      >
                        <span className="material-symbols-outlined text-primary text-[32px] font-bold">publish</span>
                        <span className="text-[14px] font-bold text-slate-700">导入</span>
                        <p className="text-[11px] text-[#FF6B9D] font-bold">点击此处导入，格式为 excel</p>
                      </button>
                    </div>

                    {/* Download Template Link - Styled as small blue text */}
                    <div className="text-center">
                      <button 
                        onClick={handleDownloadTemplate}
                        className="text-[11px] text-[#7CACEF] font-bold hover:underline"
                      >
                        点击此处下载模板，格式为 excel
                      </button>
                    </div>
                  </div>

                  <input type="file" ref={importInputRef} onChange={handleImport} className="hidden" accept=".json,.csv" />

                  {/* Export Section */}
                  <button 
                    onClick={handleExportCSV}
                    className="w-full flex flex-col items-center gap-1.5 p-6 bg-[#F8F9FB] rounded-2xl active:bg-slate-100 transition-colors"
                  >
                    <span className="material-symbols-outlined text-primary text-[32px] font-bold">get_app</span>
                    <span className="text-[14px] font-bold text-slate-700">导出</span>
                    <p className="text-[11px] text-slate-400 font-bold">导出当前全部数据，格式为 excel</p>
                  </button>

                  <button 
                    onClick={() => setShowDataDrawer(false)}
                    className="w-full py-6 text-[14px] font-bold text-slate-400 active:scale-95 transition-transform"
                  >
                    取消
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const SectionHeader = ({ title, onMore }: { title: string, onMore: () => void }) => (
  <div className="flex items-center justify-between px-1">
    <h3 className="text-[#111827] text-base font-bold">{title}</h3>
    <button onClick={onMore} className="text-primary text-[12px] font-bold hover:underline">查看全部</button>
  </div>
);

const StatMini = ({ label, value }: { label: string, value: string }) => (
  <button className="flex flex-col gap-0.5 rounded-2xl bg-white py-4 items-center text-center shadow-sm border border-slate-50 active:scale-95 transition-all w-full">
    <p className="text-primary text-xl font-bold">{value}</p>
    <p className="text-[#6B7280] text-[10px] font-bold">{label}</p>
  </button>
);

const MenuCard = ({ icon, label, subLabel, color, onClick }: any) => (
  <button 
    onClick={onClick}
    className="flex flex-col gap-2.5 p-4 bg-white rounded-3xl shadow-sm border border-slate-100 active:scale-95 hover:shadow-md transition-all text-left group overflow-hidden relative"
  >
    <div className={`w-9 h-9 rounded-2xl ${color} flex items-center justify-center shadow-sm transition-transform group-hover:scale-110 group-hover:rotate-3`}>
      <span className="material-symbols-outlined text-[20px] font-bold">{icon}</span>
    </div>
    <div className="space-y-0.5">
      <p className="text-[14px] font-bold text-slate-800">{label}</p>
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-[#9CA3AF] font-medium">{subLabel}</p>
        <span className="material-symbols-outlined text-primary text-[18px] font-bold opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">arrow_forward</span>
      </div>
    </div>
  </button>
);

const ListButton = ({ icon, label, info, isDanger, onClick }: any) => (
  <button 
    onClick={onClick}
    className="flex items-center justify-between w-full p-4.5 p-4 active:bg-slate-50 transition-colors text-left group"
  >
    <div className="flex items-center gap-3.5">
      <div className={`size-9 rounded-2xl ${isDanger ? 'bg-red-50 text-red-500' : 'bg-slate-50 text-slate-400'} flex items-center justify-center transition-colors group-hover:bg-primary/10 group-hover:text-primary`}>
        <span className="material-symbols-outlined text-[20px]">{icon}</span>
      </div>
      <span className={`text-[14px] font-bold ${isDanger ? 'text-red-500' : 'text-slate-700'}`}>{label}</span>
    </div>
    <div className="flex items-center gap-1.5">
      {info && <span className="text-[10px] text-[#9CA3AF] font-bold">{info}</span>}
      <span className="material-symbols-outlined text-[#D1D5DB] text-[18px] group-active:translate-x-1 transition-all">chevron_right</span>
    </div>
  </button>
);

export default ProfileView;
