import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import KanbanBoard from "./components/KanbanBoard";
import OrderContentPage from "./pages/OrderContentPage";
import LoginPage from "./pages/LoginPage";
import "./styles/kanban.css";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<KanbanBoard />} />
        <Route path="/order/:orderId/content" element={<OrderContentPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}