
import { CollectionItem, ItemStatus, ItemCategory, PaymentStatus, SourceType } from './types';

export const INITIAL_COLLECTION: CollectionItem[] = [
  {
    id: '1',
    name: '五条悟 DX版 手办',
    ip: '咒术回战',
    character: '五条悟',
    price: 320,
    status: ItemStatus.OWNED,
    paymentStatus: PaymentStatus.FULL,
    sourceType: SourceType.ANIME,
    category: ItemCategory.FIGURE,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAsk2bwkt3LRFwZ0Sc_bKisjWWX7uscAPO0RFpDKpF1PJVWAJXv7YZTX6S6UP0dqVJdmKvDr144Id5xXoT_uSQP8qaupMsxWR2eju-a0Gkj1E4iWg_pijv34bePxB3gQofpMZkwoOvLWSYhsTFRp1hPagMFiFXINh_c0gB9Ui1TG7_cSgBv_VpieZE4fl-8gMHVLZ-i5VzAgMh4ApeW0PtfAaSwB_hNFTF9IATv-5IMh-XtyFkykKXhZWRt6o0yx5lBpqauh3x3_EI',
    quantity: 1,
    purchaseDate: '2023-12-01'
  },
  {
    id: '2',
    name: 'Karina 特典卡',
    ip: 'aespa',
    character: 'Karina',
    price: 128,
    status: ItemStatus.TRANSIT,
    paymentStatus: PaymentStatus.DEPOSIT,
    depositAmount: 50,
    finalPaymentAmount: 78,
    sourceType: SourceType.KPOP,
    category: ItemCategory.CARD,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAdfRafcOvNjx4uVRx9p-5GkQ8d2dcJ4yEB4vytU3DZwRqdFOa0aavDmukHagA1a5Iapvm7k2lgKKeclKhhQyzUMaRuxkQnZ2JTBCvj6TUzQxWlZoQEjaPvbRTneJTAWu9jyHZ0xD6QmCe214yj-5zPfC2KOKPRewNmjLDlgxpvRagPWC3ZYw7nTw6ThLvXtBa7E8tRXA96McyKM2GSp-8aUrABPaRIx3SHBdOJN4_e_O16lbflp9OM7xRcTRxqNtLKnlx9zzn87NE',
    quantity: 2,
    purchaseDate: '2024-01-15'
  },
  {
    id: '3',
    name: '限定版 原画集',
    ip: '吉卜力',
    character: '无脸男',
    price: 450,
    status: ItemStatus.WISHLIST,
    sourceType: SourceType.ANIME,
    category: ItemCategory.ARTBOOK,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDsuKCSK5FgtMt8PCXCV_1AU1aVYtfuma77MTFWnbbjpF737dLjXfgvtrFs_b5fiiZSH5gGsMhhGyshnVJCHtIGiPEtm7lbW-dN0JII1DBwjwNqHTpg2VbuRP7Qqz93lb19R9Hkoi7UU1AJUdxBycG54MGY83CqRc8DupjB9dGsDapsbmCScY9AMDDUMM9nM4mK3rah34SSPy92q-URkO1FIgvDX4OFrbw8Fhlm8DiLXbPUQnEMFmfBIEtovMKXApakbTubhdi2c9Y',
    quantity: 1,
    purchaseDate: '2025-11-01'
  },
  {
    id: '4',
    name: '初音未来 NT',
    ip: 'Vocaloid',
    character: '初音未来',
    price: 385,
    status: ItemStatus.OWNED,
    paymentStatus: PaymentStatus.FULL,
    sourceType: SourceType.ANIME,
    category: ItemCategory.FIGURE,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCLrsk-m_UVZI4X1y6CteKx8wwfYCna90cMNOKEXvdF56r5qNpouEOAheubYlvxcW8zyxiODjO7qvvil_O5gJkXLkuJoV-9skODHTw-gwooT3AaTCIUt-GhMSX0BlJE02HdcZGdrJIwHp4JD9LdrULAf9-jS1IGJXsI3rhJ59ekfuDKop5lPj6_N4aquv9oFXrwdxQBacncgNpTxUrfnzHVdTY3BTuUEWafBE39ROd2B4KSbFEOgujVRCq30me1oHzX2fFkDQKPwkg',
    quantity: 1,
    purchaseDate: '2026-02-01'
  },
  {
    id: '5',
    name: 'IVE - I\'VE MINE 实体专辑',
    ip: 'IVE',
    character: '全员',
    price: 110,
    status: ItemStatus.OWNED,
    paymentStatus: PaymentStatus.FULL,
    sourceType: SourceType.KPOP,
    category: ItemCategory.CD,
    imageUrl: 'https://picsum.photos/seed/album-cd/400/400',
    quantity: 1,
    purchaseDate: '2025-06-16'
  },
  {
    id: '6',
    name: '伏黑惠 2024生日吧唧',
    ip: '咒术回战',
    character: '伏黑惠',
    price: 35,
    status: ItemStatus.TRANSIT,
    paymentStatus: PaymentStatus.FULL,
    sourceType: SourceType.ANIME,
    category: ItemCategory.BADGE,
    imageUrl: 'https://picsum.photos/seed/badge-item/400/400',
    quantity: 3,
    purchaseDate: '2026-01-28'
  }
];
