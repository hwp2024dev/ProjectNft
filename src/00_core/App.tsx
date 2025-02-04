// 메인 라우터 및 레이아웃 구성
import { Routes, Route } from 'react-router-dom'
import routes from './routes.tsx';
// boot-strap style reset
import './BootStrapReset.css'
// 반응형 페이지(레이아웃)
import Layout from "@components/00_Layout/Layout.tsx"
// import pages
import MainPage from '@pages/00_MainPage/MainPage.tsx'
import NftMarketPage from '@pages/01_NftMarketPage/NftMarketPage.tsx'
import NftInfoPage from '@pages/02_NftInfoPage/NftInfoPage.tsx'
import NftGamePage from '@pages/03_NftGamePage/NftGamePage.tsx'

const App = () => {
    return (
        <>
            <Routes>
                {/* 00.Page추가 : MainPage,NftMarketPage */}
                {/* 01.반응형 페이지 대응: Layout모듈 장착*/}
                {/* 02.url 오타 대응 : 404 - Page Not Found*/}
                
                <Route path={routes.MainPage} element={<Layout><MainPage /></Layout>} />
                <Route path={routes.NftMarketPage} element={<Layout><NftMarketPage /></Layout>} />
                <Route path={routes.NftInfoPage} element={<Layout><NftInfoPage /></Layout>} />
                <Route path={routes.NftGamePage} element={<Layout><NftGamePage /></Layout>} />
                <Route path="*" element={<div>404 - Page Not Found</div>} />
            </Routes>
        </>
    )
}

export default App