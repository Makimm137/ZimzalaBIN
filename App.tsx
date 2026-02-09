
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
  const [collection, setCollection] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CollectionItem | null>(null);

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

  // 当 session 变化时加载数据
  useEffect(() => {
    if (!session) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        // 获取周边列表
        const { data: items, error: itemsError } = await supabase
          .from('collection_items')
          .select('*')
          .order('created_at', { ascending: false });

        if (!itemsError && items) {
          const mappedItems: CollectionItem[] = items.map(it => ({
            ...it,
            imageUrl: it.image_url,
            isPinned: it.is_pinned,
            isReminderEnabled: it.is_reminder_enabled
          }));
          setCollection(mappedItems.length > 0 ? mappedItems : INITIAL_COLLECTION);
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
        setCollection(INITIAL_COLLECTION);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session]);

  const addItem = useCallback(async (item: CollectionItem) => {
    if (!session) return;

    // 乐观更新 UI
    setCollection(prev => {
      const exists = prev.find(i => i.id === item.id);
      if (exists) return prev.map(i => i.id === item.id ? item : i);
      return [item, ...prev];
    });

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
    } catch (err) {
      console.error('Save failed:', err);
    }

    setShowAddModal(false);
    setSelectedItem(null);
  }, [session]);

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

  const handleEdit = (item: CollectionItem) => {
    setSelectedItem(item);
    setShowAddModal(true);
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
              profile={profile}
              onEdit={handleEdit} 
              onToggleReminder={toggleReminder}
              onNavigateToProfile={() => setCurrentTab('profile')} 
            />
          </div>
        );
      case 'stats':
        return <div className={viewClass}><StatsView items={collection} /></div>;
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
