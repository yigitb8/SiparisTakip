import { useDroppable } from "@dnd-kit/core";
import OrderCard from "./OrderCard";

export default function Column({ column, orders, onPrepare, onComplete, onOpenDetail, onDelete }) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  return (
    <div
      ref={setNodeRef}
      className="column"
      style={{
        outline: isOver ? "2px dashed #999" : "none",
        outlineOffset: "4px",
      }}
    >
      <div className="columnHeader">
        <div className="columnTitle">{column.title}</div>
        <div className="columnCount">{orders.length}</div>
      </div>

      <div className="columnBody">
        {orders.map((o) => (
          <OrderCard
            key={o.id}
            order={o}
            onPrepare={onPrepare}
            onComplete={onComplete}
            onOpenDetail={onOpenDetail}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}