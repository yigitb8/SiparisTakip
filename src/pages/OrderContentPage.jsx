import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiGet, apiJson } from "../services/api";
import { findBookByIsbn, normalizeIsbn } from "../services/bookLookup";

const headers = ["id", "isbn", "kitap adı", "kitap konumu", "adet"];

function emptyRow() {
  return { id: "", isbn: "", "kitap adı": "", "kitap konumu": "", adet: 1 };
}

export default function OrderContentPage() {
  const { orderId } = useParams();

  const [rows, setRows] = useState([emptyRow()]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ✅ Sayfa açılınca DB’den çek
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const data = await apiGet(`/orders/${orderId}/items`);
        if (!mounted) return;

        if (Array.isArray(data) && data.length > 0) {
          // adet yoksa 1 ver
          const normalized = data.map((r) => ({
            ...r,
            adet: r.adet ?? 1,
          }));
          setRows(normalized);
        } else {
          setRows([emptyRow()]);
        }
      } catch (e) {
        console.error(e);
        setRows([emptyRow()]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [orderId]);

  const updateCell = (rowIndex, key, value) => {
    setRows((prev) =>
      prev.map((r, i) => (i === rowIndex ? { ...r, [key]: value } : r))
    );
  };

  const addRow = () => setRows((prev) => [...prev, emptyRow()]);
  const removeRow = (rowIndex) =>
    setRows((prev) => prev.filter((_, i) => i !== rowIndex));

  // ✅ ISBN girince kitap adı + konum doldur
  const fillFromIsbn = async (rowIndex, isbnValue) => {
    const normalized = normalizeIsbn(isbnValue);
    updateCell(rowIndex, "isbn", normalized);

    const found = await findBookByIsbn(normalized);
    if (!found) return;

    updateCell(rowIndex, "kitap adı", found.title);
    updateCell(rowIndex, "kitap konumu", found.location);
  };

  // ✅ Kaydet → DB’ye yaz
  const save = async () => {
    setSaving(true);
    try {
      // adet’i sayıya çevir, min 1 yap
      const payload = rows.map((r) => ({
        ...r,
        adet: Math.max(1, parseInt(r.adet, 10) || 1),
      }));

      await apiJson("PUT", `/orders/${orderId}/items`, payload);
      alert("Kaydedildi ✅");
    } catch (e) {
      console.error(e);
      alert(`Kaydetme hatası ❌\n${e?.message || e}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <div
        style={{
          display: "flex",
          alignItems: "end",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>Sipariş İçeriği</h2>
          <div style={{ opacity: 0.7, marginTop: 6 }}>
            Sipariş: <b>{orderId}</b>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button className="btnGhost" onClick={addRow}>
            + Satır Ekle
          </button>
          <button className="btnPrimarySolid" onClick={save} disabled={saving}>
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ marginTop: 16, opacity: 0.7 }}>Yükleniyor...</div>
      ) : (
        <div style={{ marginTop: 14, overflowX: "auto" }}>
          <table
            style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}
          >
            <thead>
              <tr>
                {headers.map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "10px 12px",
                      borderBottom: "1px solid #e6e6ea",
                      background: "#fafafa",
                      position: "sticky",
                      top: 0,
                    }}
                  >
                    {h}
                  </th>
                ))}
                <th
                  style={{
                    padding: "10px 12px",
                    borderBottom: "1px solid #e6e6ea",
                    background: "#fafafa",
                  }}
                >
                  İşlem
                </th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {headers.map((key) => (
                    <td
                      key={key}
                      style={{
                        padding: "10px 12px",
                        borderBottom: "1px solid #f0f0f3",
                      }}
                    >
                      <input
                        type={key === "adet" ? "number" : "text"}
                        min={key === "adet" ? 1 : undefined}
                        value={row[key] ?? ""}
                        onChange={(e) => updateCell(rowIndex, key, e.target.value)}
                        onBlur={
                          key === "isbn"
                            ? (e) => fillFromIsbn(rowIndex, e.target.value)
                            : undefined
                        }
                        placeholder={key}
                        style={{
                          width: "100%",
                          padding: "10px",
                          borderRadius: 10,
                          border: "1px solid #e6e6ea",
                        }}
                      />
                    </td>
                  ))}

                  <td
                    style={{
                      padding: "10px 12px",
                      borderBottom: "1px solid #f0f0f3",
                    }}
                  >
                    <button className="linkBtn" onClick={() => removeRow(rowIndex)}>
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: 10, opacity: 0.65, fontSize: 12 }}>
            ISBN yaz → başka alana tıkla (blur) → kitap adı ve konum otomatik dolmalı.
          </div>
        </div>
      )}
    </div>
  );
}