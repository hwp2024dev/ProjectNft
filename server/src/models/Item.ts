export interface IItem {
  itemId: string;
  itemName: string;
  type: string;
  emoji?: string;
  quantity: number;
  price: string;
  isTrading: boolean;
  username: string;
}