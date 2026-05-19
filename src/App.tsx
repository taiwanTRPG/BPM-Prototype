import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { FormDetailPage } from './pages/FormDetail';
import { FormNewPage } from './pages/FormNew';
import { HomePage } from './pages/Home';
import { InboxPage } from './pages/Inbox';
import { AppProvider } from './store/AppContext';

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="inbox" element={<InboxPage />} />
            <Route path="forms/new" element={<FormNewPage />} />
            <Route path="forms/:id" element={<FormDetailPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </AppProvider>
  );
}
