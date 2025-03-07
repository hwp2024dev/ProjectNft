import express, { Request, Response } from "express";
import User from "../models/userModel"; // 유저 모델 불러오기

const router = express.Router();

// 유저 금화 조회 API
router.get(
    "/gold",
    async (req: Request<{}, {}, {}, { account?: string }>, res: Response): Promise<void> => {
        const { account } = req.query;

        if (!account) {
            res.status(400).json({ error: "계정 주소가 필요합니다." });
            return;
        }

        try {
            const user = await User.findOne({ account }) // exec() 사용하여 Mongoose Query 처리

            if (!user) {
                res.status(404).json({ error: "유저를 찾을 수 없습니다." });
                return;
            }

            res.json({ gold: user.gold || 0 });
        } catch (error) {
            console.error("유저 골드 조회 실패:", error);
            res.status(500).json({ error: "서버 오류 발생" });
        }
    }
);

export default router;