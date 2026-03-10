import { useEffect, useMemo, useRef, useState } from "react";

const ACCEPT =
  ".xls,.xlsx,.doc,.docx,.png,.jpeg,.jpg," +
  "application/vnd.ms-excel," +
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet," +
  "application/msword," +
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document," +
  "image/png,image/jpeg";

export default function AddOrderModal({ open, onClose, onSubmit }) {
  const [file, setFile] = useState(null);
  const [description, setDescription] = useState("");
  const fileInputRef = useRef(null);

  const allowedExt = useMemo(
    () => ["xls", "xlsx", "doc", "docx", "png", "jpeg", "jpg"],
    []
  );

  useEffect(() => {
    if (!open) {
      setFile(null);
      setDescription("");
      return;
    }

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

  if (!open) return null;

  const validateFile = (f) => {
    const name = (f?.name || "").toLowerCase();
    const ext = name.split(".").pop();
    return allowedExt.includes(ext);
  };

  const setValidatedFile = (f, clearInput = false) => {
    if (!f) return;

    if (!validateFile(f)) {
      alert("Desteklenmeyen dosya türü. (.xls .xlsx .doc .docx .png .jpeg .jpg)");
      if (clearInput && fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setFile(f);
  };

  const handlePick = (e) => {
    const f = e.target.files?.[0];
    setValidatedFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    setValidatedFile(f);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpload = () => {
    if (!file) return;

    onSubmit?.({
      file,
      description,
    });
  };

  return (
    <div
      className="modalOverlay"
      onMouseDown={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-order-modal-title"
    >
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modalHeader">
          <h2 id="add-order-modal-title">Sipariş Ekle</h2>
          <button
            type="button"
            className="iconBtn"
            onClick={onClose}
            aria-label="Kapat"
          >
            ✕
          </button>
        </div>

        <div
          className="dropzone"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              fileInputRef.current?.click();
            }
          }}
        >
          <div className="dropTitle">Dosyayı buraya sürükle bırak</div>
          <div className="dropSub">veya tıklayıp seç</div>
          <div className="dropHint">
            .xls, .xlsx, .doc, .docx, .png, .jpeg, .jpg
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT}
            onChange={handlePick}
            className="fileInputHidden"
          />
        </div>

        {file && (
          <div className="fileRow">
            <div className="fileName">📎 {file.name}</div>
            <button
              type="button"
              className="linkBtn"
              onClick={() => {
                setFile(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }}
            >
              Kaldır
            </button>
          </div>
        )}

        <div className="formGroup">
          <label htmlFor="order-description">Açıklama</label>
          <textarea
            id="order-description"
            placeholder="Sipariş ile ilgili not giriniz..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
        </div>

        <div className="modalFooter">
          <button type="button" className="btnGhost" onClick={onClose}>
            Vazgeç
          </button>

          <button
            type="button"
            className="btnPrimarySolid"
            disabled={!file}
            onClick={handleUpload}
          >
            Yükle
          </button>
        </div>
      </div>
    </div>
  );
}