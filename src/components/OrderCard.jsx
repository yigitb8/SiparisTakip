import { API_BASE } from "../services/api";
import { useNavigate } from "react-router-dom";

function statusLabel(status) {
  if (status === "new") return "Gelen";
  if (status === "preparing") return "Hazırlanıyor";
  if (status === "completed") return "Tamamlandı";
  return status || "-";
}

export default function OrderCard({
  order,
  onPrepare,
  onComplete,
  onOpenDetail,
  onDelete,
}) {
  const hasFile = Boolean(order?.fileName && order?.fileStoredName);
  const navigate = useNavigate();

  const openContent = () => {
    navigate(`/order/${encodeURIComponent(order.id)}/content`);
  };

  return (
    <div className="card">
      <div className="cardTop">
        <span className="badge">{order.id}</span>
      </div>

      <div className="cardTitle">{order.customer || "—"}</div>

      <div className="cardMeta">
        <span>🕒 {order.createdAt || "-"}</span>
        {order.status && <span>📌 {statusLabel(order.status)}</span>}
      </div>

      {hasFile && (
        <a
          className="fileLink"
          href={`${API_BASE}/download-order-file.php?id=${encodeURIComponent(order.id)}`}
          title="Dosyayı indir"
          target="_blank"
          rel="noreferrer"
        >
          📎 {order.fileName}
        </a>
      )}

      {order.note && <div className="cardNote">{order.note}</div>}

      {order.status === "new" && (
        <>
          <button
            type="button"
            className="btnPrimary"
            onClick={() => onPrepare?.(order.id)}
          >
            Siparişi Hazırla
          </button>

          <button
            type="button"
            className="btnGhostFull"
            onClick={() => onDelete?.(order.id)}
          >
            Sil
          </button>
        </>
      )}

      {order.status === "preparing" && (
        <>
          <button
            type="button"
            className="btnPrimary"
            onClick={openContent}
          >
            İçerik Oluştur
          </button>

          <button
            type="button"
            className="btnPrimarySolidFull"
            onClick={() => onComplete?.(order.id)}
          >
            Tamamla
          </button>

          <button
            type="button"
            className="btnGhostFull"
            onClick={() => onOpenDetail?.(order)}
          >
            Detayları Gör
          </button>
        </>
      )}

      {order.status === "completed" && (
        <button
          type="button"
          className="btnGhostFull"
          onClick={() => onOpenDetail?.(order)}
        >
          Detayları Gör
        </button>
      )}
    </div>
  );
}