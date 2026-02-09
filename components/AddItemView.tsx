
import React, { useState, useRef, useEffect } from 'react';
import { CollectionItem, ItemStatus, ItemCategory, PaymentStatus, SourceType } from '../types';

const Field: React.FC<{ label: string; children: React.ReactNode; required?: boolean }> = ({ label, children, required }) => (
  <label className="flex flex-col w-full">
    <div className="flex items-center gap-1 pb-2">
      <p className="text-slate-500 text-sm font-medium">{label}</p>
      {required && <span className="text-primary font-bold">*</span>}
    </div>
    {children}
  </label>
);

interface AddItemViewProps {
  onClose: () => void;
  onSave: (item: CollectionItem) => void;
  editItem?: CollectionItem | null;
}

const AddItemView: React.FC<AddItemViewProps> = ({ onClose, onSave, editItem }) => {
  const [formData, setFormData] = useState<CollectionItem>({
    id: editItem?.id || '',
    name: editItem?.name || '',
    ip: editItem?.ip || '',
    character: editItem?.character || '',
    price: editItem?.price || 0,
    soldPrice: editItem?.soldPrice || 0,
    soldQuantity: editItem?.soldQuantity || editItem?.quantity || 1,
    depositAmount: editItem?.depositAmount || 0,
    finalPaymentAmount: editItem?.finalPaymentAmount || 0,
    status: editItem?.status || ItemStatus.OWNED,
    paymentStatus: editItem?.paymentStatus || PaymentStatus.FULL,
    category: editItem?.category || ItemCategory.BADGE,
    sourceType: editItem?.sourceType || SourceType.ANIME,
    quantity: editItem?.quantity || 1,
    purchaseDate: editItem?.purchaseDate || new Date().toISOString().split('T')[0],
    notes: editItem?.notes || '',
    imageUrl: editItem?.imageUrl || ''
  });

  const [categories, setCategories] = useState<string[]>(Object.values(ItemCategory));
  const [sources, setSources] = useState<string[]>(Object.values(SourceType));
  const [isManagingSources, setIsManagingSources] = useState(false);
  const [isManagingCategories, setIsManagingCategories] = useState(false);
  const [isAddingSource, setIsAddingSource] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newSourceValue, setNewSourceValue] = useState('');
  const [newCategoryValue, setNewCategoryValue] = useState('');

  const sourceInputRef = useRef<HTMLInputElement>(null);
  const categoryInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAddingSource && sourceInputRef.current) sourceInputRef.current.focus();
    if (isAddingCategory && categoryInputRef.current) categoryInputRef.current.focus();
  }, [isAddingSource, isAddingCategory]);

  // 联动逻辑：确保卖出数量不超过买入数量
  useEffect(() => {
    if (formData.soldQuantity && formData.soldQuantity > formData.quantity) {
      setFormData(prev => ({ ...prev, soldQuantity: prev.quantity }));
    }
  }, [formData.quantity]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    
    const finalPrice = formData.paymentStatus === PaymentStatus.DEPOSIT 
      ? (Number(formData.depositAmount) + Number(formData.finalPaymentAmount))
      : Number(formData.price);

    const newItem: CollectionItem = {
      ...formData,
      price: finalPrice,
      id: formData.id || Date.now().toString(),
      // 如果不是卖出状态，清除卖出相关字段
      soldPrice: formData.status === ItemStatus.SOLD ? formData.soldPrice : undefined,
      soldQuantity: formData.status === ItemStatus.SOLD ? formData.soldQuantity : undefined,
    };
    onSave(newItem);
  };

  const handleAddSource = () => {
    if (newSourceValue.trim() && !sources.includes(newSourceValue.trim())) {
      setSources(prev => [...prev, newSourceValue.trim()]);
    }
    setNewSourceValue('');
    setIsAddingSource(false);
  };

  const handleAddCategory = () => {
    if (newCategoryValue.trim() && !categories.includes(newCategoryValue.trim())) {
      setCategories(prev => [...prev, newCategoryValue.trim()]);
    }
    setNewCategoryValue('');
    setIsAddingCategory(false);
  };

  const removeCategory = (cat: string) => {
    setCategories(prev => prev.filter(c => c !== cat));
  };

  const removeSource = (source: string) => {
    setSources(prev => prev.filter(s => s !== source));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({...prev, imageUrl: reader.result as string}));
      };
      reader.readAsDataURL(file);
    }
  };

  // 简单的点击重排序逻辑 (模拟长按拖拽)
  const moveItem = (list: string[], setList: (l: string[]) => void, index: number, direction: 'up' | 'down') => {
    const newList = [...list];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newList.length) {
      [newList[index], newList[targetIndex]] = [newList[targetIndex], newList[index]];
      setList(newList);
    }
  };

  return (
    <div className="flex flex-col min-h-full pb-24">
      <header className="sticky top-0 z-50 flex items-center bg-white/95 backdrop-blur-md p-4 justify-between border-b border-slate-50 shadow-sm">
        <button onClick={onClose} className="text-slate-400 flex size-10 items-center justify-center hover:bg-slate-100 rounded-full transition-colors">
          <span className="material-symbols-outlined">close</span>
        </button>
        <h1 className="text-slate-900 text-lg font-bold flex-1 text-center">
          {editItem ? '编辑周边记录' : '添加周边记录'}
        </h1>
        <div className="size-10 flex items-center justify-end">
          <button onClick={handleSubmit} className="text-primary text-base font-bold active:scale-95 transition-transform">保存</button>
        </div>
      </header>

      <main className="flex-1">
        <section className="p-6">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
            className="hidden" 
            accept="image/*"
          />
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="relative group aspect-video rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center overflow-hidden cursor-pointer hover:bg-slate-100/50 transition-colors"
          >
            {formData.imageUrl ? (
               <div className="relative w-full h-full">
                 <img src={formData.imageUrl} className="absolute inset-0 w-full h-full object-cover" alt="preview" />
                 <div className="absolute inset-x-0 bottom-0 bg-black/60 py-2.5 text-center">
                   <p className="text-white text-[11px] font-bold tracking-wide">图片由用户上传</p>
                 </div>
               </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 rounded-full bg-white shadow-md flex items-center justify-center text-primary group-active:scale-90 transition-transform">
                  <span className="material-symbols-outlined text-4xl">add_a_photo</span>
                </div>
                <p className="text-slate-800 text-base font-bold mt-2">点击上传图片</p>
                <p className="text-slate-400 text-xs">支持官图或实拍</p>
              </div>
            )}
          </div>
        </section>

        <section className="px-6 space-y-9">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-5 bg-primary rounded-full shadow-sm shadow-primary/30"></div>
              <h3 className="text-slate-900 text-lg font-bold">基础信息</h3>
            </div>
            <div className="space-y-6">
              <Field label="周边名称" required>
                <input 
                  value={formData.name}
                  onChange={e => setFormData(prev => ({...prev, name: e.target.value}))}
                  className="w-full rounded-2xl border-slate-200 h-14 px-5 bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none shadow-sm" 
                  placeholder="请输入周边的具体名称" 
                  type="text" 
                />
              </Field>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                   <p className="text-slate-500 text-sm font-medium">分类 (所属领域)</p>
                   <span className="text-[10px] text-primary/50 font-bold border border-primary/20 px-1.5 rounded-full">长按拖动排序</span>
                </div>
                <button 
                  onClick={() => setIsManagingSources(!isManagingSources)}
                  className={`${isManagingSources ? 'text-emerald-500' : 'text-slate-400'} active:scale-95 transition-all`}
                >
                  <span className="material-symbols-outlined text-[20px]">{isManagingSources ? 'check_circle' : 'delete'}</span>
                </button>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                {sources.map((st, idx) => (
                  <div key={st} className="relative shrink-0">
                    <button
                      type="button"
                      disabled={isManagingSources}
                      onClick={() => setFormData(prev => ({...prev, sourceType: st as SourceType}))}
                      onContextMenu={(e) => { e.preventDefault(); moveItem(sources, setSources, idx, 'up'); }}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border shadow-sm touch-none select-none ${formData.sourceType === st ? 'bg-primary/10 border-primary text-primary' : 'bg-slate-50 border-transparent text-slate-400'}`}
                    >
                      {st}
                    </button>
                    {isManagingSources && (
                      <button 
                        onClick={() => removeSource(st)}
                        className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full size-5 flex items-center justify-center animate-in zoom-in shadow-sm"
                      >
                        <span className="material-symbols-outlined text-[12px] font-bold">close</span>
                      </button>
                    )}
                  </div>
                ))}
                {isAddingSource ? (
                  <input
                    ref={sourceInputRef}
                    type="text"
                    value={newSourceValue}
                    onChange={(e) => setNewSourceValue(e.target.value)}
                    onBlur={handleAddSource}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSource()}
                    className="h-[38px] min-w-[80px] px-3 rounded-xl border border-primary bg-white text-xs font-bold text-primary focus:ring-0 outline-none shadow-sm"
                  />
                ) : (
                  <button 
                    onClick={() => setIsAddingSource(true)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold border-2 border-dashed border-slate-200 text-slate-300 hover:border-primary hover:text-primary transition-all flex items-center gap-1 active:scale-95"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>新增
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="所属 IP">
                  <input 
                    value={formData.ip}
                    onChange={e => setFormData(prev => ({...prev, ip: e.target.value}))}
                    className="w-full rounded-2xl border-slate-200 h-14 px-5 bg-slate-50 focus:bg-white focus:border-primary outline-none transition-all shadow-sm" 
                    placeholder="例如：咒术回战" 
                  />
                </Field>
                <Field label="角色/成员">
                  <input 
                    value={formData.character}
                    onChange={e => setFormData(prev => ({...prev, character: e.target.value}))}
                    className="w-full rounded-2xl border-slate-200 h-14 px-5 bg-slate-50 focus:bg-white focus:border-primary outline-none transition-all shadow-sm" 
                    placeholder="例如：五条悟" 
                  />
                </Field>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-5 bg-primary rounded-full shadow-sm shadow-primary/30"></div>
                <h3 className="text-slate-900 text-lg font-bold">类型标签</h3>
                <span className="text-[10px] text-primary/50 font-bold border border-primary/20 px-1.5 rounded-full">长按拖动排序</span>
              </div>
              <button 
                onClick={() => setIsManagingCategories(!isManagingCategories)}
                className={`${isManagingCategories ? 'text-emerald-500' : 'text-slate-400'} active:scale-95 transition-all`}
              >
                <span className="material-symbols-outlined text-[20px]">{isManagingCategories ? 'check_circle' : 'delete'}</span>
              </button>
            </div>
            <div className="flex flex-wrap gap-2.5 items-center">
              {categories.map((cat, idx) => (
                <div key={cat} className="relative">
                  <button
                    type="button"
                    disabled={isManagingCategories}
                    onClick={() => setFormData(prev => ({...prev, category: cat as ItemCategory}))}
                    onContextMenu={(e) => { e.preventDefault(); moveItem(categories, setCategories, idx, 'up'); }}
                    className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all border shadow-sm touch-none select-none ${
                      formData.category === cat ? 'bg-primary text-white border-primary shadow-md shadow-primary/20' : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-primary/20'
                    }`}
                  >
                    {cat}
                  </button>
                  {isManagingCategories && (
                    <button 
                      onClick={() => removeCategory(cat)}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full size-4 flex items-center justify-center animate-in zoom-in shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[10px] font-bold">close</span>
                    </button>
                  )}
                </div>
              ))}
              {isAddingCategory ? (
                <input
                  ref={categoryInputRef}
                  type="text"
                  value={newCategoryValue}
                  onChange={(e) => setNewCategoryValue(e.target.value)}
                  onBlur={handleAddCategory}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                  className="h-[40px] min-w-[80px] px-4 rounded-full border border-primary bg-white text-sm font-bold text-primary focus:ring-0 outline-none shadow-sm"
                />
              ) : (
                <button 
                  onClick={() => setIsAddingCategory(true)}
                  className="px-5 py-2.5 rounded-full text-sm font-bold border-2 border-dashed border-slate-200 text-slate-300 hover:border-primary hover:text-primary transition-all flex items-center gap-1 active:scale-95"
                >
                  <span className="material-symbols-outlined text-sm">add</span>新增
                </button>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-5 bg-primary rounded-full shadow-sm shadow-primary/30"></div>
              <h3 className="text-slate-900 text-lg font-bold">价格、日期与状态</h3>
            </div>
            <div className="space-y-6">
              <Field label="付款状态">
                <select 
                  value={formData.paymentStatus}
                  onChange={e => setFormData(prev => ({...prev, paymentStatus: e.target.value as PaymentStatus}))}
                  className="w-full rounded-2xl border-slate-200 h-14 px-5 bg-slate-50 appearance-none outline-none focus:border-primary focus:bg-white transition-all shadow-sm font-bold"
                >
                  {Object.values(PaymentStatus).map(ps => <option key={ps} value={ps}>{ps}</option>)}
                </select>
              </Field>

              {formData.paymentStatus === PaymentStatus.DEPOSIT ? (
                <div className="space-y-5 animate-in slide-in-from-top-2">
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="定金金额">
                      <div className="relative">
                        <span className="absolute left-4 inset-y-0 flex items-center text-slate-400 font-bold">¥</span>
                        <input 
                          value={formData.depositAmount}
                          onChange={e => setFormData(prev => ({...prev, depositAmount: Number(e.target.value)}))}
                          className="w-full rounded-2xl border-slate-200 h-14 pl-10 pr-4 bg-slate-50 font-bold focus:bg-white focus:border-primary outline-none transition-all shadow-sm" 
                          type="number" 
                        />
                      </div>
                    </Field>
                    <Field label="尾款金额">
                      <div className="relative">
                        <span className="absolute left-4 inset-y-0 flex items-center text-slate-400 font-bold">¥</span>
                        <input 
                          value={formData.finalPaymentAmount}
                          onChange={e => setFormData(prev => ({...prev, finalPaymentAmount: Number(e.target.value)}))}
                          className="w-full rounded-2xl border-slate-200 h-14 pl-10 pr-4 bg-slate-50 font-bold focus:bg-white focus:border-primary outline-none transition-all shadow-sm" 
                          type="number" 
                        />
                      </div>
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-5">
                    <Field label="购入总价 (单件)">
                      <div className="relative">
                        <span className="absolute left-4 inset-y-0 flex items-center text-slate-300 font-bold">¥</span>
                        <input 
                          disabled
                          value={Number(formData.depositAmount || 0) + Number(formData.finalPaymentAmount || 0)}
                          className="w-full rounded-2xl border-slate-100 h-14 pl-10 pr-4 bg-slate-50 text-slate-400 font-bold cursor-not-allowed" 
                          type="number" 
                        />
                      </div>
                    </Field>
                    <Field label="购入数量">
                      <div className="flex items-center h-14 rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                        <button 
                          type="button"
                          onClick={() => setFormData(prev => ({...prev, quantity: Math.max(1, prev.quantity - 1)}))}
                          className="flex-1 flex items-center justify-center text-primary active:bg-slate-50 transition-colors"
                        >
                          <span className="material-symbols-outlined">remove</span>
                        </button>
                        <span className="px-4 font-bold text-slate-800">{formData.quantity}</span>
                        <button 
                          type="button"
                          onClick={() => setFormData(prev => ({...prev, quantity: prev.quantity + 1}))}
                          className="flex-1 flex items-center justify-center text-primary active:bg-slate-50 transition-colors"
                        >
                          <span className="material-symbols-outlined">add</span>
                        </button>
                      </div>
                    </Field>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <Field label="买入单价">
                    <div className="relative">
                      <span className="absolute left-4 inset-y-0 flex items-center text-slate-400 font-bold">¥</span>
                      <input 
                        value={formData.price}
                        onChange={e => setFormData(prev => ({...prev, price: Number(e.target.value)}))}
                        className="w-full rounded-2xl border-slate-200 h-14 pl-10 pr-4 bg-slate-50 font-bold focus:bg-white focus:border-primary outline-none transition-all shadow-sm" 
                        type="number" 
                      />
                    </div>
                  </Field>
                  <Field label="买入数量">
                    <div className="flex items-center h-14 rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                      <button 
                        type="button"
                        onClick={() => setFormData(prev => ({...prev, quantity: Math.max(1, prev.quantity - 1)}))}
                        className="flex-1 flex items-center justify-center text-primary active:bg-slate-50 transition-colors"
                      >
                        <span className="material-symbols-outlined">remove</span>
                      </button>
                      <span className="px-4 font-bold text-slate-800">{formData.quantity}</span>
                      <button 
                        type="button"
                        onClick={() => setFormData(prev => ({...prev, quantity: prev.quantity + 1}))}
                        className="flex-1 flex items-center justify-center text-primary active:bg-slate-50 transition-colors"
                      >
                        <span className="material-symbols-outlined">add</span>
                      </button>
                    </div>
                  </Field>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <Field label="当前状态">
                  <select 
                    value={formData.status}
                    onChange={e => setFormData(prev => ({...prev, status: e.target.value as ItemStatus}))}
                    className="w-full rounded-2xl border-slate-200 h-14 px-5 bg-slate-50 appearance-none outline-none focus:border-primary transition-all shadow-sm font-bold"
                  >
                    {Object.values(ItemStatus).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label="日期">
                  <input 
                    type="date"
                    value={formData.purchaseDate}
                    onChange={e => setFormData(prev => ({...prev, purchaseDate: e.target.value}))}
                    className="w-full rounded-2xl border-slate-200 h-14 px-5 bg-slate-50 outline-none focus:border-primary transition-all shadow-sm font-bold"
                  />
                </Field>
              </div>

              {formData.status === ItemStatus.SOLD && (
                <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                  <Field label="卖出单价">
                    <div className="relative">
                      <span className="absolute left-4 inset-y-0 flex items-center text-emerald-500 font-bold">¥</span>
                      <input 
                        value={formData.soldPrice}
                        onChange={e => setFormData(prev => ({...prev, soldPrice: Number(e.target.value)}))}
                        className="w-full rounded-2xl border-emerald-100 h-14 pl-10 pr-4 bg-emerald-50/30 font-bold focus:bg-white focus:border-emerald-400 outline-none transition-all shadow-sm" 
                        type="number" 
                        placeholder="0"
                      />
                    </div>
                  </Field>
                  <Field label="卖出数量">
                    <div className="flex items-center h-14 rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                      <button 
                        type="button"
                        onClick={() => setFormData(prev => ({...prev, soldQuantity: Math.max(1, (prev.soldQuantity || 1) - 1)}))}
                        className="flex-1 flex items-center justify-center text-primary active:bg-slate-50 transition-colors"
                      >
                        <span className="material-symbols-outlined">remove</span>
                      </button>
                      <span className="px-4 font-bold text-slate-800">{formData.soldQuantity || 1}</span>
                      <button 
                        type="button"
                        onClick={() => setFormData(prev => ({...prev, soldQuantity: Math.min(prev.quantity, (prev.soldQuantity || 1) + 1)}))}
                        className="flex-1 flex items-center justify-center text-primary active:bg-slate-50 transition-colors"
                      >
                        <span className="material-symbols-outlined">add</span>
                      </button>
                    </div>
                  </Field>
                </div>
              )}

              <Field label="备注 (选填)">
                <textarea 
                  value={formData.notes}
                  onChange={e => setFormData(prev => ({...prev, notes: e.target.value}))}
                  className="w-full rounded-3xl border-slate-200 p-5 bg-slate-50 focus:bg-white focus:border-primary transition-all outline-none h-32 text-sm shadow-sm"
                  placeholder="记录购买细节、平台、瑕疵等信息..."
                />
              </Field>
            </div>
          </div>
        </section>
      </main>

      <footer className="fixed bottom-0 w-full max-w-md p-6 bg-white/95 backdrop-blur-lg safe-pb border-t border-slate-100 z-[60] shadow-2xl">
        <button 
          onClick={handleSubmit}
          className="w-full bg-primary text-white font-bold py-4 rounded-2xl shadow-xl shadow-primary/30 active:scale-[0.98] transition-all hover:brightness-105"
        >
          {editItem ? '保存修改' : '创建此周边记录'}
        </button>
      </footer>
    </div>
  );
};

export default AddItemView;
