
export enum ItemStatus {
  OWNED = '已入手',
  TRANSIT = '在途',
  WISHLIST = '愿望单',
  RESERVED = '预定中',
  SOLD = '卖出'
}

export enum PaymentStatus {
  FULL = '全款',
  DEPOSIT = '定金',
}

export enum SourceType {
  ANIME = '动漫',
  KPOP = 'KPOP',
  JPOP = 'JPOP',
  WESTERN = '欧美',
  GAME = '游戏',
  OTHER = '其他'
}

export enum ItemCategory {
  BADGE = '吧唧',
  PLUSH = '毛绒',
  FIGURE = '手办',
  CARD = '卡片',
  ARTBOOK = '画集',
  CD = 'CD',
  OTHER = '其他'
}

export interface CollectionItem {
  id: string;
  name: string;
  ip: string;
  character: string;
  price: number;
  soldPrice?: number;
  soldQuantity?: number;
  depositAmount?: number;
  finalPaymentAmount?: number;
  status: ItemStatus;
  paymentStatus?: PaymentStatus;
  category: ItemCategory;
  sourceType?: SourceType;
  imageUrl: string;
  quantity: number;
  purchaseDate?: string;
  notes?: string;
  // 模拟截图中的拼团数据
  isPinned?: boolean;
  isReminderEnabled?: boolean;
  groupProgress?: number;
  groupTotal?: number;
  groupStatus?: string;
}

export interface ViewState {
  currentTab: 'home' | 'stats' | 'profile' | 'ip-list';
}
