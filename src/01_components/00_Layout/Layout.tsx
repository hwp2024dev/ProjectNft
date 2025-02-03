import 'bootstrap/dist/css/bootstrap.min.css';

function Layout({ children }: { children: React.ReactNode; }) {
  return (
    <div className="flex-column" style={{height: "100vh"}}>
    {/* 전체 레이아웃 컨테이너 */}
    {/* d-flex: Flexbox 활성화 */}
    {/* flex-column: 세로 방향 정렬 */}
    {/* vh-100: 화면 높이 100%로 설정 */}
      <header className="d-flex justify-content-between align-items-center p-3" style={{ height: "10vh" , backgroundColor: "#6CA0DC" }}>
      {/* 헤더 영역 */}
      {/* d-flex: Flexbox 활성화 */}
      {/* justify-content-between: 자식 요소를 좌우로 정렬 (양쪽 정렬) */}
      {/* align-items-center: 세로 방향 중앙 정렬 */}
      {/* p-3: 내부 여백(Padding)을 1rem로 설정 */}
        <div>
          <a href="/" className="text-decoration-none text-reset">NFT TRADER</a>
        </div>
        <nav className="d-flex gap-3">
          <a href="/" className="text-decoration-none text-reset">Main</a>
          <a href="/NftMarketPage" className="text-decoration-none text-reset">Nft_Market</a>
          <a href="/NftInfoPage" className="text-decoration-none text-reset">NftInfoPage</a>
        </nav>
      </header>
      <main className="flex-grow-1" style={{ height: "80vh"}}>
      {/* 메인 영역 */}
      {/* flex-grow-1: 남은 공간을 모두 차지 (Main 영역 확장) */}
      {children}
      </main>
      <footer className="d-flex justify-content-center align-items-center text-center p-3" style={{ height: "10vh" , backgroundColor: "#6CA0DC", }}>
      {/* 푸터 영역 */}
      {/* d-flex: Flexbox 활성화 */}
      {/* justify-content-between: 자식 요소를 좌우로 정렬 (양쪽 정렬) */}
      {/* align-items-center: 세로 방향 중앙 정렬 */}
        <p>© 2025 hyunwoo park. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default Layout;