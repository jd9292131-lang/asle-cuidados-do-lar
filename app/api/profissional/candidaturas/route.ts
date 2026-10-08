import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

const applicationSchema = z.object({
  jobId: z.string().uuid(),
  coverLetter: z.string().trim().max(3000).optional(),
});

export async function POST(request: Request) {
  try {
    const user = await requireRole("CANDIDATE");
    const parsed = applicationSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json({ error: "Oportunidade inválida." }, { status: 400 });
    }

    const candidate = await prisma.candidate.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!candidate) {
      return NextResponse.json({ error: "Perfil profissional não encontrado." }, { status: 404 });
    }

    const job = await prisma.job.findFirst({
      where: { id: parsed.data.jobId, status: "PUBLISHED", closedAt: null },
      select: { id: true },
    });

    if (!job) {
      return NextResponse.json({ error: "Esta oportunidade já não está disponível." }, { status: 404 });
    }

    const application = await prisma.application.create({
      data: {
        jobId: job.id,
        candidateId: candidate.id,
        coverLetter: parsed.data.coverLetter || null,
      },
      select: { id: true, status: true, createdAt: true },
    });

    return NextResponse.json({ application }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Inicie sessão para se candidatar." }, { status: 401 });
    }

    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Apenas profissionais podem candidatar-se." }, { status: 403 });
    }

    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "Já se candidatou a esta oportunidade." }, { status: 409 });
    }

    console.error("POST /api/profissional/candidaturas:", error);
    return NextResponse.json({ error: "Não foi possível enviar a candidatura." }, { status: 500 });
  }
}
