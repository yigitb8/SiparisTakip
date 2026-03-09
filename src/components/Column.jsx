import OrderCard from "./OrderCard";

export default function Column({ column, orders, onPrepare, onComplete, onOpenDetail }) {
  return (
    <div className="column">
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
          />
        ))}
      </div>
    </div>
  );
}