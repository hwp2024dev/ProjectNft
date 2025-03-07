import Chart from 'chart.js/auto';

export const initChartScene = (container: HTMLDivElement) => {
  if (!container) {
    console.error("Chart container is not available.");
    return () => {};
  }

  // 기존 차트가 있으면 제거 (중복 방지)
  if (container.firstChild) {
    container.innerHTML = "";
  }

  const canvas = document.createElement('canvas');
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    console.error("Failed to get 2D context.");
    return () => {};
  }

  const chart = new Chart(ctx, {
    type: 'bar',
    data: {
        
      labels: ['Warrior', 'Wizzard', 'Paladin', 'Lancer'],
      datasets: [{
        label: 'NFT 판매량',
        data: [30, 60, 50, 65],
        backgroundColor: ['#FFB6C1', '#ADD8E6', '#FFFFE0', '#FFDAB9'],
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });

  // Cleanup 함수 반환 (컴포넌트 언마운트 시 제거)
  return () => {
    chart.destroy();
    container.innerHTML = "";
  };
};