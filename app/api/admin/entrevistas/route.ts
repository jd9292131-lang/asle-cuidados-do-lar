import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    await requireRole("ADMIN", "RECRUITER");
    const interviews = await prisma.interview.findMany({
      orderBy: { scheduledAt: "asc" },
      take: 200,
      include: {
        Candidate: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } } },
        Application: { include: { job: { select: { title: true } } } },
      },
    });
    return NextResponse.json({ interviews });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Inicie sessão." }, { status: 401 });
    if (error instanceof Error && error.message === "FORBIDDEN") return NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 });
    console.error("GET /api/admin/entrevistas:", error);
    return NextResponse.json({ error: "Não foi possível carregar as entrevistas." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireRole("ADMIN", "RECRUITER");
    const parsed = z.object({
      candidateId: z.string().uuid(),
      applicationId: z.string().uuid().optional().or(z.literal("")),
      scheduledAt: z.iso.datetime(),
      location: z.string().trim().max(300).optional(),
      notes: z.string().trim().max(2000).optional(),
    }).safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Verifique os dados da entrevista." }, { status: 400 });
    if (new Date(parsed.data.scheduledAt) <= new Date()) {
      return NextResponse.json({ error: "A entrevista deve ser marcada para uma data futura." }, { status: 400 });
    }

    const candidate = await prisma.candidate.findUnique({
      where: { id: parsed.data.candidateId },
      select: { id: true, userId: true },
    });
    if (!candidate) return NextResponse.json({ error: "Profissional não encontrada." }, { status: 404 });
    const applicationId = parsed.data.applicationId || null;
    if (applicationId) {
      const application = await prisma.application.findFirst({
        where: { id: applicationId, candidateId: candidate.id },
        select: { id: true },
      });
      if (!application) return NextResponse.json({ error: "A candidatura não pertence a esta profissional." }, { status: 400 });
    }

    const id = randomUUID();
    const scheduledAt = new Date(parsed.data.scheduledAt);
    await prisma.$transaction([
      prisma.interview.create({
        data: {
          id,
          applicationId,
          candidateId: candidate.id,
          recruiterId: actor.id,
          scheduledAt,
          location: parsed.data.location || null,
          notes: parsed.data.notes || null,
          updatedAt: new Date(),
        },
      }),
      ...(applicationId
        ? [prisma.application.update({ where: { id: applicationId }, data: { status: "INTERVIEW" } })]
        : []),
      prisma.notification.create({
        data: {
          userId: candidate.userId,
          type: "SYSTEM",
          title: "Entrevista agendada",
          message: `A equipa ASLE marcou uma entrevista para ${scheduledAt.toLocaleString("pt-PT")}${parsed.data.location ? ` em ${parsed.data.location}` : ""}.`,
          actionUrl: "/profissional/entrevistas",
        },
      }),
      prisma.auditLog.create({
        data: {
          userId: actor.id,
          action: "INTERVIEW_SCHEDULED",
          entity: "Interview",
          entityId: id,
          metadata: { candidateId: candidate.id, applicationId, scheduledAt: scheduledAt.toISOString() },
        },
      }),
    ]);
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Inicie sessão." }, { status: 401 });
    if (error instanceof Error && error.message === "FORBIDDEN") return NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 });
    console.error("POST /api/admin/entrevistas:", error);
    return NextResponse.json({ error: "Não foi possível agendar a entrevista." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const actor = await requireRole("ADMIN", "RECRUITER");
    const parsed = z.object({
      id: z.string().uuid(),
      status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED", "NO_SHOW"]).optional(),
      scheduledAt: z.iso.datetime().optional(),
      location: z.string().trim().max(300).optional(),
      notes: z.string().trim().max(2000).optional(),
    }).refine((value) => value.status || value.scheduledAt || value.location !== undefined || value.notes !== undefined).safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Atualização de entrevista inválida." }, { status: 400 });

    const current = await prisma.interview.findUnique({
      where: { id: parsed.data.id },
      select: { id: true, status: true, candidateId: true, Candidate: { select: { userId: true } } },
    });
    if (!current) return NextResponse.json({ error: "Entrevista não encontrada." }, { status: 404 });
    if (parsed.data.scheduledAt && new Date(parsed.data.scheduledAt) <= new Date()) {
      return NextResponse.json({ error: "A nova data deve estar no futuro." }, { status: 400 });
    }

    const nextStatus = parsed.data.status ?? current.status;
    await prisma.$transaction([
      prisma.interview.update({
        where: { id: current.id },
        data: {
          ...(parsed.data.status ? { status: parsed.data.status } : {}),
          ...(parsed.data.scheduledAt ? { scheduledAt: new Date(parsed.data.scheduledAt) } : {}),
          ...(parsed.data.location !== undefined ? { location: parsed.data.location || null } : {}),
          ...(parsed.data.notes !== undefined ? { notes: parsed.data.notes || null } : {}),
          updatedAt: new Date(),
        },
      }),
      prisma.notification.create({
        data: {
          userId: current.Candidate.userId,
          type: "SYSTEM",
          title: nextStatus === "CANCELLED" ? "Entrevista cancelada" : "Entrevista atualizada",
          message: parsed.data.scheduledAt
            ? `A sua entrevista foi reagendada para ${new Date(parsed.data.scheduledAt).toLocaleString("pt-PT")}.`
            : `O estado da sua entrevista foi atualizado para ${nextStatus.toLowerCase()}.`,
          actionUrl: "/profissional/entrevistas",
        },
      }),
      prisma.auditLog.create({
        data: {
          userId: actor.id,
          action: "INTERVIEW_UPDATED",
          entity: "Interview",
          entityId: current.id,
          metadata: {
            previousStatus: current.status,
            status: nextStatus,
            ...(parsed.data.scheduledAt ? { scheduledAt: parsed.data.scheduledAt } : {}),
          },
        },
      }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Inicie sessão." }, { status: 401 });
    if (error instanceof Error && error.message === "FORBIDDEN") return NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 });
    console.error("PATCH /api/admin/entrevistas:", error);
    return NextResponse.json({ error: "Não foi possível atualizar a entrevista." }, { status: 500 });
  }
}
