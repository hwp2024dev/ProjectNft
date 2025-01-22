// 메인 라우터 및 레이아웃 구성
import { Routes, Route } from 'react-router-dom'
import routes from './routes.tsx';
// import components

// import pages
import MainPage from '@pages/00_MainPage/MainPage.tsx'
import NftMarketPage from '@pages/01_NftMarketPage/NftMarketPage.tsx'
// boot-strap style reset
import './BootStrapReset.css'
// 반응형 페이지(레이아웃)
import Layout from "@components/00_Layout/Layout.tsx"

const App = () => {
    return (
        <>
            <Routes>
                {/* 00.Page추가 : MainPage,NftMarketPage */}
                {/* 01.반응형 페이지 대응: Layout모듈 장착*/}
                
                <Route path={routes.MainPage} element={<Layout><MainPage /></Layout>} />
                <Route path={routes.NftMarketPage} element={<Layout><NftMarketPage /></Layout>} />
            </Routes>
        </>
    )
}

export default App