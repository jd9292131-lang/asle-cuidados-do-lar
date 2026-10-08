"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, ArrowLeft, Loader2 } from "lucide-react";

export default function EntrarPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        setError(data.message || "Não foi possível iniciar sessão.");
        return;
      }

      window.location.href = data.redirectTo || "/";
    } catch {
      setError(
        "Não foi possível contactar o servidor. Verifique a sua ligação e tente novamente."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="asle-auth-page">
      <div className="asle-auth-shell">
        <section className="asle-auth-brand">
          <Link href="/" className="asle-auth-back">
            <ArrowLeft size={18} />
            Voltar ao início
          </Link>

          <div className="asle-auth-brand-content">
            <div className="asle-auth-logo">ASLE</div>

            <span className="asle-auth-kicker">CUIDADOS DO LAR</span>

            <h1>
              Pessoas certas.
              <br />
              <span>Cuidados de confiança.</span>
            </h1>

            <p>
              Aceda à sua conta ASLE para acompanhar os seus pedidos,
              candidaturas e processos.
            </p>
          </div>

          <div className="asle-auth-brand-footer">
            <span>ASLE — Cuidados do Lar</span>
            <span>Luanda, Angola</span>
          </div>
        </section>

        <section className="asle-auth-panel">
          <div className="asle-auth-form-wrap">
            <div className="asle-auth-mobile-logo">
              <div className="asle-auth-logo">ASLE</div>
              <span>CUIDADOS DO LAR</span>
            </div>

            <div className="asle-auth-heading">
              <span className="asle-auth-label">ÁREA RESERVADA</span>

              <h2>Bem-vindo de volta</h2>

              <p>
                Introduza os seus dados para entrar na sua conta.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="asle-auth-form">
              {error && (
                <div className="asle-auth-error" role="alert">
                  {error}
                </div>
              )}

              <div className="asle-auth-field">
                <label htmlFor="email">E-mail</label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="nome@exemplo.com"
                  autoComplete="email"
                  required
                  disabled={loading}
                />
              </div>

              <div className="asle-auth-field">
                <div className="asle-auth-field-top">
                  <label htmlFor="password">Palavra-passe</label>

                  <Link href="/recuperar-senha">
                    Esqueceu-se?
                  </Link>
                </div>

                <div className="asle-auth-password">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Introduza a sua palavra-passe"
                    autoComplete="current-password"
                    required
                    disabled={loading}
                  />

                  <button
                    type="button"
                    className="asle-auth-password-toggle"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={
                      showPassword
                        ? "Ocultar palavra-passe"
                        : "Mostrar palavra-passe"
                    }
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff size={19} />
                    ) : (
                      <Eye size={19} />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="asle-auth-submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="asle-auth-spinner" size={19} />
                    A entrar...
                  </>
                ) : (
                  "Entrar na minha conta"
                )}
              </button>
            </form>

            <div className="asle-auth-register">
              <span>Ainda não tem uma conta?</span>

              <Link href="/registar">
                Criar uma conta
              </Link>
            </div>

            <p className="asle-auth-security">
              O acesso à sua conta é protegido e os seus dados são tratados
              de forma confidencial.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}