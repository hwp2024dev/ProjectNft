// 메인 라우터 및 레이아웃 구성
import { Routes, Route } from 'react-router-dom'
import MainPage from '@pages/00_MainPage/MainPage.tsx'
import NavBar from '@components/00_NavBar/NavBar.tsx'
import Footer from '@components/01_Footer/Footer.tsx'

const App = () => {
    return (
        <>
            <NavBar />
            <Routes>
                {/* 확인용 MainPage세팅* -> 다음 작업때 추가예정 */}
                <Route path="/" element={<MainPage />} /> 
            </Routes>
            <Footer />
        </>
    )
}

export default App