import { Router, Request, Response } from "express";
import User from "../models/User"; // User 모델 가져오기
import { IItem } from "../models/Item"; // IItem 인터페이스 가져오기

const router: Router = Router();

router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const { account } = req.query;
    if (!account || typeof account !== "string") {
      console.warn("지갑 주소(account)가 요청되지 않음.");
      res.status(400).json({ message: "지갑 주소(account)가 필요합니다." });
      return;
    }

    console.log(`인벤토리 조회 요청: ${account}`);
    const user = await User.findOne({ account }).exec();
    console.log("DB에서 조회한 유저 데이터:", user);

    if (!user) {
      console.warn(`⚠️ 사용자를 찾을 수 없음: ${account}`);
      res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
      return;
    }

    console.log(`인벤토리 조회 완료:`, user.inventory);
    res.status(200).json({ inventory: user.inventory || [] });
  } catch (error) {
    console.error("인벤토리 조회 오류:", error);
    res.status(500).json({ message: "서버 오류: 인벤토리를 조회할 수 없습니다." });
  }
});

router.get("/market", async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("마켓 아이템 목록 요청");

    // 모든 유저의 인벤토리에서 `isTrading: true`인 아이템 필터링
    const users = await User.find({});
    let marketItems: IItem[] = [];

    users.forEach(user => {
      if (user.inventory) {
        const tradingItems = user.inventory.filter(item => item.isTrading);
        marketItems = [...marketItems, ...tradingItems];
      }
    });

    console.log("마켓 아이템 목록 반환:", marketItems);
    res.status(200).json({ market: marketItems });
  } catch (error) {
    console.error("마켓 아이템 불러오기 실패:", error);
    res.status(500).json({ message: "서버 오류" });
  }
});

// 아이템 추가 API
router.post("/add-item", async (req: Request, res: Response): Promise<void> => {
  try {
    const { account, itemId, itemName, quantity, emoji, price, type } = req.body;

    if (!account || !itemId || !itemName || quantity == null) {
      res.status(400).json({ message: "필수 데이터(account, itemId, itemName, quantity)가 필요합니다." });
      return;
    }

    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) {
      res.status(400).json({ message: "유효한 수량이 필요합니다." });
      return;
    }

    const user = await User.findOne({ account }).exec();
    console.log("🔹 아이템 추가 - 사용자 조회:", user);

    if (!user) {
      res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
      return;
    }

    // 만약 user.inventory가 undefined라면 빈 배열로 초기화
    if (!user.inventory) {
      user.inventory = [];
    }

    // 클라이언트에서 전달받은 itemId를 그대로 사용하여 기존 아이템 검색
    const existingItem = user.inventory.find((i: IItem) => i.itemId === itemId);
    if (existingItem) {
      existingItem.quantity += qty;
    } else {
      // username은 필요한 경우 실제 값을 할당해야 합니다.
      user.inventory.push({ 
        itemId, 
        itemName, 
        quantity: qty, 
        type: type || (itemName === "방패" ? "Shield" : "Weapon"),
        emoji: emoji || "",
        price: price || "",
        username: "", // username 필드 (필수, 필요시 실제 username 할당)
        isTrading: false  // 기본값 false
      });
    }

    await user.save();
    console.log("아이템 추가 완료:", user.inventory);
    res.status(200).json({ message: "아이템 추가 완료!", inventory: user.inventory });
  } catch (error) {
    console.error("아이템 추가 오류:", error);
    res.status(500).json({ message: "서버 오류" });
  }
});

// 아이템 제거 API
router.post("/remove-item", async (req: Request, res: Response): Promise<void> => {
  try {
    const { account, itemId, quantity } = req.body;

    if (!account || !itemId || quantity == null) {
      res.status(400).json({ message: "필수 데이터(account, itemId, quantity)가 필요합니다." });
      return;
    }
    
    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) {
      res.status(400).json({ message: "유효한 수량이 필요합니다." });
      return;
    }

    const user = await User.findOne({ account: { $regex: new RegExp(`^${account}$`, "i") } }).exec();
    console.log("🔹 아이템 제거 - 사용자 조회:", user);

    if (!user) {
      res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
      return;
    }

    const existingItem = user.inventory.find((i: IItem) => i.itemId === itemId);
    if (!existingItem || existingItem.quantity < qty) {
      res.status(400).json({ message: "삭제할 아이템이 부족합니다." });
      return;
    }

    existingItem.quantity -= qty;
    if (existingItem.quantity <= 0) {
      user.inventory = user.inventory.filter((i: IItem) => i.itemId !== itemId);
    }

    await user.save();
    console.log("아이템 제거 완료:", user.inventory);
    res.status(200).json({ message: "아이템 삭제 완료!", inventory: user.inventory });
  } catch (error) {
    console.error("아이템 삭제 오류:", error);
    res.status(500).json({ message: "서버 오류" });
  }
});

// 아이템 거래 상태 업데이트 API
router.post("/set-trading", async (req: Request, res: Response): Promise<void> => {
  try {
    const { account, itemId, isTrading } = req.body;

    if (!account || !itemId || typeof isTrading !== "boolean") {
      res.status(400).json({ message: "필수 데이터(account, itemId, isTrading)가 필요합니다." });
      return;
    }

    const user = await User.findOne({ account }).exec();
    if (!user) {
      res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
      return;
    }

    if (!user.inventory) {
      user.inventory = [];
    }

    const targetItem = user.inventory.find((i: IItem) => i.itemId === itemId);
    console.log("🛠 변경 전 아이템 상태:", targetItem); // 로그 추가

    if (!targetItem) {
      res.status(404).json({ message: "아이템을 찾을 수 없습니다." });
      return;
    }

    if (targetItem.isTrading === isTrading) {
      console.warn(`⚠️ 이미 ${isTrading ? "판매중" : "판매해제"} 상태입니다.`);
      res.status(200).json({ message: `이미 ${isTrading ? "판매중" : "판매해제"} 상태입니다.`, inventory: user.inventory });
      return;
    }

    targetItem.isTrading = isTrading;
    await user.save();

    console.log("변경 후 아이템 상태:", targetItem); // 로그 추가
    res.status(200).json({ message: "아이템 거래 상태 업데이트 완료!", inventory: user.inventory });

  } catch (error) {
    console.error("거래 상태 업데이트 오류:", error);
    res.status(500).json({ message: "서버 오류" });
  }
});


export default router;