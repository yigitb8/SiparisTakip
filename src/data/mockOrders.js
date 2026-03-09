export const COLUMNS = [
  { id: "new", title: "Yeni Siparişler" },
  { id: "preparing", title: "Hazırlanıyor" },
  { id: "completed", title: "Tamamlandı" },
];

export const MOCK_ORDERS = [
  {
    id: "SP-1001",
    customer: "Ali Yılmaz",
    total: 1250,
    itemsCount: 3,
    status: "new",
    createdAt: "2026-03-02 10:05",
    note: "Kapıda ödeme",
  },
  {
    id: "SP-1002",
    customer: "Zeynep Kaya",
    total: 890,
    itemsCount: 1,
    status: "pending",
    createdAt: "2026-03-02 09:40",
    note: "Adres teyidi gerekli",
  },
  {
    id: "SP-1003",
    customer: "Mehmet Demir",
    total: 2199,
    itemsCount: 5,
    status: "preparing",
    createdAt: "2026-03-01 18:22",
    note: "",
  },

];