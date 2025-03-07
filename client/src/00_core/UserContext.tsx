import React, { createContext, useContext, useState } from "react";
import { useEffect } from "react";
import { ethers } from "ethers";

// 사용자 정보 타입 정의
interface User {
  username: string;
  address: string; // 지갑 주소 추가
}

// 컨텍스트 타입 정의
interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  gold: number;
  setGold: (amount: number) => void;
  transferGold: (receiver: string, amount: number) => Promise<void>; // 금화 전송
  logout: () => void;
}

// 기본값 설정 (초기값)
const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = sessionStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [gold, setGold] = useState(0);

  // user 변경 시 sessionStorage에도 저장 (로그인 정보 유지)
  useEffect(() => {
    if (user) {
      sessionStorage.setItem("user", JSON.stringify(user));
    } else {
      sessionStorage.removeItem("user");
    }
  }, [user]);

  // 블록체인 관련 정보
  const GOLD_CONTRACT_ADDRESS = "0xYourContractAddress"; // 배포된 컨트랙트 주소
  const GOLD_ABI = [
    "function transfer(address to, uint256 amount) public returns (bool)",
    "function balanceOf(address account) public view returns (uint256)"
  ];

// GOLD 토큰 전송 함수 (mint → transfer 변경)
  const transferGold = async (receiver: string, amount: number) => {
    if (!window.ethereum) {
      console.error("MetaMask가 필요합니다.");
      return;
    }

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(GOLD_CONTRACT_ADDRESS, GOLD_ABI, signer);

      // 트랜잭션 실행 (parseUnits 체크)
      console.log(`📌 금화 발행 시도: ${amount} GOLD`);
      const tx = await contract.transfer(receiver, amount); //
      await tx.wait();

      // **잔액을 가져올 때 약간의 딜레이 추가**
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 1초 대기

      // balanceOf 값 가져오기
      let balance = await contract.balanceOf(receiver);

      setGold(balance);
      console.log(`최신 GOLD 잔액: ${balance} G`);

    } catch (error) {
      console.error("GOLD 전송 실패:", error);
    }
  };

  // 로그아웃 함수
  const logout = () => {
    setUser(null);
    setGold(0);
    sessionStorage.removeItem("user"); // 세션에서 삭제
    console.log("🚪 로그아웃 완료! 골드 0으로 초기화됨.");
  };

  return (
    <UserContext.Provider value={{ user, setUser, gold, setGold, transferGold, logout }}>
      {children}
    </UserContext.Provider>
  );
};

// 사용자 컨텍스트를 쉽게 가져오기 위한 커스텀 훅
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser는 UserProvider 내부에서 사용해야 합니다.");
  }
  return context;
};