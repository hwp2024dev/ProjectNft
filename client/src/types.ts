// types.ts
export interface NftItemType {
  itemId: string;
  itemName: string;
  type: string;
  emoji?: string;
  quantity: number;
  price: string;
  priceIcon?: string;
  username?: string;
  isTrading?: boolean; // 거래 중이면 true
}
