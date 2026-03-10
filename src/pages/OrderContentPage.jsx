import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiGet, apiJson } from "../services/api";
import { findBookByIsbn, normalizeIsbn } from "../services/bookLookup";

const headers = ["id", "isbn", "adet", "kitap adı", "kitap konumu"];

function emptyRow() {
  return {
    id: "",
    isbn: "",
    adet: 1,
    "kitap adı": "",
    "kitap konumu": "",
  };
}

export default function OrderContentPage() {
  const navigate = useNavigate();
  const { orderId } = useParams();

  const [rows, setRows] = useState([emptyRow()]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mergeNotice, setMergeNotice] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const mergeNoticeTimerRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        if (!orderId) {
          setRows([emptyRow()]);
          setLoading(false);
          return;
        }

        const data = await apiGet(
          `/order-items.php?id=${encodeURIComponent(orderId)}`
        );

        if (!mounted) return;

        if (Array.isArray(data) && data.length > 0) {
          setRows(
            data.map((row) => ({
              id: row.id ?? "",
              isbn: row.isbn ?? "",
              adet: row.adet ?? 1,
              "kitap adı": row["kitap adı"] ?? "",
              "kitap konumu": row["kitap konumu"] ?? "",
            }))
          );
        } else {
          setRows([emptyRow()]);
        }

        setIsDirty(false);
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

  useEffect(() => {
    return () => {
      if (mergeNoticeTimerRef.current) {
        clearTimeout(mergeNoticeTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty]);

  const showMergeNotice = (message) => {
    setMergeNotice(message);

    if (mergeNoticeTimerRef.current) {
      clearTimeout(mergeNoticeTimerRef.current);
    }

    mergeNoticeTimerRef.current = setTimeout(() => {
      setMergeNotice("");
    }, 2000);
  };

  const updateCell = (rowIndex, key, value) => {
    setIsDirty(true);

    setRows((prev) =>
      prev.map((r, i) => (i === rowIndex ? { ...r, [key]: value } : r))
    );
  };

  const addRow = () => {
    setIsDirty(true);
    setRows((prev) => [...prev, emptyRow()]);
  };

  const removeRow = (rowIndex) => {
    setIsDirty(true);

    setRows((prev) => {
      const filtered = prev.filter((_, i) => i !== rowIndex);
      return filtered.length ? filtered : [emptyRow()];
    });
  };

  const fillFromIsbn = async (rowIndex, isbnValue) => {
    const normalized = normalizeIsbn(isbnValue);

    if (!normalized) {
      setRows((prev) =>
        prev.map((r, i) => (i === rowIndex ? { ...r, isbn: "" } : r))
      );
      return;
    }

    const currentRows = rows.map((r, i) =>
      i === rowIndex ? { ...r, isbn: normalized } : r
    );
    setRows(currentRows);

    try {
      const found = await findBookByIsbn(normalized);
      if (!found) return;

      setRows((prev) =>
        prev.map((r, i) =>
          i === rowIndex
            ? {
                ...r,
                isbn: normalized,
                "kitap adı": found.title ?? "",
                "kitap konumu": found.location ?? "",
              }
            : r
        )
      );
    } catch (e) {
      console.error(e);
    }
  };

  const reindexRows = (items) => {
    return items.map((item, index) => ({
      ...item,
      id: index + 1,
    }));
  };

  const mergeRows = (items) => {
    const map = new Map();

    for (const item of items) {
      const isbn = String(item.isbn ?? "").trim();
      const title = String(item["kitap adı"] ?? "").trim();
      const location = String(item["kitap konumu"] ?? "").trim();
      const adet = Math.max(1, Number(item.adet) || 1);

      if (!isbn && !title && !location) continue;

      const key = isbn
        ? `isbn:${isbn.toLowerCase()}`
        : `title:${title.toLowerCase()}`;

      if (!map.has(key)) {
        map.set(key, {
          id: "",
          isbn,
          adet,
          "kitap adı": title,
          "kitap konumu": location,
        });
      } else {
        const existing = map.get(key);

        existing.adet += adet;

        if (!existing.isbn && isbn) existing.isbn = isbn;
        if (!existing["kitap adı"] && title) existing["kitap adı"] = title;
        if (!existing["kitap konumu"] && location) {
          existing["kitap konumu"] = location;
        }

        map.set(key, existing);
      }
    }

    return reindexRows(Array.from(map.values()));
  };

  const mergeIfNeeded = () => {
    setRows((prev) => {
      const merged = mergeRows(prev);

      if (merged.length < prev.length) {
        const mergedCount = prev.length - merged.length;
        showMergeNotice(`${mergedCount} satır otomatik birleştirildi`);
      }

      return merged;
    });
  };

  const handleCellBlur = async (key, rowIndex, value) => {
    if (key === "isbn") {
      await fillFromIsbn(rowIndex, value);
    }

    setTimeout(() => {
      mergeIfNeeded();
    }, 0);
  };

  const goBackToBoard = () => {
    if (isDirty) {
      const confirmed = window.confirm(
        "Kaydedilmemiş değişiklikler var. Çıkmak istediğinize emin misiniz?"
      );

      if (!confirmed) return;
    }

    navigate("/", { replace: true });
  };

  const save = async () => {
    if (!orderId) {
      alert("Sipariş ID bulunamadı ❌");
      return;
    }

    setSaving(true);

    try {
      const mergedRows = reindexRows(mergeRows(rows));
      setRows(mergedRows);

      await apiJson("POST", "/save-order-items.php", {
        orderId,
        items: mergedRows,
      });

      setIsDirty(false);
      alert("Kaydedildi ✅");
      navigate("/", { replace: true });
    } catch (e) {
      console.error(e);
      alert(`Kaydetme hatası ❌\n${e?.message || e}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: isMobile ? 12 : 20 }}>
      {mergeNotice && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 2000,
            background: "#111",
            color: "#fff",
            padding: isMobile ? "14px 18px" : "18px 26px",
            borderRadius: 14,
            fontSize: isMobile ? 13 : 15,
            fontWeight: 800,
            boxShadow: "0 18px 40px rgba(0,0,0,0.25)",
            animation: "fadeScaleIn 0.25s ease",
            textAlign: "center",
            minWidth: isMobile ? 180 : 220,
            maxWidth: "90vw",
          }}
        >
          ✅ {mergeNotice}
        </div>
      )}

      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "stretch" : "end",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: isMobile ? 20 : 24 }}>
            Sipariş İçeriği
          </h2>
          <div style={{ opacity: 0.7, marginTop: 6, fontSize: isMobile ? 13 : 14 }}>
            Sipariş: <b>{orderId || "-"}</b>
          </div>
        </div>

        <div className="actionsResponsive" style={{ width: isMobile ? "100%" : "auto" }}>
          <button
            className="btnGhost"
            onClick={goBackToBoard}
            style={{ width: isMobile ? "100%" : "auto" }}
          >
            Geri Dön
          </button>

          <button
            className="btnGhost"
            onClick={addRow}
            style={{ width: isMobile ? "100%" : "auto" }}
          >
            + Satır Ekle
          </button>

          <button
            className="btnPrimarySolid"
            onClick={save}
            disabled={saving}
            style={{ width: isMobile ? "100%" : "auto" }}
          >
            {saving ? "Kaydediliyor..." : "Yükle"}
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ marginTop: 16, opacity: 0.7 }}>Yükleniyor...</div>
      ) : (
        <div className="tableResponsive" style={{ marginTop: 14 }}>
          <table
            style={{
              width: "100%",
              minWidth: isMobile ? 720 : "100%",
              borderCollapse: "separate",
              borderSpacing: 0,
            }}
          >
            <thead>
              <tr>
                {headers.map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: isMobile ? "8px 10px" : "10px 12px",
                      borderBottom: "1px solid #e6e6ea",
                      background: "#fafafa",
                      position: "sticky",
                      top: 0,
                      whiteSpace: "nowrap",
                      fontSize: isMobile ? 13 : 14,
                    }}
                  >
                    {h}
                  </th>
                ))}
                <th
                  style={{
                    padding: isMobile ? "8px 10px" : "10px 12px",
                    borderBottom: "1px solid #e6e6ea",
                    background: "#fafafa",
                    whiteSpace: "nowrap",
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
                        padding: isMobile ? "8px 10px" : "10px 12px",
                        borderBottom: "1px solid #f0f0f3",
                      }}
                    >
                      {key === "id" ? (
                        <input
                          value={rowIndex + 1}
                          readOnly
                          style={{
                            width: "100%",
                            minWidth: 56,
                            padding: isMobile ? "9px" : "10px",
                            borderRadius: 10,
                            border: "1px solid #e6e6ea",
                            background: "#f5f5f7",
                            fontWeight: 700,
                            color: "#333",
                          }}
                        />
                      ) : (
                        <input
                          value={row[key] ?? ""}
                          onChange={(e) =>
                            updateCell(rowIndex, key, e.target.value)
                          }
                          onBlur={(e) =>
                            handleCellBlur(key, rowIndex, e.target.value)
                          }
                          placeholder={key}
                          type={key === "adet" ? "number" : "text"}
                          min={key === "adet" ? 1 : undefined}
                          style={{
                            width: "100%",
                            minWidth:
                              key === "adet"
                                ? 80
                                : key === "isbn"
                                ? 140
                                : key === "kitap adı"
                                ? 220
                                : 160,
                            padding: isMobile ? "9px" : "10px",
                            borderRadius: 10,
                            border: "1px solid #e6e6ea",
                            fontSize: isMobile ? 14 : 15,
                          }}
                        />
                      )}
                    </td>
                  ))}

                  <td
                    style={{
                      padding: isMobile ? "8px 10px" : "10px 12px",
                      borderBottom: "1px solid #f0f0f3",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <button
                      className="linkBtn"
                      onClick={() => removeRow(rowIndex)}
                    >
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: 10, opacity: 0.65, fontSize: 12 }}>
            Aynı ISBN veya aynı kitap adına sahip satırlar, alandan çıkınca
            otomatik birleştirilir. Satır numaraları otomatik verilir.
          </div>
        </div>
      )}
    </div>
  );
}