import { useEffect, useRef } from 'react';
import { initThreeScene } from './threeUtils.ts';
import styles from './NftMarketPage.module.css';

const NftMarketPage = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    if (mountRef.current) {
      cleanup = initThreeScene(mountRef.current);
    }

    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  return (
    <div className={styles.container}>
      <div ref={mountRef} className={styles.container} />
    </div>
  );
};

export default NftMarketPage;