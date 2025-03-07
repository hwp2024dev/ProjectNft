// src/00_core/recoil/atoms.ts
import { atom } from "recoil";

// 유저명 저장
export const userName = atom({
  key: "userName",
  default: JSON.parse(sessionStorage.getItem("user") || "[]"),
});

// 인벤토리 내용저장
export const inventoryState = atom({
  key: "inventoryState",
  default: JSON.parse(sessionStorage.getItem("inventory") || "[]"),
});

// 금화 내용저장
export const goldState = atom({
  key: "goldState",
  default: JSON.parse(sessionStorage.getItem("gold") || "0"),
});
