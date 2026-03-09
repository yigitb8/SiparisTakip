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
  const [createdBy, setCreatedBy] = useState(""); // ✅ yeni alan
  const fileInputRef = useRef(null);

  const allowedExt = useMemo(
    () => ["xls", "xlsx", "doc", "docx", "png", "jpeg", "jpg"],
    []
  );

  useEffect(() => {
    if (!open) {
      setFile(null);
      setDescription("");
      setCreatedBy(""); // ✅ modal kapanınca temizle
    }
  }, [open]);

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
      if (clearInput && fileInputRef.current) fileInputRef.current.value = "";
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

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUpload = () => {
    if (!file) return;

    onSubmit?.({
      file,
      description,
      createdBy, // ✅ buradan dışarı gönderiyoruz
    });
  };

  return (
    <div className="modalOverlay" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modalHeader">
          <h2>Sipariş Ekle</h2>
          <button className="iconBtn" onClick={onClose} aria-label="Kapat">
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
            if (e.key === "Enter" || e.key === " ")
              fileInputRef.current?.click();
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
              className="linkBtn"
              onClick={() => {
                setFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
            >
              Kaldır
            </button>
          </div>
        )}

        {/* ✅ Oluşturan kişi */}
        <div className="formGroup">
          <label>Oluşturan Kişi</label>
          <input
            value={createdBy}
            onChange={(e) => setCreatedBy(e.target.value)}
          />
        </div>

        {/* ✅ Açıklama */}
        <div className="formGroup">
          <label>Açıklama</label>
          <textarea
            placeholder="Sipariş ile ilgili not giriniz..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
        </div>

        <div className="modalFooter">
          <button className="btnGhost" onClick={onClose}>
            Vazgeç
          </button>
          <button className="btnPrimarySolid" disabled={!file} onClick={handleUpload}>
            Yükle
          </button>
        </div>
      </div>
    </div>
  );
}