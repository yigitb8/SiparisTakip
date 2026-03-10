import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../services/api";

export default function LoginPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const updateField = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.username.trim() || !form.password.trim()) {
      setError("Kullanıcı adı ve şifre zorunludur.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/login.php`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: form.username.trim(),
          password: form.password,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.message || "Giriş başarısız.");
      }

      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || "Giriş sırasında hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="loginPage">
      <div className="loginBackdrop" />

      <div className="loginCard">
        <div className="loginBrand">
          <div className="loginLogo">YYG</div>

          <div>
            <h1>YYG Sipariş Takip</h1>
            <p>Hesabınızla giriş yaparak devam edin</p>
          </div>
        </div>

        <form className="loginForm" onSubmit={handleSubmit}>
          <div className="loginFormGroup">
            <label htmlFor="username">Kullanıcı Adı</label>
            <input
              id="username"
              type="text"
              placeholder="Kullanıcı adınızı girin"
              value={form.username}
              onChange={(e) => updateField("username", e.target.value)}
              autoComplete="username"
            />
          </div>

          <div className="loginFormGroup">
            <label htmlFor="password">Şifre</label>
            <input
              id="password"
              type="password"
              placeholder="Şifrenizi girin"
              value={form.password}
              onChange={(e) => updateField("password", e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {error && <div className="loginError">{error}</div>}

          <button className="loginBtn" type="submit" disabled={loading}>
            {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>
        </form>
      </div>
    </div>
  );
}