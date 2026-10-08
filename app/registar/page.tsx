"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Check,
  Eye,
  EyeOff,
  Home,
  Loader2,
  UserRound,
} from "lucide-react";

type AccountType = "CANDIDATE" | "CLIENT";

export default function RegistarPage() {
  const [accountType, setAccountType] =
    useState<AccountType>("CANDIDATE");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (password !== confirmPassword) {
      setError("As palavras-passe não coincidem.");
      return;
    }

    if (password.length < 8) {
      setError(
        "A palavra-passe deve ter pelo menos 8 caracteres."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone,
          password,
          role: accountType,
          companyName:
            accountType === "CLIENT" ? companyName : undefined,
          city,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        setError(
          data.message ||
            "Não foi possível criar a sua conta."
        );
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

  const isCandidate = accountType === "CANDIDATE";

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

            <span className="asle-auth-kicker">
              CUIDADOS DO LAR
            </span>

            <h1>
              Faça parte da
              <br />
              <span>rede ASLE.</span>
            </h1>

            <p>
              Crie a sua conta para trabalhar connosco ou
              encontrar profissionais para os cuidados do lar.
            </p>

            <div className="asle-register-benefits">
              <div className="asle-register-benefit">
                <span className="asle-register-benefit-icon">
                  <Check size={16} />
                </span>
                <span>Processos acompanhados online</span>
              </div>

              <div className="asle-register-benefit">
                <span className="asle-register-benefit-icon">
                  <Check size={16} />
                </span>
                <span>Dados tratados com confidencialidade</span>
              </div>

              <div className="asle-register-benefit">
                <span className="asle-register-benefit-icon">
                  <Check size={16} />
                </span>
                <span>Atendimento personalizado da ASLE</span>
              </div>
            </div>
          </div>

          <div className="asle-auth-brand-footer">
            <span>ASLE — Cuidados do Lar</span>
            <span>Luanda, Angola</span>
          </div>
        </section>

        <section className="asle-auth-panel asle-register-panel">
          <div className="asle-auth-form-wrap">
            <div className="asle-auth-mobile-logo">
              <div className="asle-auth-logo">ASLE</div>
              <span>CUIDADOS DO LAR</span>
            </div>

            <div className="asle-auth-heading">
              <span className="asle-auth-label">
                CRIAR CONTA
              </span>

              <h2>Comece por aqui</h2>

              <p>
                Escolha como pretende utilizar a plataforma
                ASLE.
              </p>
            </div>

            <div className="asle-register-types">
              <button
                type="button"
                className={`asle-register-type ${
                  isCandidate ? "is-active" : ""
                }`}
                onClick={() => setAccountType("CANDIDATE")}
                disabled={loading}
              >
                <span className="asle-register-type-icon">
                  <BriefcaseBusiness size={21} />
                </span>

                <span className="asle-register-type-content">
                  <strong>Quero trabalhar</strong>
                  <small>
                    Candidatar-me como profissional
                  </small>
                </span>

                <span className="asle-register-type-check">
                  {isCandidate && <Check size={15} />}
                </span>
              </button>

              <button
                type="button"
                className={`asle-register-type ${
                  !isCandidate ? "is-active" : ""
                }`}
                onClick={() => setAccountType("CLIENT")}
                disabled={loading}
              >
                <span className="asle-register-type-icon">
                  <Home size={21} />
                </span>

                <span className="asle-register-type-content">
                  <strong>Preciso de uma profissional</strong>
                  <small>
                    Solicitar serviços para o lar
                  </small>
                </span>

                <span className="asle-register-type-check">
                  {!isCandidate && <Check size={15} />}
                </span>
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="asle-auth-form"
            >
              {error && (
                <div className="asle-auth-error" role="alert">
                  {error}
                </div>
              )}

              <div className="asle-register-section-title">
                <UserRound size={17} />
                <span>Dados pessoais</span>
              </div>

              <div className="asle-register-grid">
                <div className="asle-auth-field">
                  <label htmlFor="firstName">Nome</label>

                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={firstName}
                    onChange={(event) =>
                      setFirstName(event.target.value)
                    }
                    placeholder="O seu nome"
                    autoComplete="given-name"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="asle-auth-field">
                  <label htmlFor="lastName">Apelido</label>

                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={lastName}
                    onChange={(event) =>
                      setLastName(event.target.value)
                    }
                    placeholder="O seu apelido"
                    autoComplete="family-name"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="asle-register-grid">
                <div className="asle-auth-field">
                  <label htmlFor="email">E-mail</label>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    placeholder="nome@exemplo.com"
                    autoComplete="email"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="asle-auth-field">
                  <label htmlFor="phone">Telefone</label>

                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={phone}
                    onChange={(event) =>
                      setPhone(event.target.value)
                    }
                    placeholder="+244 9XX XXX XXX"
                    autoComplete="tel"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="asle-auth-field">
                <label htmlFor="city">Cidade</label>

                <input
                  id="city"
                  name="city"
                  type="text"
                  value={city}
                  onChange={(event) =>
                    setCity(event.target.value)
                  }
                  placeholder="Ex.: Luanda"
                  autoComplete="address-level2"
                  required
                  disabled={loading}
                />
              </div>

              {!isCandidate && (
                <div className="asle-auth-field">
                  <label htmlFor="companyName">
                    Empresa ou organização{" "}
                    <span>(opcional)</span>
                  </label>

                  <input
                    id="companyName"
                    name="companyName"
                    type="text"
                    value={companyName}
                    onChange={(event) =>
                      setCompanyName(event.target.value)
                    }
                    placeholder="Nome da empresa, se aplicável"
                    autoComplete="organization"
                    disabled={loading}
                  />
                </div>
              )}

              <div className="asle-register-section-title asle-register-password-title">
                <span className="asle-register-section-line" />
                <span>Acesso à conta</span>
                <span className="asle-register-section-line" />
              </div>

              <div className="asle-register-grid">
                <div className="asle-auth-field">
                  <label htmlFor="password">
                    Palavra-passe
                  </label>

                  <div className="asle-auth-password">
                    <input
                      id="password"
                      name="password"
                      type={
                        showPassword ? "text" : "password"
                      }
                      value={password}
                      onChange={(event) =>
                        setPassword(event.target.value)
                      }
                      placeholder="Mínimo 8 caracteres"
                      autoComplete="new-password"
                      minLength={8}
                      required
                      disabled={loading}
                    />

                    <button
                      type="button"
                      className="asle-auth-password-toggle"
                      onClick={() =>
                        setShowPassword(
                          (current) => !current
                        )
                      }
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

                <div className="asle-auth-field">
                  <label htmlFor="confirmPassword">
                    Confirmar palavra-passe
                  </label>

                  <div className="asle-auth-password">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={
                        showConfirmPassword
                          ? "text"
                          : "password"
                      }
                      value={confirmPassword}
                      onChange={(event) =>
                        setConfirmPassword(
                          event.target.value
                        )
                      }
                      placeholder="Repita a palavra-passe"
                      autoComplete="new-password"
                      minLength={8}
                      required
                      disabled={loading}
                    />

                    <button
                      type="button"
                      className="asle-auth-password-toggle"
                      onClick={() =>
                        setShowConfirmPassword(
                          (current) => !current
                        )
                      }
                      aria-label={
                        showConfirmPassword
                          ? "Ocultar palavra-passe"
                          : "Mostrar palavra-passe"
                      }
                      disabled={loading}
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={19} />
                      ) : (
                        <Eye size={19} />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <p className="asle-register-terms">
                Ao criar a conta, confirma que os dados
                fornecidos são verdadeiros e aceita que a ASLE
                os utilize para gerir o seu processo de
                atendimento ou candidatura.
              </p>

              <button
                type="submit"
                className="asle-auth-submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2
                      className="asle-auth-spinner"
                      size={19}
                    />
                    A criar conta...
                  </>
                ) : (
                  <>
                    Criar a minha conta
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="asle-auth-register">
              <span>Já tem uma conta?</span>

              <Link href="/entrar">
                Entrar na minha conta
              </Link>
            </div>

            <p className="asle-auth-security">
              Os seus dados são tratados de forma
              confidencial e utilizados apenas no âmbito dos
              serviços da ASLE.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}