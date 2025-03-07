import { ethers, BrowserProvider } from "ethers";
import { Item_ContractABI, ITEM_CONTRACT_ADDRESS } from "@core/Web3Provider";

// Provider, Signer, Contract 전역 관리
let provider: BrowserProvider | null = null;
let signer: ethers.Signer | null = null;
let itemContract: ethers.Contract | null = null;

// Signer 가져오는 함수 (비동기)
async function getSigner() {
  if (!provider) {
    provider = new BrowserProvider(window.ethereum);
  }
  if (!signer) {
    signer = await provider.getSigner();
  }
  if (!itemContract) {
    itemContract = new ethers.Contract(ITEM_CONTRACT_ADDRESS, Item_ContractABI, signer);
  }
  return { signer, itemContract };
}

// NFT 토큰화 (mintItem) 호출 함수  
export async function mintItemToken(
  userAddress: string,
  amount: number,
  itemName: string,
  itemType: string,
  emoji: string,
  price: string,
  username: string
): Promise<boolean> { 
  try {
    console.log("현재 사용 중인 컨트랙트 주소:", ITEM_CONTRACT_ADDRESS);
    console.log("계정 주소 :", userAddress);
    console.log("아이템 갯수 :", amount);
    console.log("아이템 이름 :", itemName);
    console.log("아이템 타입 (전달받은 값) :", itemType);
    console.log("아이콘 :", emoji);
    console.log("가격 :", price);
    console.log("유저네임 :", username);

    if (!window.ethereum) {
      throw new Error("메타마스크가 감지되지 않았습니다.");
    }

    // 새 프로바이더와 서명자 생성
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(ITEM_CONTRACT_ADDRESS, Item_ContractABI, signer);

    // itemType 기본값 처리
    itemType = itemType || "defaultType";  
    console.log("수정된 아이템 타입:", itemType);

    console.log("mintItem 실행 중...");
    if (!itemName || itemName.trim() === "" || itemName === "Unknown Item") {
      throw new Error("유효하지 않은 아이템 이름입니다.");
    }
    // 스마트컨트랙트에 정의한 순서대로 인자를 전달 (itemId는 자동 생성됨)
    const tx = await contract.mintItem(userAddress, amount, itemName, itemType, emoji, price, username);
    await tx.wait(); 

    console.log("mintItem 성공!");
    return true; 
  } catch (error) {
    console.error("NFT 토큰화 실패:", error);
    return false; 
  }
}

// 아이템 소각 (판매 후 제거)
export async function burnItemToken(amount: number) {
  try {
    console.log(`아이템 ${amount}개 소각 요청`);
    const { signer, itemContract } = await getSigner();
    const tx = await itemContract.burnItem(amount);
    await tx.wait();
    console.log(`아이템 ${amount}개 소각 완료`);
  } catch (error) {
    console.error("아이템 소각 실패:", error);
    throw error;
  }
}

// 아이템 거래 (ERC-20 전송)
export async function transferItemToken(to: string, amount: number) {
  try {
    console.log(`${amount}개의 아이템을 ${to}에게 전송`);
    const { signer, itemContract } = await getSigner();
    const tx = await itemContract.transferItem(to, amount);
    await tx.wait();
    console.log(`${amount}개 아이템 전송 완료!`);
    return true;
  } catch (error) {
    console.error("아이템 전송 실패:", error);
    return false;
  }
}

// 아이템 업로드 함수 (NFT 변환)
export async function uploadItemToBlockchain(item: any): Promise<boolean> {
  try {
    console.log(`아이템 업로드 시작: ${item.name}`);
    const { signer, itemContract } = await getSigner();
    const tx = await itemContract.mintItem(
      await signer.getAddress(),
      1,
      item.name,
      item.type,
      item.emoji,
      item.price || "",
      item.username || ""
    );
    await tx.wait();
    console.log("NFT 등록 완료");
    return true;
  } catch (error) {
    console.error("NFT 업로드 실패:", error);
    return false;
  }
}

// 유저 주소 가져오기
export async function getUserAddress(): Promise<string | null> {
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return await signer.getAddress();
  } catch (error) {
    console.error("지갑 주소 가져오기 실패:", error);
    return null;
  }
}

// 스마트 컨트랙트에서 등록된 NFT 데이터 가져오기
export async function fetchRegisteredNFTs() {
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(ITEM_CONTRACT_ADDRESS, Item_ContractABI, signer);

    const nftCount = await contract.getTotalNFTs();
    console.log(`등록된 NFT 개수: ${nftCount}`);

    const nftList = [];
    for (let i = 0; i < nftCount; i++) {
      const result = await contract.getNFTByIndex(i);
      if (!result || result.length < 7) {
        console.warn(`NFT 데이터 불완전함, index ${i}`, result);
        continue;
      }
      const [itemId, itemName, itemType, emoji, price, quantity, username] = result;
      nftList.push({
        // itemId를 문자열로 변환
        itemId: itemId ? itemId.toString() : "",
        itemName,
        type: itemType,
        category: {
          name: itemType || "Unknown",
          icon: emoji || "❓"
        },
        description: {
          value: `${Number(price)} G`,
          icon: "💰"
        },
        quantity: Number(quantity),
        price: price,
        username: username,
        isUploaded: true
      });
    }

    console.log("스마트 컨트랙트에서 가져온 NFT 리스트:", nftList);
    return nftList;
  } catch (error) {
    console.error("스마트 컨트랙트에서 NFT 목록 가져오기 실패:", error);
    return [];
  }
}