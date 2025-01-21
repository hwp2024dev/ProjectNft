import { Routes, Route } from 'react-router-dom'
import MainPage from '@pages/00_MainPage/MainPage.tsx'

const App = () => {
    return (
        <>
            <Routes>
                {/* 확인용 MainPage세팅* -> 다음 작업때 추가예정 */}
                <Route path="/" element={<MainPage />} /> 
            </Routes>
        </>
    )
}

export default App