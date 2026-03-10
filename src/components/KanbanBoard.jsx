import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Column from "../components/Column";
import AddOrderModal from "../components/AddOrderModal";
import OrderDetailModal from "../components/OrderDetailModal";
import { COLUMNS } from "../data/mockOrders";
import { apiGet, apiJson, apiForm, API_BASE } from "../services/api";

export default function KanbanBoard() {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [orders, setOrders] = useState([]);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const goLogin = useCallback(() => {
    setCurrentUser(null);
    navigate("/login", { replace: true });
  }, [navigate]);

  const openDetail = (order) => {
    setSelectedOrder(order);
    setDetailOpen(true);
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setSelectedOrder(null);
  };

  const fetchCurrentUser = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/me.php`, {
        credentials: "include",
        cache: "no-store",
      });

      if (!res.ok) {
        goLogin();
        return;
      }

      const data = await res.json();

      if (data?.authenticated && data?.user) {
        setCurrentUser(data.user);
      } else {
        goLogin();
      }
    } catch (e) {
      console.error("Kullanıcı bilgisi alınamadı:", e);
      goLogin();
    } finally {
      setAuthChecked(true);
    }
  }, [goLogin]);

  const fetchOrders = useCallback(async () => {
    try {
      const data = await apiGet("/orders.php");
      setOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("orders çekilemedi:", e);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchOrders();
    }
  }, [currentUser, fetchOrders]);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.origin !== window.location.origin) return;

      if (event.data?.type === "ORDER_ITEMS_SAVED") {
        fetchOrders();
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [fetchOrders]);

  const logout = async () => {
    try {
      await fetch(`${API_BASE}/logout.php`, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });
    } catch (e) {
      console.error("Çıkış yapılırken hata oluştu:", e);
    } finally {
      goLogin();
    }
  };

  const setStatus = async (orderId, status) => {
    const prevOrders = [...orders];

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    );

    try {
      const updated = await apiJson("POST", "/update-status.php", {
        id: orderId,
        status,
      });

      if (updated && updated.id) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? updated : o))
        );
      }
    } catch (e) {
      console.error(e);
      setOrders(prevOrders);
      alert("Durum güncelleme hatası ❌");
    }
  };

  const moveToPreparing = (orderId) => {
    setStatus(orderId, "preparing");
  };

  const moveToCompleted = (orderId) => {
    setStatus(orderId, "completed");
  };

  const deleteOrder = async (orderId) => {
    if (!window.confirm("Sipariş silinsin mi?")) return;

    try {
      await apiJson("POST", "/delete-order.php", {
        id: orderId,
      });

      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch (e) {
      console.error(e);
      alert("Silme hatası ❌");
    }
  };

  const grouped = useMemo(() => {
    const map = {};

    for (const c of COLUMNS) map[c.id] = [];

    for (const o of orders) {
      (map[o.status] ??= []).push(o);
    }

    return map;
  }, [orders]);

  if (!authChecked) {
    return <div style={{ padding: 24 }}>Kullanıcı kontrol ediliyor...</div>;
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="boardWrap">
      <div className="boardTop">
        <div>
          <h1>YYG Sipariş Takip Sistemi</h1>
          <div className="boardHint">
            👤 {currentUser.name || currentUser.username || currentUser.email}
          </div>
        </div>

        <div className="actionsResponsive">
          <button className="btnGhost" onClick={logout}>
            Çıkış Yap
          </button>

          <button className="btnAdd" onClick={() => setIsAddOpen(true)}>
            + Sipariş Ekle
          </button>
        </div>
      </div>

      <div className="board">
        {COLUMNS.map((c) => (
          <Column
            key={c.id}
            column={c}
            orders={grouped[c.id] || []}
            onPrepare={moveToPreparing}
            onComplete={moveToCompleted}
            onOpenDetail={openDetail}
            onDelete={deleteOrder}
          />
        ))}
      </div>

      <AddOrderModal
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSubmit={async ({ file, description }) => {
          try {
            const fd = new FormData();
            fd.append("file", file);
            fd.append("note", description || "");

            const created = await apiForm("/create-order.php", fd);

            setOrders((prev) => [created, ...prev]);
            setIsAddOpen(false);
          } catch (e) {
            console.error(e);
            alert("Sipariş ekleme hatası ❌");
          }
        }}
      />

      <OrderDetailModal
        open={detailOpen}
        onClose={closeDetail}
        order={selectedOrder}
      />
    </div>
  );
}