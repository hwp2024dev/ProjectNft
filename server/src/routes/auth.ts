import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User";

const router: Router = Router();

// 회원가입 API
router.post("/signup", async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password, account } = req.body;

    if (!username || !password || !account) {
      res.status(400).json({ message: "아이디, 비밀번호, 지갑 주소를 입력해주세요." });
      return;
    }

    // 기존 사용자 확인 (아이디 중복 검사)
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      res.status(400).json({ message: "이미 존재하는 아이디입니다." });
      return;
    }

    // 기존 지갑 주소(account) 확인 (중복 가입 방지)
    const existingAccount = await User.findOne({ account });
    if (existingAccount) {
      res.status(400).json({ message: "이 지갑 주소는 이미 등록되어 있습니다." });
      return;
    }

    // User.ts에서 `pre("save")` 훅을 통해 비밀번호 자동 해싱
    const newUser = new User({ username, password, account });
    await newUser.save();

    res.status(201).json({ message: "회원가입 성공!" });
  } catch (error) {
    console.error("회원가입 오류:", error);
    res.status(500).json({ message: "서버 오류" });
  }
});

// 로그인 API
router.post("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("로그인 요청 수신:", req.body);

    const { username, password, account } = req.body;

    if (!username || !password || !account) {
      res.status(400).json({ message: "아이디, 비밀번호, 지갑 주소를 입력해주세요." });
      return;
    }

    // 사용자 확인 (username & account 모두 일치하는 사용자 검색)
    const user = await User.findOne({ username, account }).exec();
    console.log("DB에서 가져온 유저 정보:", user);

    if (!user) {
      res.status(400).json({ message: "아이디 또는 지갑 주소가 올바르지 않습니다." });
      return;
    }

    // 비밀번호 검증
    console.log("저장된 비밀번호 (해시):", user.password);
    const isMatch = await user.comparePassword(password);
    console.log("비밀번호 비교 결과:", isMatch);

    if (!isMatch) {
      res.status(400).json({ message: "비밀번호가 올바르지 않습니다." });
      return;
    }

    // JWT 토큰 발급
    const token = jwt.sign({ id: user._id, account }, "your_secret_key", { expiresIn: "1h" });

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });

    res.status(200).json({ message: "로그인 성공!", user: { username: user.username, account } });
  } catch (error) {
    console.error("로그인 오류:", error);
    res.status(500).json({ message: "서버 오류" });
  }
});

export default router;