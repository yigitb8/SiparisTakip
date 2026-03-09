import { BrowserRouter, Routes, Route } from "react-router-dom";
import KanbanBoard from "./components/KanbanBoard";
import OrderContentPage from "./pages/OrderContentPage";
import "./styles/kanban.css";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<KanbanBoard />} />
        <Route path="/order/:orderId/content" element={<OrderContentPage />} />
      </Routes>
    </BrowserRouter>
  );
}