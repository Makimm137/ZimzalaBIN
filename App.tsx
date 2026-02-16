
import React, { useState, useCallback, useEffect } from 'react';
import { ViewState, CollectionItem, ItemStatus } from './types';
import { INITIAL_COLLECTION } from './constants';
import HomeView from './components/HomeView';
import StatsView from './components/StatsView';
import ProfileView from './components/ProfileView';
import AddItemView from './components/AddItemView';
import IPListView from './components/IPListView';
import LoginView from './components/LoginView';
import { supabase } from './supabase';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [currentTab, setCurrentTab] = useState<ViewState['currentTab']>('home');
  const [collection, setCollection] = useState<CollectionItem[]>(() => {
    try {
      const savedCollection = localStorage.getItem('collectionCache');
      if (savedCollection) {
        const parsed = JSON.parse(savedCollection);
        // [核心修改] 只提取“摘要”字段，确保初始数据是轻量级的
        return parsed.map(item => ({
          id: item.id,
          name: item.name,
          ip: item.ip,
          character: item.character,
          category: item.category,
          status: item.status, // <--- [新增]
          purchaseDate: item.purchaseDate, // <--- [新增]
          // 其他字段暂时为空或默认值
        }));
      }
      return [];
    } catch (error) {
      console.error("Failed to parse collection cache:", error);
      return [];
    }
  });
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [totalCount, setTotalCount] = useState(0); 
  const [selectedItem, setSelectedItem] = useState<CollectionItem | null>(null);
  // [新增] 添加这两个 state
  const [page, setPage] = useState(0); // 当前页码，从0开始
  const [hasMore, setHasMore] = useState(true); // 是否还有更多数据？？？？
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [filterOptions, setFilterOptions] = useState<{ allIps: string[], allCharacters: string[] }>({ allIps: [], allCharacters: [] });

  const [profile, setProfile] = useState({
    name: '收藏家',
    bio: 'KPOP & Anime Enthusiast | 永远为热爱买单',
    avatar: 'https://picsum.photos/seed/user-avatar/100/100'
  });

  // 监听认证状态
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);



  const fetchData = useCallback(async () => {
    if (!session) {
      // 如果 session 不存在，清空数据并返回
      setCollection([]);
      setPage(0);
      setHasMore(true);
      setLoading(false); // 确保结束加载状态
      localStorage.removeItem('collectionCache');
      return;
    }

    try {
      setLoading(true);
      setPage(0);
      setHasMore(true);
      const itemsPerPage = 21;

      // 获取筛选器选项
      const { data: filters, error: filtersError } = await supabase.rpc('get_all_filters');
      if (!filtersError && filters) {
        setFilterOptions({
          allIps: filters.all_ips || [],
          allCharacters: filters.all_characters || [],
        });
      }

      // 获取第一页数据
      const { data: items, error: itemsError, count } = await supabase
        .from('collection_items')
        .select('*', { count: 'exact' })
        .order('is_pinned', { ascending: false })
        .order('purchase_date', { ascending: false })
        .range(0, itemsPerPage - 1);

      if (count !== null) {
        setTotalCount(count);
      }

      if (!itemsError && items) {
        const mappedItems: CollectionItem[] = items.map(it => ({
          ...it,
          imageUrl: it.image_url,
          isPinned: it.is_pinned,
          isReminderEnabled: it.is_reminder_enabled,
          purchaseDate: it.purchase_date,
          soldPrice: it.sold_price,
          soldQuantity: it.sold_quantity,
          sourceType: it.source_type,
          depositAmount: it.deposit_amount,
          finalPaymentAmount: it.final_payment_amount,
          paymentStatus: it.payment_status,
        }));
        
        setCollection(mappedItems);

        // 更新缓存
        const summaryItems = mappedItems.map(item => ({
          id: item.id, name: item.name, ip: item.ip, character: item.character,
          category: item.category, status: item.status, purchaseDate: item.purchaseDate,
        }));
        localStorage.setItem('collectionCache', JSON.stringify(summaryItems));

        if (items.length < itemsPerPage) {
          setHasMore(false);
        }
      } else {
        setCollection([]);
        localStorage.removeItem('collectionCache');
      }


        // 获取个人资料
        const { data: profData, error: profError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (!profError && profData) {
          setProfile({
            name: profData.name || '收藏家',
            bio: profData.bio || '还没有简介',
            avatar: profData.avatar || 'https://picsum.photos/seed/user-avatar/100/100'
          });
        } else if (profError && profError.code === 'PGRST116') {
          // 如果没有 Profile，创建一个初始的
          const initialProfile = {
            id: session.user.id,
            name: session.user.email?.split('@')[0] || '收藏家',
            bio: '永远为热爱买单',
            avatar: 'https://picsum.photos/seed/user-avatar/100/100'
          };
          await supabase.from('profiles').upsert(initialProfile);
          setProfile({ name: initialProfile.name, bio: initialProfile.bio, avatar: initialProfile.avatar });
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setCollection([]);
        localStorage.removeItem('collectionCache');
      } finally {
        setLoading(false);
      }
    }, [session]); 

      // 当 session 变化时加载数据
      useEffect(() => {
        fetchData();
      }, [session, fetchData]); 


  // [新增] 创建加载更多的函数
  const loadMore = useCallback(async () => {
    if (!session || !hasMore || isLoadingMore) return;

    setIsLoadingMore(true); // [新增] 开始加载
    const nextPage = page + 1;
    const itemsPerPage = 21; // 每次加载21条
    const from = nextPage * itemsPerPage;
    const to = from + itemsPerPage - 1;

    try {
      const { data: newItems, error } = await supabase
        .from('collection_items')
        .select('*')
        .order('purchase_date', { ascending: false })
        .range(from, to); // [核心] 使用 .range() 来获取特定范围的数据

      if (error) throw error;

  if (newItems && newItems.length > 0) {
    // [修正] 加上和你 fetchData 中完全一样的映射逻辑
    const mappedItems: CollectionItem[] = newItems.map(it => ({
      ...it,
      imageUrl: it.image_url,
      isPinned: it.is_pinned,
      isReminderEnabled: it.is_reminder_enabled,
      purchaseDate: it.purchase_date,
      soldPrice: it.sold_price,
      soldQuantity: it.sold_quantity,
      sourceType: it.source_type,
      depositAmount: it.deposit_amount,
      finalPaymentAmount: it.final_payment_amount,
      paymentStatus: it.payment_status,
    }));
    // 2. 更新 React state，让界面显示完整数据 (这部分不变)
    setCollection(prev => [...prev, ...mappedItems]);
    setPage(nextPage);

    // 3. [核心修改] 更新 localStorage 缓存
    try {
      // 读取旧的“摘要”缓存
      const savedCollection = localStorage.getItem('collectionCache');
      const oldSummaryItems = savedCollection ? JSON.parse(savedCollection) : [];
      
      // 为新加载的数据创建“摘要”
      const newSummaryItems = mappedItems.map(item => ({
        id: item.id,
        name: item.name,
        ip: item.ip,
        character: item.character,
        category: item.category,
        status: item.status, // <--- [新增]
        purchaseDate: item.purchaseDate, // <--- [新增]
      }));

      // 合并旧摘要和新摘要
      const updatedSummary = [...oldSummaryItems, ...newSummaryItems];
      
      // 把合并后的完整摘要列表存回 localStorage
      localStorage.setItem('collectionCache', JSON.stringify(updatedSummary));
    } catch (error) {
      console.error("Failed to update collection cache:", error);
    }
  }

      // 如果返回的数据少于请求的数量，说明没有更多了
      if (!newItems || newItems.length < itemsPerPage) {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Failed to load more data:', err);
    } finally {
      setIsLoadingMore(false); // [新增] 结束加载
    }
  }, [session, page, hasMore, isLoadingMore]); // [修改] 加上 isLoadingMore 依赖




  const addItem = useCallback(async (item: CollectionItem) => {
    if (!session) return;


    // 同步到 Supabase
    try {
      const { error } = await supabase
        .from('collection_items')
        .upsert({
          id: item.id,
          user_id: session.user.id,
          name: item.name,
          ip: item.ip,
          character: item.character,
          price: item.price,
          status: item.status,
          category: item.category,
          image_url: item.imageUrl,
          quantity: item.quantity,
          purchase_date: item.purchaseDate,
          notes: item.notes,
          sold_price: item.soldPrice,
          sold_quantity: item.soldQuantity,
          deposit_amount: item.depositAmount,
          final_payment_amount: item.finalPaymentAmount,
          payment_status: item.paymentStatus,
          source_type: item.sourceType,
          is_pinned: item.isPinned,
          is_reminder_enabled: item.isReminderEnabled
        });
      
      if (error) throw error;
      fetchData(); 
    } catch (err) {
      console.error('Save failed:', err);
      fetchData();
    }

    setShowAddModal(false);
    setSelectedItem(null);
  }, [session, fetchData]); 

  const togglePin = useCallback(async (id: string) => {
    const item = collection.find(i => i.id === id);
    if (!item) return;

    const newPinnedStatus = !item.isPinned;
    setCollection(prev => prev.map(it => it.id === id ? { ...it, isPinned: newPinnedStatus } : it));

    await supabase.from('collection_items').update({ is_pinned: newPinnedStatus }).eq('id', id);
  }, [collection]);

  const toggleReminder = useCallback(async (id: string) => {
    const item = collection.find(i => i.id === id);
    if (!item) return;

    const newReminderStatus = !item.isReminderEnabled;
    setCollection(prev => prev.map(it => it.id === id ? { ...it, isReminderEnabled: newReminderStatus } : it));

    await supabase.from('collection_items').update({ is_reminder_enabled: newReminderStatus }).eq('id', id);
  }, [collection]);

const handleEdit = async (item: CollectionItem) => {
  // 1. 先用缓存里的“摘要”数据打开编辑窗口，让界面立刻响应
  setSelectedItem(item);
  setShowAddModal(true);

  try {
    // 2. 在后台根据 id 去数据库获取完整的、最新的数据
    const { data: fullItem, error } = await supabase
      .from('collection_items')
      .select('*')
      .eq('id', item.id)
      .single(); // 获取单条记录

    if (error) throw error;

    if (fullItem) {
      // 3. [核心] 获取到完整数据后，用它来更新 selectedItem state
      //    这会自动触发 AddItemView 的重新渲染，显示出所有详细信息
      const mappedFullItem: CollectionItem = {
          ...fullItem,
          // ... (这里是你完整的字段映射逻辑)
      };
      setSelectedItem(mappedFullItem);
    }
  } catch (err) {
    console.error("Failed to fetch full item details:", err);
    // 即使获取详情失败，用户依然可以在只有摘要信息的表单上进行编辑
  }
};

  const updateProfile = useCallback(async (newProfile: typeof profile) => {
    if (!session) return;
    setProfile(newProfile);
    try {
      await supabase.from('profiles').upsert({
        id: session.user.id,
        name: newProfile.name,
        bio: newProfile.bio,
        avatar: newProfile.avatar,
        updated_at: new Date()
      });
    } catch (err) {
      console.error('Profile update failed:', err);
    }
  }, [session]);

  // [新增] 创建一个退出登录的函数
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };


  if (!session) {
    return <LoginView onLoginSuccess={() => {}} />;
  }

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <p className="text-slate-400 text-xs font-bold animate-pulse">正在同步云端收藏...</p>
        </div>
      );
    }

    const viewClass = "animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out fill-mode-both";
    
    switch (currentTab) {
      case 'home':
        return (
          <div className={viewClass}>
            <HomeView 
              items={collection} 
              totalCount={totalCount} 
              allIps={filterOptions.allIps}
              allCharacters={filterOptions.allCharacters}
              profile={profile}
              onEdit={handleEdit} 
              onToggleReminder={toggleReminder}
              onNavigateToProfile={() => setCurrentTab('profile')} 
              onSignOut={handleSignOut} // <--- [新增] 加上这一行
            />


             {/* [新增] 在 HomeView 下方添加加载更多按钮 */}
            {hasMore && (
              <div className="p-4 flex justify-center">
                <button 
                  onClick={loadMore}
                  disabled={isLoadingMore}
                  className="px-6 py-2 bg-slate-100 text-slate-600 font-bold text-sm rounded-full active:scale-95 transition-transform disabled:opacity-50"
                >
                  {isLoadingMore ? '加载中...' : '加载更多'}
                </button>
              </div>
            )}
          </div>
        );

      case 'stats':
        return <div className={viewClass}><StatsView /></div>; 
      case 'profile':
        return (
          <div className={viewClass}>
            <ProfileView 
              items={collection} 
              profile={profile} 
              onUpdateProfile={updateProfile} 
              onNavigateToHome={() => setCurrentTab('home')}
              onNavigateToIPList={() => setCurrentTab('ip-list')}
              onUpdateCollection={setCollection}
              onSave={addItem} // <--- [新增] 就是在这里加一行
            />
          </div>
        );
      case 'ip-list':
        return (
          <div className={viewClass}>
            <IPListView 
              items={collection} 
              onBack={() => setCurrentTab('profile')}
              onEdit={handleEdit}
              onTogglePin={togglePin}
            />
          </div>
        );
      default:
        return <HomeView items={collection} profile={profile} onEdit={handleEdit} onToggleReminder={toggleReminder} onNavigateToProfile={() => setCurrentTab('profile')} />;
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen relative shadow-2xl overflow-x-hidden">
      <div className="pb-24">
        {renderContent()}
      </div>

      <nav className="fixed bottom-0 w-full max-w-md bg-white/95 backdrop-blur-md border-t border-slate-100 flex items-center justify-between px-10 pt-3 pb-8 z-50">
        <NavItem 
          icon="home" 
          active={currentTab === 'home' || currentTab === 'profile' || currentTab === 'ip-list'} 
          onClick={() => setCurrentTab('home')} 
        />
        
        <div className="relative -top-2 px-4">
          <button 
            onClick={() => {
              setSelectedItem(null);
              setShowAddModal(true);
            }}
            className="w-14 h-14 bg-primary rounded-full shadow-lg shadow-primary/40 flex items-center justify-center text-white border-4 border-white active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined text-3xl font-bold">add</span>
          </button>
        </div>

        <NavItem 
          icon="leaderboard" 
          active={currentTab === 'stats'} 
          onClick={() => setCurrentTab('stats')} 
        />
      </nav>

      {showAddModal && (
        <div className="fixed inset-0 z-[100] bg-black/20 backdrop-blur-sm">
          <div className="absolute inset-x-0 bottom-0 top-12 bg-white rounded-t-3xl shadow-2xl overflow-y-auto hide-scrollbar">
            <AddItemView 
              onClose={() => {
                setShowAddModal(false);
                setSelectedItem(null);
              }} 
              onSave={addItem}
              editItem={selectedItem}
            />
          </div>
        </div>
      )}
    </div>
  );
};

interface NavItemProps {
  icon: string;
  active: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex items-center justify-center transition-all w-16 h-12 ${active ? 'text-primary' : 'text-slate-400'}`}
  >
    <span className={`material-symbols-outlined text-[32px] ${active ? 'fill-[1]' : ''}`}>{icon}</span>
  </button>
);

export default App;