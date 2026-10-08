"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type ProfileFormProps = {
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  };
  candidate: {
    birthDate: string;
    gender: string;
    nationality: string;
    address: string;
    city: string;
    professionalTitle: string;
    bio: string;
    yearsExperience: string;
    availability: string;
    availableFrom: string;
  };
};

export default function ProfileForm({
  user,
  candidate,
}: ProfileFormProps) {
  const router = useRouter();

  const [form, setForm] = useState(candidate);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function updateField(
    field: keyof typeof form,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        "/api/profissional/perfil",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Não foi possível guardar o perfil."
        );
      }

      setMessage("Perfil atualizado com sucesso.");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocorreu um erro ao guardar o perfil."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      className="professional-profile-form"
      onSubmit={handleSubmit}
    >
      <section className="professional-form-card">
        <div className="professional-form-heading">
          <div>
            <span className="card-label">
              DADOS DA CONTA
            </span>

            <h2>Informações pessoais</h2>

            <p>
              Estes dados estão associados à sua conta ASLE.
            </p>
          </div>
        </div>

        <div className="professional-form-grid">
          <div className="professional-field">
            <label>Nome</label>

            <input
              value={user.firstName}
              disabled
            />
          </div>

          <div className="professional-field">
            <label>Apelido</label>

            <input
              value={user.lastName}
              disabled
            />
          </div>

          <div className="professional-field">
            <label>E-mail</label>

            <input
              value={user.email}
              disabled
              type="email"
            />
          </div>

          <div className="professional-field">
            <label>Telefone</label>

            <input
              value={user.phone ?? ""}
              disabled
            />
          </div>

          <div className="professional-field">
            <label>Data de nascimento</label>

            <input
              type="date"
              value={form.birthDate}
              onChange={(event) =>
                updateField(
                  "birthDate",
                  event.target.value
                )
              }
            />
          </div>

          <div className="professional-field">
            <label>Género</label>

            <select
              value={form.gender}
              onChange={(event) =>
                updateField(
                  "gender",
                  event.target.value
                )
              }
            >
              <option value="">Selecionar</option>
              <option value="FEMININO">Feminino</option>
              <option value="MASCULINO">Masculino</option>
              <option value="OUTRO">Outro</option>
            </select>
          </div>

          <div className="professional-field">
            <label>Nacionalidade</label>

            <input
              value={form.nationality}
              onChange={(event) =>
                updateField(
                  "nationality",
                  event.target.value
                )
              }
              placeholder="Ex.: Angolana"
            />
          </div>

          <div className="professional-field">
            <label>Cidade</label>

            <input
              value={form.city}
              onChange={(event) =>
                updateField(
                  "city",
                  event.target.value
                )
              }
              placeholder="Ex.: Luanda"
            />
          </div>

          <div className="professional-field professional-field-full">
            <label>Morada</label>

            <input
              value={form.address}
              onChange={(event) =>
                updateField(
                  "address",
                  event.target.value
                )
              }
              placeholder="Morada atual"
            />
          </div>
        </div>
      </section>

      <section className="professional-form-card">
        <div className="professional-form-heading">
          <div>
            <span className="card-label">
              PERFIL PROFISSIONAL
            </span>

            <h2>Experiência e disponibilidade</h2>

            <p>
              Estas informações ajudam a equipa ASLE a
              identificar oportunidades adequadas.
            </p>
          </div>
        </div>

        <div className="professional-form-grid">
          <div className="professional-field professional-field-full">
            <label>Função profissional</label>

            <input
              value={form.professionalTitle}
              onChange={(event) =>
                updateField(
                  "professionalTitle",
                  event.target.value
                )
              }
              placeholder="Ex.: Babá, empregada doméstica, cuidadora..."
            />
          </div>

          <div className="professional-field">
            <label>Anos de experiência</label>

            <input
              type="number"
              min="0"
              max="60"
              value={form.yearsExperience}
              onChange={(event) =>
                updateField(
                  "yearsExperience",
                  event.target.value
                )
              }
              placeholder="Ex.: 5"
            />
          </div>

          <div className="professional-field">
            <label>Disponibilidade</label>

            <select
              value={form.availability}
              onChange={(event) =>
                updateField(
                  "availability",
                  event.target.value
                )
              }
            >
              <option value="">Selecionar</option>
              <option value="IMEDIATA">Imediata</option>
              <option value="MANHA">Manhã</option>
              <option value="TARDE">Tarde</option>
              <option value="NOITE">Noite</option>
              <option value="TEMPO_INTEIRO">
                Tempo inteiro
              </option>
              <option value="PART_TIME">
                Part-time
              </option>
            </select>
          </div>

          <div className="professional-field">
            <label>Disponível a partir de</label>

            <input
              type="date"
              value={form.availableFrom}
              onChange={(event) =>
                updateField(
                  "availableFrom",
                  event.target.value
                )
              }
            />
          </div>

          <div className="professional-field professional-field-full">
            <label>Apresentação profissional</label>

            <textarea
              value={form.bio}
              onChange={(event) =>
                updateField(
                  "bio",
                  event.target.value
                )
              }
              placeholder="Fale brevemente sobre a sua experiência profissional, competências e tipo de trabalho que procura."
              rows={6}
            />
          </div>
        </div>
      </section>

      <div className="professional-form-actions">
        {message && (
          <span className="professional-form-success">
            {message}
          </span>
        )}

        {error && (
          <span className="professional-form-error">
            {error}
          </span>
        )}

        <button
          type="submit"
          className="primary-button"
          disabled={saving}
        >
          {saving
            ? "A guardar..."
            : "Guardar alterações"}
        </button>
      </div>
    </form>
  );
}