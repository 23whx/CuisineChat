import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home } from '@/pages/Home';
import { NotFound } from '@/pages/NotFound';
import { LANGS, langPath } from '@/seo/site';

// 聊天室依賴 PeerJS 與 DiceBear，按需載入，讓首頁（搜尋流量的落地頁）更快
const Room = lazy(() => import('@/pages/Room').then((m) => ({ default: m.Room })));

const RoomFallback = () => (
  <div className="min-h-[100dvh] flex items-center justify-center lantern-glow">
    <div className="w-12 h-14 lantern-body shadow-lantern animate-pulse" aria-label="Loading" />
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {LANGS.map((lang) => (
          <Route key={lang} path={langPath(lang)} element={<Home lang={lang} />} />
        ))}
        <Route
          path="/room/:roomId"
          element={
            <Suspense fallback={<RoomFallback />}>
              <Room />
            </Suspense>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
