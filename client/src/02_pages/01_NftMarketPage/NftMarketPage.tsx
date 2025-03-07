import { useEffect, useRef, useState, useMemo } from 'react';
import { initThreeScene } from './threeUtils.ts';
import styles from './NftMarketPage.module.css';
import { NftItemType } from "../../types.ts";
import { mintItemToken, getUserAddress } from "./web3Utils.ts";

const NftMarketPage = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  // 마켓 UI 슬라이딩 (우측 SELECT LIST / 좌측 INVENTORY)
  const [isActive, setIsActive] = useState(false);

  // 1) Select List (장바구니)
  const [cart, setCart] = useState<NftItemType[]>([]);

  // 선택된 아이템 ID (Inventory에서 사용) – string 타입 사용
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // 2) Inventory 초기 매핑: 세션의 inventory와 user 정보를 반영
  const [inventory, setInventory] = useState<NftItemType[]>(() => {
    const storedInventory = sessionStorage.getItem("inventory") || "[]";
    const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
    const username = userData.username || "";
    try {
      return JSON.parse(storedInventory).map((item: any): NftItemType => ({
        itemId: item.itemId ?? "",
        itemName: item.itemName || "Default Item",
        type: item.type,
        emoji: item.emoji || "❓",
        quantity: item.quantity ?? 1,
        price: item.price || "",
        priceIcon: "💰",
        username: username,
        isTrading: item.isTrading ?? false
      }));
    } catch (error) {
      console.error("인벤토리 파싱 오류:", error);
      return [];
    }
  });

  // 3) mergedInventory: 같은 itemId를 기준으로 수량 누적
  const mergedInventory = useMemo(() => {
    const map = new Map<string, NftItemType>();
    for (const item of inventory) {
      if (map.has(item.itemId)) {
        const existing = map.get(item.itemId)!;
        existing.quantity += item.quantity;
      } else {
        map.set(item.itemId, { ...item });
      }
    }
    return Array.from(map.values());
  }, [inventory]);

  const user = JSON.parse(sessionStorage.getItem("user") || "{}");

  console.log("현재 React 인벤토리(원본):", inventory);
  console.log("현재 React 장바구니(cart):", cart);
  console.log("집계된 mergedInventory:", mergedInventory);

  // 스텁 함수들
  const removeFromThreeJS = (itemId: string) => {
    if (window.removeFromThreeJS) {
      window.removeFromThreeJS(itemId);
    }
  };

  const updateInventoryUI = () => {
    console.log("인벤토리 UI 업데이트 (stub)");
  };

  const syncCartWithThreeJS = (updatedCart: NftItemType[]) => {
    const updatedCartIds = updatedCart.map((item) => item.itemId);
    if (window.updateCartItems) {
      window.updateCartItems(updatedCartIds);
      console.log("Three.js 장바구니 동기화 완료:", updatedCartIds);
    }
  };

  useEffect(() => {
    syncCartWithThreeJS(cart);
  }, [cart]);

  useEffect(() => {
    const fetchInventory = async () => {
      if (!user.account) return;
  
      try {
        console.log("서버에서 최신 인벤토리 가져오는 중...");
        
        // sessionStorage의 기존 인벤토리 삭제 (게임 내 데이터 유지 방지)
        sessionStorage.removeItem("inventory");
  
        const response = await fetch(`http://localhost:5001/api/inventory?account=${user.account}`);
        if (!response.ok) throw new Error("서버에서 인벤토리를 불러오지 못했습니다.");
  
        const data = await response.json();
        console.log("서버에서 받은 최신 인벤토리:", data.inventory);
  
        setInventory(data.inventory);
        sessionStorage.setItem("inventory", JSON.stringify(data.inventory));  // 다시 저장
      } catch (error) {
        console.error("인벤토리 불러오기 실패:", error);
      }
    };
  
    fetchInventory();  // 페이지 진입 시 실행
  
  }, [user.account]);

  const handleAddToCart = (nftItem: NftItemType) => {
    console.log("Three.js에서 선택한 아이템:", nftItem);

    setCart((prevCart) => {
        if (prevCart.some((item) => item.itemId === nftItem.itemId)) {
            console.warn("⚠️ 이미 장바구니에 존재:", nftItem.itemId);
            return prevCart;
        }
        console.log("장바구니에 추가됨:", nftItem);

        // Three.js 선택 효과 적용 (붉은색 테두리)
        const nftElement = document.querySelector(`[data-nft-id="${nftItem.itemId}"]`);
        if (nftElement) {
            nftElement.classList.add("selected"); // CSS 클래스 추가
            nftElement.style.border = "5px solid red";
        }

        return [...prevCart, nftItem];
    });
  };

  const handleSelectItem = (item: NftItemType) => {
    setTimeout(() => {
        const nftElement = document.querySelector(`[data-nft-id="${item.itemId}"]`);
        console.log("선택된 NFT 요소:", nftElement);

        if (!nftElement) {
            console.warn(`선택 요소를 찾을 수 없음: ${item.itemId}`);
            return;
        }

        if (selectedItemId === item.itemId) {
            setSelectedItemId(null);
            nftElement.classList.remove("selected");
        } else {
            setSelectedItemId(item.itemId);
            nftElement.classList.add("selected");
        }
    }, 100); // 약간의 지연 추가 (Three.js UI가 먼저 렌더링되도록)
  };

  const handleSellItem = (item: NftItemType) => {
    if (!user || !user.account) {
      alert("로그인 후 판매 가능합니다!");
      return;
    }
    let currentInventory = JSON.parse(sessionStorage.getItem("inventory") || "[]");
    const updatedInventory = currentInventory
      .map((i: any) => (i.itemId === item.itemId ? { ...i, quantity: i.quantity - 1 } : i))
      .filter((i: any) => i.quantity > 0);
    sessionStorage.setItem("inventory", JSON.stringify(updatedInventory));
    setInventory(updatedInventory);
    console.log("판매 완료! 새로운 인벤토리:", updatedInventory);
    removeFromThreeJS(item.itemId);
    updateInventoryUI();
    window.dispatchEvent(new Event("inventoryUpdated"));
  };

  const handleSellOnMarket = async (item: NftItemType) => {
    try {
      console.log(`거래소에 판매 요청: ${item.itemName}`);
      const userAddress = await getUserAddress();
      if (!userAddress) throw new Error("지갑 주소를 가져올 수 없습니다.");
  
      const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
      const username = userData.username || "UnknownUser";
  
      const success = await mintItemToken(
        userAddress,
        1,
        item.itemName,
        item.type,
        item.emoji,
        item.price,
        username
      );
  
      if (!success) {
        throw new Error(`${item.itemName} 토큰화 실패!`);
      }
      console.log(`거래소 등록 완료: ${item.itemName}`);
  
      // `isTrading: true` 상태 업데이트 (판매중 처리)
      const response = await fetch("http://localhost:5001/api/inventory/set-trading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account: user.account, itemId: item.itemId, isTrading: true })
      });
  
      if (!response.ok) {
        throw new Error("거래 상태 업데이트에 실패했습니다.");
      }
  
      const data = await response.json();
      console.log("거래 상태 업데이트 응답:", data);
  
      // 세션 스토리지 & 상태 업데이트
      let currentInventory = JSON.parse(sessionStorage.getItem("inventory") || "[]");
      const updatedInventory = currentInventory.map((i: any) => {
        if (i.itemId === item.itemId) {
          return { ...i, isTrading: true }; // isTrading 플래그 변경
        }
        return i;
      });
      sessionStorage.setItem("inventory", JSON.stringify(updatedInventory));
      setInventory(updatedInventory);
  
      // Three.js 마켓 UI 업데이트
      if (window.updateMarketItems) {
        window.updateMarketItems(updatedInventory);
      }
      alert(`${item.itemName}이(가) 거래소에 등록되었습니다!`);
  
      // 페이지 전체 새로고침 (최후 수단)
      window.location.reload();
  
    } catch (error) {
      console.error("거래소 판매 실패:", error);
      alert("판매 처리 중 오류가 발생했습니다.");
    }
  };

  const handleRemoveFromCart = (nftItem: NftItemType) => {
    console.log("장바구니에서 제거:", nftItem.itemId);
    setCart((prevCart) => prevCart.filter((item) => item.itemId !== nftItem.itemId));
  };

  const handlePurchaseItem = async (item: NftItemType) => {
    if (!user || !user.account) {
      alert("로그인 후 구매 가능합니다!");
      return;
    }
  
    // userGold를 Number()로 변환하여 비교 오류 방지
    let userGold = Number(sessionStorage.getItem("userGold")) || 0;
    const itemPrice = Number(item.price) || 0;
  
    console.log(`💰 현재 골드: ${userGold}, 아이템 가격: ${itemPrice}`);
  
    if (userGold < itemPrice) {
      alert("💰 골드가 부족합니다!");
      return;
    }
  
    // NFT 번(Burn) 처리 (스마트 컨트랙트 호출)
    const success = await burnNFTToken(item.itemId);
    if (!success) {
      alert("🚨 NFT 삭제 실패! 다시 시도해주세요.");
      return;
    }
  
    // 골드 차감 후 반영
    userGold -= itemPrice;
    sessionStorage.setItem("userGold", userGold.toString()); // 세션 스토리지 업데이트
    console.log("💰 구매 완료! 남은 골드:", userGold);
  
    // UI 업데이트 및 NFT 제거
    updateInventoryUI();
    removeFromThreeJS(item.itemId);
    window.dispatchEvent(new Event("inventoryUpdated"));
    alert(`${item.itemName} 구매 완료!`);
  };

  const [marketItems, setMarketItems] = useState<NftItemType[]>([]);

  // 서버에서 최신 마켓 아이템 가져오기
  const fetchMarketItems = async () => {
    try {
      console.log("서버에서 마켓 아이템 가져오는 중...");
  
      const response = await fetch("http://localhost:5001/api/inventory/market");
      if (!response.ok) throw new Error("마켓 아이템을 불러오지 못했습니다.");
  
      const data = await response.json();
      console.log("서버에서 받은 마켓 아이템:", data.market);
  
      setMarketItems(data.market); // 상태 업데이트
  
      // Three.js 마켓 UI 업데이트 (Three.js가 window에 등록된 함수 사용)
      if (window.updateMarketItems) {
        window.updateMarketItems(data.market);
      }
    } catch (error) {
      console.error("마켓 아이템 불러오기 실패:", error);
    }
  };

  const burnNFTToken = async (itemId: string) => {
    try {
      console.log(`NFT 번(Burn) 실행: ${itemId}`);
      
      const response = await fetch("http://localhost:5001/api/nft/burn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId })
      });
  
      if (!response.ok) {
        throw new Error("NFT 번(Burn) 실패!");
      }
  
      const data = await response.json();
      console.log("NFT 번 완료:", data);
      return true;
    } catch (error) {
      console.error(" NFT 번 실패:", error);
      return false;
    }
  };

  // 마켓 페이지 로드시 마켓 아이템 불러오기
  useEffect(() => {
    fetchMarketItems();
  }, []);

  useEffect(() => {
    if (!mountRef.current) return;
    const cleanup = initThreeScene(mountRef.current, handleAddToCart, handleRemoveFromCart);
  
    const fetchMarketItems = async () => {
      try {
        console.log("서버에서 마켓 아이템 가져오는 중...");
  
        const response = await fetch("http://localhost:5001/api/inventory/market");
        if (!response.ok) throw new Error("마켓 아이템을 불러오지 못했습니다.");
  
        const data = await response.json();
        console.log("서버에서 받은 마켓 아이템:", data.market);
  
        setMarketItems(data.market);
  
        // Three.js Scene 업데이트 (모든 유저가 볼 수 있도록)
        if (window.updateMarketItems) {
          window.updateMarketItems(data.market);
          console.log("🛠 Three.js 마켓 아이템 업데이트 완료:", data.market);
        }
      } catch (error) {
        console.error("마켓 아이템 불러오기 실패:", error);
      }
    };
  
    fetchMarketItems();  // 페이지 로드 시 마켓 데이터 불러오기
  
    return () => cleanup && cleanup();
  }, []);

  useEffect(() => {
    const handleInventoryUpdate = () => {
      console.log("📦 인벤토리 변경 감지, 새 데이터 가져옴");
      const updatedInventory = JSON.parse(sessionStorage.getItem("inventory") || "[]");
      setInventory(updatedInventory);
    };
    window.addEventListener("inventoryUpdated", handleInventoryUpdate);
    return () => {
      window.removeEventListener("inventoryUpdated", handleInventoryUpdate);
    };
  }, []);

  useEffect(() => {
    console.log("🛒 현재 장바구니 상태:", cart);
  }, [cart]); // cart가 변경될 때마다 콘솔 확인

  const handleClick = () => setIsActive((prev) => !prev);

  return (
    <div className={styles.container}>
      <div ref={mountRef} className={styles.container} />
  
    {/* SELECT LIST (장바구니) */}
    <div className={`${styles.NFT_HERO_CART} ${isActive ? styles.activeRight : styles.inactiveRight} ${styles.nftHeroContainer}`}>
      <div className={styles.nftHeroTitle}>SELECT LIST</div>
      <ul className={styles.cartItemList}>
        {cart.map((item) => (
          <li key={item.itemId} className={styles.cartItem}>
            {/* 이미지 대신 이모지 사용 */}
            <span className={styles.nftImage} style={{ fontSize: "40px" }}>
              {item.emoji || item.category?.icon || "❓"}
            </span>
            <div className={styles.itemInfo}>
              <span className={styles.itemName}>
                {item.itemName} ({item.quantity}개 보유)
              </span>
              <span className={styles.itemPrice}>
                {item.priceIcon} {item.price}
              </span>
            </div>
            <button onClick={() => handleRemoveFromCart(item)} className={styles.removeButton}>
              Remove
            </button>
          </li>
        ))}
      </ul>
      <div>
        <button
          onClick={() =>
            handlePurchaseItem({
              itemId: "magic_staff_01",
              itemName: "마법지팡이",
              type: "Weapon",
              emoji: "🪄",
              quantity: 1,
              price: "1 개 보유",
              priceIcon: "💰",
              username: "" // username은 handlePurchaseItem에서 세션의 user.username으로 추가됨
            })
          }
        >
          아이템 구매
        </button>
      {/* 보유 금화 표시 */}
      <div className={styles.goldContainer}>
        <span className={styles.goldText}>💰 보유 금화: {sessionStorage.getItem("userGold") || "0"} G</span>
      </div>
      </div>
    </div>
  
      {/* Inventory (합쳐진 아이템 목록) */}
      <div className={`${styles.NFT_HERO_INFO} ${isActive ? styles.activeLeft : styles.inactiveLeft} ${styles.nftHeroContainer}`}>
        <div className={styles.nftHeroTitle}>📦 INVENTORY</div>
        <ul className={styles.cartItemList}>
          {mergedInventory.map((item, index) => {
            const isSelected = selectedItemId === item.itemId;
            return (
              <li
                key={`${item.itemId}-${index}`}
                className={`${styles.cartItem} ${isSelected ? styles.selected : ""}`}
                data-nft-id={item.itemId}
              >
                <span className={styles.nftImage}>{item.emoji}</span>
                <div className={styles.itemInfo}>
                  <span className={styles.itemName}>
                    {item.emoji} {item.itemName} ({item.quantity}개 보유)
                  </span>
                </div>
                <button onClick={() => handleSelectItem(item)} className={styles.selectButton}>
                  아이템 선택
                </button>
              </li>
            );
          })}
        </ul>
        <div style={{ marginTop: "8px" }}>
          <button
            onClick={() => {
              const selectedItem = mergedInventory.find((item) => item.itemId === selectedItemId);
              if (selectedItem) {
                if (selectedItem.isTrading) {
                  alert("이미 거래중인 아이템입니다.");
                } else {
                  handleSellOnMarket(selectedItem);
                }
              }
            }}
            className={styles.buyButton}
            disabled={!!mergedInventory.find((item) => item.itemId === selectedItemId)?.isTrading}
          >
            {mergedInventory.find((item) => item.itemId === selectedItemId)?.isTrading
              ? "거래중"
              : "아이템 판매하기"}
          </button>
        </div>
      </div>
      <div onClick={handleClick}>
        <p>아이템 구매버튼</p>
      </div>
    </div>
  );
};

export default NftMarketPage;