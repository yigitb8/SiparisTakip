import { useEffect, useMemo, useState } from "react";
import Column from "./Column";
import AddOrderModal from "./AddOrderModal";
import OrderDetailModal from "./OrderDetailModal";
import { COLUMNS } from "../data/mockOrders";
import { apiGet, apiJson, API_BASE } from "../services/api";

export default function KanbanBoard() {
  const [orders, setOrders] = useState([]);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // ✅ Detay modal state
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const openDetail = (order) => {
    setSelectedOrder(order);
    setDetailOpen(true);
  };

  // ✅ DB'den çek
  useEffect(() => {
    apiGet("/orders")
      .then(setOrders)
      .catch((e) => console.error("orders çekilemedi:", e));
  }, []);

  // ✅ status güncelle (ÖNCE UI, sonra API)
  const setStatus = async (orderId, status) => {
    // eski status'u yakala (hata olursa geri alacağız)
    const prevOrder = orders.find((o) => o.id === orderId);
    const prevStatus = prevOrder?.status;

    // 1) UI'da hemen güncelle (kaybolma olmaz)
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    );

    try {
      // 2) API'ye yaz
      const updated = await apiJson("PATCH", `/orders/${orderId}/status`, {
        status,
      });

      // 3) API düzgün order döndürdüyse onunla senkronla
      if (updated && updated.id) {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      } else {
        console.warn("PATCH response beklenmedik:", updated);
      }
    } catch (e) {
      console.error(e);

      // 4) Hata olursa geri al
      if (prevStatus) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: prevStatus } : o))
        );
      }

      throw e; // moveToPreparing/moveToCompleted catch yakalasın
    }
  };

  // ✅ new -> preparing butonu
  const moveToPreparing = (orderId) => {
    setStatus(orderId, "preparing").catch((e) => {
      alert("Durum güncelleme hatası ❌\n" + (e?.message || e));
    });
  };

  // ✅ preparing -> completed butonu
  const moveToCompleted = (orderId) => {
    setStatus(orderId, "completed").catch((e) => {
      alert("Tamamlama hatası ❌\n" + (e?.message || e));
    });
  };

  const grouped = useMemo(() => {
    const map = {};
    for (const c of COLUMNS) map[c.id] = [];
    for (const o of orders) (map[o.status] ??= []).push(o);
    return map;
  }, [orders]);

  return (
    <div className="boardWrap">
      <div className="boardTop">
        <h1>YYG Sipariş Takip Sistemi</h1>

        <button className="btnAdd" onClick={() => setIsAddOpen(true)}>
          + Sipariş Ekle
        </button>
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
          />
        ))}
      </div>

      {/* ✅ Modal submit -> API POST */}
      <AddOrderModal
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSubmit={async ({ file, description, createdBy }) => {
          try {
            const fd = new FormData();
            fd.append("file", file);
            fd.append("note", description || "");
            fd.append("customer", createdBy?.trim() || "Yeni Sipariş");

            const res = await fetch(`${API_BASE}/orders`, {
              method: "POST",
              body: fd,
            });

            if (!res.ok) throw new Error(await res.text());

            const created = await res.json();
            setOrders((prev) => [created, ...prev]);
            setIsAddOpen(false);
          } catch (e) {
            console.error(e);
            alert("Sipariş ekleme hatası ❌\n" + (e?.message || e));
          }
        }}
      />

      {/* ✅ Detay Modal */}
      <OrderDetailModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        order={selectedOrder}
      />
    </div>
  );
}