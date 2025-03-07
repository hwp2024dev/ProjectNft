import React, { useState, useEffect } from "react";
import { useUser } from "@core/UserContext";
import { useWeb3 } from "@core/Web3Provider";
import styles from "./NftMyPage.module.css";
import { ethers } from "ethers";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useRecoilValue } from "recoil";
import { inventoryState, goldState, userName } from "@core/recoil/atoms";

const NftMyPage = () => {
  const { user, setUser, logout } = useUser();
  const { account, contract } = useWeb3();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [gold, setGold] = useState(0);
  const navigate = useNavigate();

  // Recoil 상태
  const userN = useRecoilValue(userName);
  const dummyInventory = useRecoilValue(inventoryState);
  const dummyGold = useRecoilValue(goldState);

  console.log("[myPage] 유저명:", userN);
  console.log("[myPage] 인벤토리 현황:", dummyInventory);
  console.log("[myPage] 금화 현황:", dummyGold);

  // 로그인 기능
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    console.log("입력된 로그인 정보:", { username, password, account });

    if (!username.trim() || !password.trim()) {
      setError("아이디와 비밀번호를 입력해주세요.");
      return;
    }

    if (!account) {
      setError("메타마스크 지갑을 연결해주세요.");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:5001/api/auth/login",
        { username, password, account }, // 메타마스크 지갑 주소 포함
        { withCredentials: true }
      );

      console.log("로그인 성공! 응답 데이터:", response.data);

      if (response.data?.user) {
        setUser(response.data.user);
        sessionStorage.setItem("user", JSON.stringify(response.data.user));
        alert("로그인 성공!");
      } else {
        console.error("예상치 못한 응답 형식:", response.data);
        setError("서버 응답이 올바르지 않습니다.");
      }
    } catch (err: any) {
      console.error("로그인 요청 실패:", err.response?.data || err.message);

      if (!err.response) {
        setError("서버에 연결할 수 없습니다. 네트워크 상태를 확인하세요.");
      } else {
        setError(err.response.data?.message || "로그인 실패");
      }
    }
  };

  // 로그아웃 기능
  const handleLogout = () => {
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("inventory");
    sessionStorage.removeItem("gold");
    logout();
    console.log("🚪 로그아웃 완료! 세션 초기화됨.");
  };

  // 금화 발행 기능
  const handleMintGold = async () => {
    if (!contract || !account) {
        console.error("컨트랙트 또는 계정이 설정되지 않음");
        setError("지갑을 연결하고 다시 시도해주세요.");
        return;
    }

    try {
        console.log("금화 발행 요청 중...");
        await contract.methods.mint(account, 1000).send({ from: account, gasPrice: "20000000000" });

        console.log("금화 발행 트랜잭션 성공! 최신 잔액 갱신");

        // 최신 컨트랙트 잔액 가져오기
        const updatedBalance = await fetchBalance();

        // 서버에도 업데이트 요청 보내기
        await updateUserGoldInDB(updatedBalance);

        // sessionStorage 업데이트
        sessionStorage.setItem("userGold", updatedBalance.toString());
        console.log("sessionStorage 업데이트 완료: ", updatedBalance);

    } catch (error) {
        console.error("금화 발행 실패:", error);
        setError("금화 발행 중 오류가 발생했습니다.");
    }
  };


  // 컨트랙트에서 최신 잔액 가져오는 함수
  const fetchBalance = async () => {
    if (!account || !contract) {
        setGold(0);
        return 0;
    }
    try {
        let balance = await contract.methods.balanceOf(account).call();
        const formattedBalance = parseFloat(ethers.formatUnits(balance, 18));
        setGold(formattedBalance);
        return formattedBalance;
    } catch (error) {
        console.error("잔액 조회 실패:", error);
        setError("잔액을 불러오는 중 오류가 발생했습니다.");
        return 0;
    }
  };

  const fetchUserGold = async () => {
    try {
        console.log("서버에서 유저 골드 가져오는 중...");
        
        const response = await fetch(`http://localhost:5001/api/user/gold?account=${user.account}`);
        if (!response.ok) throw new Error("유저 골드 정보를 불러오지 못했습니다.");

        const data = await response.json();
        console.log("서버에서 받은 골드 정보:", data.gold);

        setGold(data.gold);  // gold 상태 업데이트
        sessionStorage.setItem("userGold", data.gold.toString()); // sessionStorage 업데이트
    } catch (error) {
        console.error("유저 골드 불러오기 실패:", error);
    }
};


// 서버 DB에 최신 금화 잔액 업데이트하는 함수
const updateUserGoldInDB = async (goldAmount: number) => {
  try {
      console.log(`서버에 골드 업데이트 요청: ${goldAmount}`);
      const response = await fetch("http://localhost:5001/api/user/update-gold", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ account, gold: goldAmount }),
      });

      if (!response.ok) throw new Error("서버 골드 업데이트 실패");
      console.log("서버 골드 업데이트 성공!");
  } catch (error) {
      console.error("서버 골드 업데이트 실패:", error);
  }
};
  
  // 페이지 로드시 유저 골드 동기화
  useEffect(() => {
    fetchUserGold();
  }, []);


  useEffect(() => {
    if (account && contract) {
        fetchBalance().then(() => fetchUserGold()); // 순서 보장
    }
  }, [account, contract]);

  useEffect(() => {
    console.log("금화 업데이트 감지됨:", gold);
  }, [gold]);

  return (
    <div className={styles.container}>
      <h2>마이 페이지</h2>
      <br />
      {user ? (
        <>
          <p>로그인됨: {user.username}</p>
          <p>보유 금화: {gold} G</p>
          <p>연결된 지갑: {account || "지갑 미연결"}</p>
          <div className={styles.buttonContainer}>
            <button onClick={handleMintGold} className={styles.mintButton}>💰 금화 발행</button>
            <button onClick={handleLogout} className={styles.logoutButton}>로그아웃</button>
          </div>
        </>
      ) : (
        <div>
          <form onSubmit={handleLogin}>
            <input
              type="text"
              placeholder="아이디 입력"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
            <input
              type="password"
              placeholder="비밀번호 입력"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <input
              type="text"
              placeholder="메타마스크 지갑 주소"
              value={account || ""}
              disabled
            />
            <button type="submit">로그인</button>
            <button type="button" onClick={() => navigate("/NftSignUp")}>회원가입</button>
          </form>
          {error && <p className={styles.error}>{error}</p>}
        </div>
      )}
    </div>
  );
};

export default NftMyPage;