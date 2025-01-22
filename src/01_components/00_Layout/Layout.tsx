import './Layout.module.css';

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="layout">
      {/* Layout Area */}
      <header className="layout-header">
        <nav>
          <a href="/">Main</a>
          <a href="/NftMarketPage">NFT Market</a>
        </nav>
      </header>
      <main className="layout-main">
        {children}
      </main>
      <footer className="layout-footer">
        <p>© 2025 Your Name. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Layout;