import { API_BASE } from "../services/api";

// import { useDraggable } from "@dnd-kit/core";

export default function OrderCard({ order, onPrepare, onComplete, onOpenDetail }) {
  const hasFile = Boolean(order?.fileName && order?.fileStoredName);

  return (
    <div className="card">
      <div className="cardTop">
        <span className="badge">{order.id}</span>
      </div>

      <div className="cardTitle">{order.customer || "—"}</div>

      <div className="cardMeta">
        <span>🕒 {order.createdAt}</span>
      </div>

      {/* ✅ Dosya linki */}
      {hasFile && (
        <a
          className="fileLink"
          href={`${API_BASE}/orders/${encodeURIComponent(order.id)}/file`}
          title="Dosyayı indir"
        >
          📎 {order.fileName}
        </a>
      )}

      {/* ✅ Açıklama */}
      {order.note && <div className="cardNote">{order.note}</div>}

      {/* ✅ Gelen (new) */}
      {order.status === "new" && (
        <button className="btnPrimary" onClick={() => onPrepare?.(order.id)}>
          Siparişi Hazırla
        </button>
      )}

      {/* ✅ Hazırlanıyor (preparing) */}
      {order.status === "preparing" && (
        <>
          <button
            className="btnPrimary"
            onClick={() =>
              window.open(
                `/order/${encodeURIComponent(order.id)}/content`,
                "_blank",
                "noopener,noreferrer"
              )
            }
          >
            İçerik Oluştur
          </button>

          <button
            className="btnPrimarySolid"
            onClick={() => onComplete?.(order.id)}
          >
            Tamamla
          </button>

          <button className="btnGhostFull" onClick={() => onOpenDetail?.(order)}>
            Detayları Gör
          </button>
        </>
      )}

      {/* ✅ Tamamlanan (completed) */}
      {order.status === "completed" && (
        <button className="btnGhostFull" onClick={() => onOpenDetail?.(order)}>
          Detayları Gör
        </button>
      )}
    </div>
  );
}