import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import ProfileForm from "./ProfileForm";

export default async function ProfissionalPerfilPage() {
  const user = await requireRole("CANDIDATE");

  const candidate = await prisma.candidate.findUnique({
    where: {
      userId: user.id,
    },
  });

  if (!candidate) {
    return null;
  }

  return (
    <main className="professional-page">
      <header className="professional-page-header">
        <div>
          <span className="professional-eyebrow">
            ÁREA PROFISSIONAL
          </span>

          <h1>Meu perfil</h1>

          <p>
            Mantenha os seus dados profissionais atualizados.
          </p>
        </div>
      </header>

      <ProfileForm
        user={{
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
        }}
        candidate={{
          birthDate: candidate.birthDate
            ? candidate.birthDate.toISOString().slice(0, 10)
            : "",
          gender: candidate.gender ?? "",
          nationality: candidate.nationality ?? "",
          address: candidate.address ?? "",
          city: candidate.city ?? "",
          professionalTitle: candidate.professionalTitle ?? "",
          bio: candidate.bio ?? "",
          yearsExperience:
            candidate.yearsExperience !== null
              ? String(candidate.yearsExperience)
              : "",
          availability: candidate.availability ?? "",
          availableFrom: candidate.availableFrom
            ? candidate.availableFrom.toISOString().slice(0, 10)
            : "",
        }}
      />
    </main>
  );
}