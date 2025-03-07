import { useRef, useEffect } from 'react';
import { initChartScene } from './chartUtils.ts';
import styles from './NftChartPage.module.css';

// myPage 전역페이지 데이터 관리 : Recoil
import { useRecoilValue } from "recoil";
import { inventoryState, goldState, userName } from "@core/recoil/atoms";

const NftChartPage = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const cleanup = initChartScene(mountRef.current);

    return () => {
      cleanup();
    };
  }, []);

  // Recoil
  const userN = useRecoilValue(userName);
  const inventory = useRecoilValue(inventoryState);
  const gold = useRecoilValue(goldState);

  console.log("[myPage]유저명 :", userN);
  console.log("[myPage]인벤토리 현황 :", inventory);
  console.log("[myPage]금화 현황 :", gold);

  return (
    <div className={styles.mainContainer}>
      <div ref={mountRef} className={styles.chartContainer} />
    </div>
  );
};

export default NftChartPage;