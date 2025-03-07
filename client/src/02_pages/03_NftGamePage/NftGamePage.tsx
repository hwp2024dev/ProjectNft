import Phaser from "phaser";
import { MainScene } from "./MainScene";
import { useEffect, useRef, useState } from "react";
import { useUser } from "@core/UserContext"; // 로그인 상태 가져오기
import { useNavigate } from "react-router-dom";

// myPage 전역페이지 데이터 관리 : Recoil
import { useRecoilValue } from "recoil";
import { inventoryState, goldState, userName } from "@core/recoil/atoms";

const NftGamePage = () => {
  const gameContainer = useRef<HTMLDivElement>(null);
  const game = useRef<Phaser.Game | null>(null); // useRef 사용하여 전역에서 참조 가능
  const navigate = useNavigate();
  const { user } = useUser();
  const isFirstRender = useRef(true);
  const [gameInventory, setGameInventory] = useState([]); // useState 올바르게 선언

  // Recoil
  const userN = useRecoilValue(userName);
  const inventory = useRecoilValue(inventoryState);
  const gold = useRecoilValue(goldState);
  
  console.log("[myPage]유저명 :", userN);
  console.log("[myPage]인벤토리 현황 :", inventory);
  console.log("[myPage]금화 현황 :", gold);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (!user) {
      alert("MY PAGE에서 로그인 해주세요!!");
      navigate("/Nftmypage");
    } else {
      alert(`계정: ${user.username} 님, 게임을 시작합니다.`);
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!gameContainer.current) return;

    // 기존 Phaser 게임이 실행 중이라면 삭제 후 다시 생성
    if (game.current) {
        console.log("기존 Phaser 게임 삭제 후 재생성");
        game.current.destroy(true);  // 게임 제거
        game.current = null;  // 참조 제거
    }

    const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        parent: gameContainer.current,
        width: window.innerWidth,
        height: window.innerHeight,
        scene: [MainScene],
        scale: {
            mode: Phaser.Scale.RESIZE,
            autoCenter: Phaser.Scale.CENTER_BOTH,
        },
        physics: {
            default: "arcade",
            arcade: { gravity: { x: 0, y: 0 }, debug: false },
        },
        audio: { disableWebAudio: true },
    };

    game.current = new Phaser.Game(config);

    game.current.canvas.style.position = "absolute";
    game.current.canvas.style.top = "50%";
    game.current.canvas.style.left = "50%";
    game.current.canvas.style.transform = "translate(-50%, -50%)";

    return () => {
        if (game.current) {
            console.log("게임 종료");
            game.current.destroy(true);
            game.current = null;
        }
    };
  }, []);

  // 게임 실행 시 기존 인벤토리 유지 & Phaser 씬에 반영
  useEffect(() => {
    const savedInventory = sessionStorage.getItem("inventory");
    if (savedInventory) {
      const parsedInventory = JSON.parse(savedInventory);
      setGameInventory(parsedInventory);

      console.log("[디버깅] 저장된 인벤토리:", parsedInventory);

      // Phaser 씬에도 인벤토리 반영 (씬이 로드될 시간 확보)
      setTimeout(() => {
        if (game.current && game.current.scene.scenes.length > 0) {
          let currentScene = game.current.scene.getScene("MainScene");
          if (currentScene && currentScene.initializeInventory) {
            console.log("디버깅] Phaser 씬에 인벤토리 반영");
            currentScene.initializeInventory();
          } else {
            console.error("[디버깅] currentScene이 없거나 initializeInventory가 없음");
          }
        } else {
          console.error("[디버깅] Phaser 씬이 아직 로드되지 않음");
        }
      }, 500);
    }
  }, []);

  const updateInventoryUI = () => {
    let inventory = JSON.parse(sessionStorage.getItem("inventory") || "[]");
    let gameInventoryContainer = document.getElementById("gameInventory");

    if (!gameInventoryContainer) return;

    gameInventoryContainer.innerHTML = ""; // 기존 내용 삭제 후 다시 렌더링

    inventory.forEach((item) => {
      let itemElement = document.createElement("div");
      itemElement.textContent = `${item.name} (x${item.count})`; // 개수 반영
      gameInventoryContainer.appendChild(itemElement);
    });

    console.log("🎮 게임 내부 인벤토리 UI 업데이트됨:", inventory);
  };

  const updateMyPageUI = () => {
    let inventory = JSON.parse(sessionStorage.getItem("inventory") || "[]");
    let myPageInventory = document.getElementById("myPageInventory");

    if (!myPageInventory) return;

    myPageInventory.innerHTML = ""; // 기존 내용 삭제 후 다시 렌더링

    inventory.forEach((item) => {
      let itemElement = document.createElement("div");
      itemElement.textContent = `${item.name} (x${item.count})`; // 개수 반영
      myPageInventory.appendChild(itemElement);
    });

    console.log("🖥️ 마이페이지 인벤토리 UI 업데이트됨:", inventory);
  };

  const handleObtainItem = (item) => {
    if (!user) return;

    const savedInventory = sessionStorage.getItem("inventory");
    let inventory = [];

    if (savedInventory) {
      try {
        inventory = JSON.parse(savedInventory);
      } catch (error) {
        console.error("sessionStorage 인벤토리 파싱 오류:", error);
        inventory = [];
      }
    }

    // 기존 아이템이 있는지 확인
    const existingItem = inventory.find((i) => i.id === item.id);

    if (existingItem) {
      existingItem.count += 1; // 기존 아이템이면 개수 증가
    } else {
      inventory.push({ ...item, count: 1 }); // 새 아이템이면 count: 1로 추가
    }

    // sessionStorage에 저장 & Recoil 상태 업데이트
    sessionStorage.setItem("inventory", JSON.stringify(inventory));
    setGameInventory(inventory);

    console.log("저장된 인벤토리:", inventory);

    // UI 업데이트 (게임 내부 & 마이페이지)
    updateInventoryUI();
    updateMyPageUI();

    // Phaser 씬에도 인벤토리 반영
    if (game.current && game.current.scene.scenes.length > 0) {
      let currentScene = game.current.scene.getScene("MainScene");
      if (currentScene && currentScene.updateGameInventory) {
        console.log("[디버깅] Phaser 씬의 updateGameInventory 실행");
        currentScene.updateGameInventory(inventory);
      }
    }

    // 마이페이지 자동 업데이트
    window.dispatchEvent(new Event("inventoryUpdated"));
  };

  return (
    <div ref={gameContainer} id="game-container" style={{ width: "100vw", height: "80vh", overflow: "hidden", backgroundColor: "black", position: "absolute" }}>
      <button onClick={() => handleObtainItem({ id: 3, name: "🔥 불검", type: "무기" })}>무기 획득 (🔥 불검)</button>
      <button onClick={() => handleObtainItem({ id: 4, name: "🛡️ 철방패", type: "방어구" })}>방어구 획득 (🛡️ 철방패)</button>
    </div>
  );
};

export default NftGamePage;