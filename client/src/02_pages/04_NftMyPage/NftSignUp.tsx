import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./NftSignUp.module.css";

const NftSignUp = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [account, setAccount] = useState(""); // 지갑 주소 추가
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // 입력값 검증
    if (!username.trim() || !password.trim()) {
      setError("아이디와 비밀번호를 입력해주세요.");
      return;
    }

    if (password.length < 6) {
      setError("비밀번호는 최소 6자 이상이어야 합니다.");
      return;
    }

    if (!account.trim()) {
      setError("메타마스크 지갑 주소를 입력해주세요.");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:5001/api/auth/signup",
        { username, password, account }, // 지갑 주소 포함
        { withCredentials: true }
      );

      console.log("회원가입 성공:", response.data);
      alert("회원가입 성공! 로그인 해주세요.");
      navigate("/NftMyPage");
    } catch (error: any) {
      console.error("회원가입 요청 실패:", error.response?.data?.message || error.message);

      // 서버 응답이 없을 경우 기본 에러 메시지 설정
      if (!error.response) {
        setError("서버와 연결할 수 없습니다. 다시 시도해주세요.");
      } else {
        setError(error.response.data?.message || "서버 오류 발생");
      }
    }
  };

  return (
    <div className={styles.container}>
      <h2>회원가입</h2>
      <form onSubmit={handleSignup}>
        <input
          type="text"
          placeholder="아이디 입력"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
        />
        <input
          type="password"
          placeholder="비밀번호 입력 (6자 이상)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
        />
        <input
          type="text"
          placeholder="메타마스크 지갑 주소 입력"
          value={account}
          onChange={(e) => setAccount(e.target.value)}
          autoComplete="off"
        />
        <button type="submit">회원가입 완료</button>
        <button type="button" onClick={() => navigate("/NftMyPage")}>취소</button>
      </form>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
};

export default NftSignUp;