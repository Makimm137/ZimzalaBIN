import React, { useState, useMemo, useRef, useEffect } from 'react';
import { CollectionItem, ItemStatus } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Label } from 'recharts';
import { supabase } from '../supabase'; // [新增]

interface StatsViewProps {
}


const COLORS = ['#FF6B9D', '#7CACEF', '#FFD166', '#A5B4FC', '#D988B9', '#B8E4C9', '#FFD6A5'];
const IP_COLORS = ['#FF6B9D', '#7CACEF', '#A5B4FC', '#F472B6', '#34D399'];

// 辅助函数：获取日期是当年的第几周
function getWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

const StatsView: React.FC<StatsViewProps> = () => {
  const [statsData, setStatsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [catViewBy, setCatViewBy] = useState<'count' | 'amount'>('count');
  const [ipViewBy, setIpViewBy] = useState<'count' | 'amount'>('count');
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('all');


    // [新增] 添加 useEffect 来获取数据
  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.rpc('get_all_stats');
        if (error) throw error;
        setStatsData(data);
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);



  // 时间分布相关的状态
  const [distPeriod, setDistPeriod] = useState<'周' | '月' | '年'>('年');
  const [distRankBy, setDistRankBy] = useState<'category' | 'ip'>('category');
  const [activeDataPoint, setActiveDataPoint] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. 顶部概览数据过滤 (本周/本月/全部)
const overviewStats = useMemo(() => {
  if (!statsData) return { total: 0, sold: 0, net: 0 };
  
  let data;
  if (period === 'week') data = statsData.overview_week;
  else if (period === 'month') data = statsData.overview_month;
  else data = statsData.overview_all;
  
  const total = data?.total || 0;
  const sold = data?.sold || 0;
  return { total, sold, net: total - sold };
}, [statsData, period]);



  // 2. 动态生成时间范围列表 (从最早记录到今天)
  const allTimeData = useMemo(() => statsData?.time_dist || [], [statsData]);

  const timeRanges = useMemo(() => {
    if (!allTimeData || allTimeData.length === 0) return [];
    
    const dates = allTimeData.map(i => new Date(i.date));
    const now = new Date();
    const earliest = new Date(Math.min(...dates.map(d => d.getTime())));
    
    const ranges: string[] = [];
    const current = new Date(earliest);
    const end = new Date(now.getFullYear() + 1, 11, 31);

    if (distPeriod === '周') {
      while (current <= end) {
        const year = current.getFullYear();
        const week = getWeekNumber(current);
        const label = `${year}-${week.toString().padStart(2, '0')}周`;
        if (!ranges.includes(label)) ranges.push(label);
        current.setDate(current.getDate() + 7);
      }
    } else if (distPeriod === '月') {
      while (current <= end) {
        const label = `${current.getFullYear()}-${(current.getMonth() + 1).toString().padStart(2, '0')}月`;
        if (!ranges.includes(label)) ranges.push(label);
        current.setMonth(current.getMonth() + 1);
      }
    } else {
      while (current <= end) {
        const label = `${current.getFullYear()}年`;
        if (!ranges.includes(label)) ranges.push(label);
        current.setFullYear(current.getFullYear() + 1);
      }
    }
    return ranges;
  }, [distPeriod, allTimeData]);

  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('');

  useMemo(() => {
    const now = new Date();
    let currentLabel = "";
    if (distPeriod === '周') {
      currentLabel = `${now.getFullYear()}-${getWeekNumber(now).toString().padStart(2, '0')}周`;
    } else if (distPeriod === '月') {
      currentLabel = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}月`;
    } else {
      currentLabel = `${now.getFullYear()}年`;
    }

    if (!selectedTimeRange || !timeRanges.includes(selectedTimeRange)) {
      if (timeRanges.includes(currentLabel)) {
        setSelectedTimeRange(currentLabel);
      } else {
        setSelectedTimeRange(timeRanges[timeRanges.length - 1] || '');
      }
    }
  }, [timeRanges, distPeriod]);

  useEffect(() => {
    if (scrollRef.current && selectedTimeRange) {
      const activeBtn = scrollRef.current.querySelector('[data-active="true"]');
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [selectedTimeRange, timeRanges]);



  // 3. 根据选中的范围过滤并聚合图表数据
  const distData = useMemo(() => {
    const filtered = allTimeData.filter(i => {
      if (!i.date) return false;
      const d = new Date(i.date);
      if (distPeriod === '周') {
        return `${d.getFullYear()}-${getWeekNumber(d).toString().padStart(2, '0')}周` === selectedTimeRange;
      } else if (distPeriod === '月') {
        return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}月` === selectedTimeRange;
      } else {
        return `${d.getFullYear()}年` === selectedTimeRange;
      }
    });

    let chartPoints: { name: string, value: number, originalItems: any[] }[] = [];
    
    if (distPeriod === '周') {
      const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
      chartPoints = days.map((day, idx) => {
        const dayItems = filtered.filter(i => {
          const d = new Date(i.date);
          const dayIdx = (d.getDay() + 6) % 7;
          return dayIdx === idx;
        });
        return { name: day, value: dayItems.reduce((s, i) => s + Number(i.value), 0), originalItems: dayItems };
      });
    } else if (distPeriod === '月') {
      const [year, month] = selectedTimeRange.replace('月', '').split('-').map(Number);
      const daysInMonth = new Date(year, month, 0).getDate();
      
      chartPoints = Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1;
        const dayItems = filtered.filter(it => new Date(it.date).getDate() === day);
        return { name: day.toString().padStart(2, '0'), value: dayItems.reduce((s, i) => s + Number(i.value), 0), originalItems: dayItems };
      });
    } else {
      chartPoints = Array.from({ length: 12 }, (_, i) => {
        const monthItems = filtered.filter(it => new Date(it.date).getMonth() === i);
        return { name: `${i + 1}月`, value: monthItems.reduce((s, i) => s + Number(i.value), 0), originalItems: monthItems };
      });
    }

    const total = chartPoints.reduce((s, p) => s + p.value, 0);
    const nonEmptyPoints = chartPoints.filter(p => p.value > 0);
    const avg = nonEmptyPoints.length > 0 ? total / nonEmptyPoints.length : 0;
    const maxVal = Math.max(...chartPoints.map(p => p.value), 0);

    const rankingMap: Record<string, number> = {};
    filtered.forEach(i => {
      const key = distRankBy === 'category' ? i.category : (i.ip || '其他');
      rankingMap[key] = (rankingMap[key] || 0) + Number(i.value);
    });
    const ranking = Object.entries(rankingMap)
      .map(([name, value]) => ({ name, value, percent: total > 0 ? (value / total * 100).toFixed(1) : '0' }))
      .sort((a, b) => b.value - a.value);

    return { chartPoints, total, avg, maxVal, ranking };
  }, [allTimeData, distPeriod, selectedTimeRange, distRankBy]);





const categoryData = useMemo(() => {
  if (!statsData) return []; // 使用新的 statsData
  const data = catViewBy === 'count' ? statsData.category_dist_count : statsData.category_dist_amount;
  return (data || []).filter(d => d.name);
}, [statsData, catViewBy]);


const ipStats = useMemo(() => {
  if (!statsData) return [];
  const data = ipViewBy === 'count' ? statsData.ip_dist_count : statsData.ip_dist_amount;
  return data || [];
}, [statsData, ipViewBy]);



  const maxIpValue = Math.max(...ipStats.map(s => s.value), 1);


  // [新增] 在这里添加 loading UI
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="text-slate-400 text-xs font-bold animate-pulse">正在计算统计数据...</p>
      </div>
    );
  }
    

  return (
    <div className="animate-in fade-in duration-500 bg-[#F8F9FB] min-h-screen">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md px-5 pt-6 pb-3 border-b border-slate-50 shadow-sm">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">数据统计</h1>
      </header>

      <div className="p-4 space-y-6 pb-24">
        {/* 概览卡片 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
            <div className="flex justify-between items-start mb-4">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">总投入 (元)</p>
              <div className="flex bg-slate-100 rounded-full p-1 shadow-inner gap-0.5 border border-slate-200">
                {(['week', 'month', 'all'] as const).map(p => (
                  <button 
                    key={p} 
                    onClick={() => setPeriod(p)} 
                    className={`px-3 py-1 text-[10px] font-bold rounded-full transition-all ${period === p ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}
                  >
                    {p === 'week' ? '周' : p === 'month' ? '月' : '全面'}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-between items-end">
              <h2 className="text-4xl font-bold text-slate-900 tracking-tight">¥{overviewStats.total.toLocaleString()}</h2>
            </div>
            <div className="mt-6 h-2.5 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 shadow-inner">
              <div 
                className="h-full bg-primary rounded-full shadow-lg shadow-primary/10 transition-all duration-700 ease-out" 
                style={{ width: `${Math.min(100, (overviewStats.total / (period === 'all' ? 5000 : 1000)) * 100)}%` }}
              ></div>
            </div>
          </div>
          <StatCard title="已回血" value={`¥${overviewStats.sold.toLocaleString()}`} color="text-emerald-500" />
          <StatCard title="净投入" value={`¥${overviewStats.net.toLocaleString()}`} color="text-slate-900" />
        </div>

        {/* 时间分布板块 */}
        <section className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden relative">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="bg-primary/10 p-1.5 rounded-xl flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-primary text-[22px]">timeline</span>
              </div>
              <h3 className="text-base font-bold text-slate-800">时间分布</h3>
            </div>
            <div className="flex bg-slate-100 border border-slate-100 rounded-full p-1 shadow-inner gap-1">
              {(['周', '月', '年'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => { setDistPeriod(p); setActiveDataPoint(null); }}
                  className={`px-3 py-1 text-[10px] font-bold rounded-full transition-all ${distPeriod === p ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* 时间轴滚动轴 */}
          <div 
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto hide-scrollbar mb-6 pb-2 border-b border-slate-50"
          >
            {timeRanges.map(range => (
              <button
                key={range}
                data-active={selectedTimeRange === range}
                onClick={() => { setSelectedTimeRange(range); setActiveDataPoint(null); }}
                className={`shrink-0 text-[14px] font-bold transition-all relative pb-2 ${selectedTimeRange === range ? 'text-slate-900' : 'text-slate-300'}`}
              >
                {range}
                {selectedTimeRange === range && (
                  <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-slate-900 rounded-full"></div>
                )}
              </button>
            ))}
          </div>

          <div className="space-y-1.5 mb-6">
            <p className="text-slate-400 text-xs font-bold">总支出: <span className="text-slate-900 ml-1">{distData.total.toFixed(2)}</span></p>
            <p className="text-slate-400 text-xs font-bold">平均值: <span className="text-slate-900 ml-1">{distData.avg.toFixed(2)}</span></p>
          </div>

          {/* 折线图 - 修正 XAxis 以显示所有月份 (9月, 11月等) */}
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={distData.chartPoints} 
                margin={{ top: 30, right: 15, left: 15, bottom: 5 }}
                onClick={(data: any) => {
                  if (data && data.activePayload && data.activePayload.length > 0) {
                    setActiveDataPoint(data.activePayload[0].payload);
                  }
                }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }} 
                  dy={10}
                  padding={{ left: 10, right: 10 }}
                  interval={0} // CRITICAL: 强制显示所有刻度标签，不再跳过 9月, 11月
                />
                <YAxis hide domain={[0, 'auto']} />
                <Tooltip content={() => null} />
                
                {distData.maxVal > 0 && (
                  <ReferenceLine 
                    y={distData.maxVal} 
                    stroke="#FF6B9D" 
                    strokeWidth={1} 
                    strokeDasharray="5 5" 
                  >
                    <Label 
                      value={distData.maxVal.toFixed(2)} 
                      position="top" 
                      fill="#FF6B9D" 
                      fontSize={11} 
                      fontWeight={700}
                      offset={10}
                    />
                  </ReferenceLine>
                )}

                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#1E293B" 
                  strokeWidth={2.5} 
                  dot={{ r: 4, fill: '#fff', stroke: '#1E293B', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#FF6B9D', stroke: '#1E293B', strokeWidth: 2 }}
                  animationDuration={800}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* 排行榜 - 带有类型/IP切换 */}
          <div className="mt-8 border-t border-slate-50 pt-6">
             <div className="flex items-center justify-between mb-5 px-1">
                <h4 className="text-xs font-bold text-slate-400 tracking-widest uppercase">支出排行榜</h4>
                <div className="flex bg-slate-50 border border-slate-100 rounded-full p-0.5 gap-0.5 shadow-inner">
                   <button 
                     onClick={() => setDistRankBy('category')}
                     className={`px-3 py-1 text-[9px] font-bold rounded-full transition-all ${distRankBy === 'category' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                   >
                     按类型
                   </button>
                   <button 
                     onClick={() => setDistRankBy('ip')}
                     className={`px-3 py-1 text-[9px] font-bold rounded-full transition-all ${distRankBy === 'ip' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                   >
                     按IP
                   </button>
                </div>
             </div>
             
             <div className="space-y-6 pb-2">
                {distData.ranking.length > 0 ? distData.ranking.map((item) => (
                  <div key={item.name} className="flex flex-col gap-2.5">
                    <div className="flex justify-between items-center text-[12px] px-1">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-[18px] text-slate-400">
                               {distRankBy === 'category' ? 'category' : 'interests'}
                            </span>
                          </div>
                          <span className="font-bold text-slate-700 truncate max-w-[120px]">{item.name}</span>
                          <span className="text-slate-300 font-bold shrink-0">{item.percent}%</span>
                       </div>
                       <span className="font-bold text-slate-900 shrink-0">¥{item.value.toFixed(0)}</span>
                    </div>
                    <div className="pl-11 pr-1">
                      <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden shadow-inner">
                         <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${item.percent}%` }}></div>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="flex flex-col items-center justify-center py-10 gap-4 opacity-30">
                    <span className="material-symbols-outlined text-slate-400 text-5xl">money_off</span>
                    <p className="text-slate-400 text-[13px] font-bold">没有费用</p>
                  </div>
                )}
             </div>
          </div>

          {/* 数据点详情浮层 */}
          {activeDataPoint && activeDataPoint.value > 0 && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 bg-[#1E293B] rounded-2xl shadow-2xl p-5 z-50 animate-in zoom-in fade-in duration-300">
               <div className="bg-[#334155] rounded-xl py-2.5 px-3 mb-5 text-center">
                  <h5 className="text-white text-[11px] font-bold tracking-widest">交易明细</h5>
               </div>
               
               <div className="space-y-5">
                  {[...activeDataPoint.originalItems]
                    .sort((a, b) => (b.price * b.quantity) - (a.price * a.quantity))
                    .slice(0, 3)
                    .map((tx, i) => (
                      <div key={i} className="flex items-center justify-between text-white text-[12px]">
                         <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                               <span className="material-symbols-outlined text-white text-lg">
                                  {tx.category === '手办' ? 'toys' : tx.category === '吧唧' ? 'cookie' : 'category'}
                               </span>
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-slate-400 text-[10px] font-bold">{tx.purchaseDate?.replace(/-/g, '/')}</span>
                              <span className="text-white font-bold truncate max-w-[90px]">{tx.name}</span>
                            </div>
                         </div>
                         <span className="font-bold text-[#FFD166]">¥{tx.price * tx.quantity}</span>
                      </div>
                  ))}
               </div>

               <div className="mt-6 pt-5 border-t border-white/10 flex justify-between items-center">
                  <span className="text-slate-400 text-[11px] font-bold">阶段总支出：</span>
                  <span className="text-white text-[14px] font-bold">¥{activeDataPoint.value.toFixed(0)}</span>
               </div>

               <button 
                 onClick={() => setActiveDataPoint(null)}
                 className="absolute -top-3 -right-3 size-9 bg-[#1E293B] border border-white/20 text-white rounded-full flex items-center justify-center shadow-xl active:scale-90 transition-transform"
               >
                 <span className="material-symbols-outlined text-base">close</span>
               </button>
            </div>
          )}
        </section>

        {/* 类型分布 */}
        <section className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
          <SectionHeader title="类型分布" icon="pie_chart" viewBy={catViewBy} setViewBy={setCatViewBy} />
          <div className="flex flex-col items-center justify-between gap-8 mt-6">
            <div className="relative w-44 h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={6} dataKey="value" animationDuration={1000}>
                    {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-[10px] text-slate-400 font-bold mb-1">{catViewBy === 'count' ? '总件数' : '总金额'}</span>
                <span className="text-xl font-bold text-slate-900 leading-none">{catViewBy === 'count'  ? (statsData?.category_dist_count || []).reduce((s, i) => s + i.value, 0) : `¥${overviewStats.total.toLocaleString()}`}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 w-full">
              {categoryData.map((d, i) => (
                <div key={d.name} className="flex items-center justify-between text-xs p-3 rounded-2xl bg-slate-50/50">
                  <div className="flex items-center gap-3"><div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div><span className="text-slate-600 font-bold">{d.name}</span></div>
                  <span className="font-bold text-slate-900">{catViewBy === 'count' ? `${d.value} 件` : `¥${d.value.toLocaleString()}`}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
          <SectionHeader title="所属IP" icon="bar_chart" viewBy={ipViewBy} setViewBy={setIpViewBy} />
          <div className="space-y-6 mt-6">
            {ipStats.map((stat, i) => (
              <div key={stat.name} className="space-y-3">
                <div className="flex justify-between items-end">
                  <div className="flex items-center gap-2">
                    <div className="size-2 rounded-full" style={{ backgroundColor: IP_COLORS[i % IP_COLORS.length] }}></div>
                    <span className="text-sm font-bold text-slate-800">{stat.name}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-400">{ipViewBy === 'count' ? `${stat.value} 件` : `¥${stat.value.toLocaleString()}`}</span>
                </div>
                <div className="h-3.5 w-full bg-slate-50 rounded-full overflow-hidden p-0.5 shadow-inner">
                  <div className="h-full rounded-full transition-all duration-1000 ease-out shadow-sm" style={{ width: `${(stat.value / maxIpValue) * 100}%`, backgroundColor: IP_COLORS[i % IP_COLORS.length] }}></div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, color }: { title: string, value: string, color: string }) => (
  <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
    <p className="text-slate-400 text-[10px] font-bold mb-2 uppercase tracking-wider">{title}</p>
    <h3 className={`text-2xl font-bold ${color} leading-none tracking-tight`}>{value}</h3>
  </div>
);

const SectionHeader = ({ title, icon, viewBy, setViewBy }: { title: string, icon: string, viewBy: 'count' | 'amount', setViewBy: (v: 'count' | 'amount') => void }) => (
  <div className="flex items-center justify-between">
    <h3 className="text-base font-bold flex items-center gap-2.5 text-slate-800">
      <div className="bg-primary/10 p-1.5 rounded-xl flex items-center justify-center shadow-sm">
        <span className="material-symbols-outlined text-primary text-[22px]">{icon}</span>
      </div>
      {title}
    </h3>
    <div className="flex bg-slate-100 border border-slate-100 rounded-full p-1 shadow-inner gap-1">
      <button onClick={() => setViewBy('count')} className={`px-3 py-1 text-[10px] font-bold rounded-full transition-all ${viewBy === 'count' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>按数量</button>
      <button onClick={() => setViewBy('amount')} className={`px-3 py-1 text-[10px] font-bold rounded-full transition-all ${viewBy === 'amount' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>按金额</button>
    </div>
  </div>
);

export default StatsView;
