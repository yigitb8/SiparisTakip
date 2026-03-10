import { useEffect, useState } from "react";
import { apiGet } from "../services/api";

function statusLabel(status) {
  if (status === "new") return "Gelen";
  if (status === "preparing") return "Hazırlanıyor";
  if (status === "completed") return "Tamamlandı";
  return status || "-";
}

export default function OrderDetailModal({ open, onClose, order }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !order?.id) return;

    setLoading(true);

    apiGet(`/order-items.php?id=${encodeURIComponent(order.id)}`)
      .then((data) => {
        setItems(Array.isArray(data) ? data : []);
      })
      .catch((e) => {
        console.error(e);
        setItems([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [open, order]);

  if (!open || !order) return null;

  return (
    <div
      className="modalOverlay"
      onMouseDown={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-detail-title"
    >
      <div
        className="modal modalWide"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modalHeader">
          <h2 id="order-detail-title">Sipariş Detayı</h2>
          <button type="button" className="iconBtn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="detailWrap">
          <div className="detailTopGrid">
            <div className="detailCard">
              <div className="detailLabel">Sipariş ID</div>
              <div className="detailValue">{order.id}</div>
            </div>

            <div className="detailCard">
              <div className="detailLabel">Durum</div>
              <div className="detailValue">{statusLabel(order.status)}</div>
            </div>

            <div className="detailCard">
              <div className="detailLabel">Oluşturma Tarihi</div>
              <div className="detailValue">{order.createdAt || "-"}</div>
            </div>
          </div>

          <div className="detailSection">
            <div className="detailSectionHeader">
              <div className="detailSectionTitle">Oluşturan</div>
            </div>
            <div className="detailNote">{order.customer || "-"}</div>
          </div>

          <div className="detailSection">
            <div className="detailSectionHeader">
              <div className="detailSectionTitle">Açıklama</div>
            </div>
            <div className="detailNote">{order.note || "-"}</div>
          </div>

          <div className="detailSection">
            <div className="detailSectionHeader">
              <div className="detailSectionTitle">Sipariş İçeriği</div>
              <div className="detailSectionMeta">{items.length} satır</div>
            </div>

            {loading ? (
              <div className="detailEmpty">Yükleniyor...</div>
            ) : items.length === 0 ? (
              <div className="detailEmpty">Sipariş içeriği bulunamadı.</div>
            ) : (
              <div className="detailTableWrap">
                <table className="detailTable">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>ISBN</th>
                      <th>Adet</th>
                      <th>Kitap Adı</th>
                      <th>Kitap Konumu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, i) => (
                      <tr key={i}>
                        <td>{item.id || "-"}</td>
                        <td>{item.isbn || "-"}</td>
                        <td>{item.adet || "-"}</td>
                        <td>{item["kitap adı"] || "-"}</td>
                        <td>{item["kitap konumu"] || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="modalFooter">
            <button type="button" className="btnGhost" onClick={onClose}>
              Kapat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}