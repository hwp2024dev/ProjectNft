export {};

declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

declare global {
  interface Window {
    updateCartItems: (updatedCart: string[]) => void;
    updateMarketItems: (updatedMarket: any[]) => void;
    syncCartWithThreeJS: () => void;
    ethereum?: any; 
  }
}