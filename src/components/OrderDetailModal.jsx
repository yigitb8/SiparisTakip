import { useEffect, useState } from "react";
import { apiGet } from "../services/api";

function statusLabel(status) {
  if (status === "new") return "Gelen";
  if (status === "preparing") return "Hazırlanıyor";
  if (status === "completed") return "Tamamlanan";
  return status || "-";
}

export default function OrderDetailModal({ open, onClose, order }) {
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [itemsError, setItemsError] = useState("");

  useEffect(() => {
    if (!open || !order?.id) return;

    let mounted = true;
    setLoadingItems(true);
    setItemsError("");

    apiGet(`/orders/${encodeURIComponent(order.id)}/items`)
      .then((data) => {
        if (!mounted) return;
        setItems(Array.isArray(data) ? data : []);
      })
      .catch((e) => {
        if (!mounted) return;
        console.error(e);
        setItems([]);
        setItemsError("Sipariş içeriği alınamadı.");
      })
      .finally(() => {
        if (!mounted) return;
        setLoadingItems(false);
      });

    return () => {
      mounted = false;
    };
  }, [open, order?.id]);

  if (!open) return null;

  const totalQty = items.reduce((sum, it) => sum + (parseInt(it.adet, 10) || 0), 0);

  return (
    <div className="modalOverlay" onMouseDown={onClose}>
      <div className="modal modalWide" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modalHeader">
          <h2>Sipariş Detayı</h2>
          <button className="iconBtn" onClick={onClose} aria-label="Kapat">
            ✕
          </button>
        </div>

        {!order ? (
          <div style={{ padding: 12, opacity: 0.7 }}>Sipariş bulunamadı.</div>
        ) : (
          <div className="detailWrap">
            {/* Üst Bilgi Kartları */}
            <div className="detailTopGrid">
              <div className="detailCard">
                <div className="detailLabel">Sipariş ID</div>
                <div className="detailValue">{order.id}</div>
              </div>

              <div className="detailCard">
                <div className="detailLabel">Sipariş Durumu</div>
                <div className="detailValue">{statusLabel(order.status)}</div>
              </div>

              <div className="detailCard">
                <div className="detailLabel">Oluşturma Tarihi</div>
                <div className="detailValue">{order.createdAt || "-"}</div>
              </div>
            </div>

            {/* Açıklama */}
            <div className="detailSection">
              <div className="detailSectionTitle">Açıklama</div>
              <div className="detailNote">
                {order.note?.trim() ? order.note : "-"}
              </div>
            </div>

            {/* Sipariş İçeriği */}
            <div className="detailSection">
              <div className="detailSectionHeader">
                <div className="detailSectionTitle">Sipariş İçeriği</div>
                <div className="detailSectionMeta">
                  {loadingItems ? "Yükleniyor..." : `${items.length} satır • Toplam adet: ${totalQty}`}
                </div>
              </div>

              {itemsError ? (
                <div className="detailEmpty">{itemsError}</div>
              ) : loadingItems ? (
                <div className="detailEmpty">İçerik yükleniyor...</div>
              ) : items.length === 0 ? (
                <div className="detailEmpty">Henüz sipariş içeriği girilmemiş.</div>
              ) : (
                <div className="detailTableWrap">
                  <table className="detailTable">
                    <thead>
                      <tr>
                        <th>id</th>
                        <th>isbn</th>
                        <th>kitap adı</th>
                        <th>kitap konumu</th>
                        <th>adet</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it, idx) => (
                        <tr key={idx}>
                          <td>{it.id ?? "-"}</td>
                          <td>{it.isbn ?? "-"}</td>
                          <td>{it["kitap adı"] ?? "-"}</td>
                          <td>{it["kitap konumu"] ?? "-"}</td>
                          <td>{it.adet ?? 1}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="modalFooter">
          <button className="btnGhost" onClick={onClose}>
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}