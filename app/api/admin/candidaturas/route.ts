import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    await requireRole("ADMIN", "RECRUITER");
    const applications = await prisma.application.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        candidate: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } } } },
        job: { select: { id: true, title: true, status: true, location: true } },
      },
    });
    return NextResponse.json({ applications });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Inicie sessão." }, { status: 401 });
    if (error instanceof Error && error.message === "FORBIDDEN") return NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 });
    console.error("GET /api/admin/candidaturas:", error);
    return NextResponse.json({ error: "Não foi possível carregar as candidaturas." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const actor = await requireRole("ADMIN", "RECRUITER");
    const parsed = z.object({
      id: z.string().uuid(),
      status: z.enum(["SUBMITTED", "UNDER_REVIEW", "SHORTLISTED", "INTERVIEW", "APPROVED", "REJECTED", "WITHDRAWN"]),
    }).safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Estado ou candidatura inválido." }, { status: 400 });
    const current = await prisma.application.findUnique({
      where: { id: parsed.data.id },
      select: { id: true, status: true, candidate: { select: { userId: true } } },
    });
    if (!current) return NextResponse.json({ error: "Candidatura não encontrada." }, { status: 404 });

    await prisma.$transaction([
      prisma.application.update({ where: { id: current.id }, data: { status: parsed.data.status } }),
      prisma.notification.create({
        data: {
          userId: current.candidate.userId,
          type: "APPLICATION",
          title: "Atualização da candidatura",
          message: `O estado da sua candidatura foi atualizado para ${parsed.data.status.replaceAll("_", " ").toLowerCase()}.`,
          actionUrl: "/profissional/candidaturas",
        },
      }),
      prisma.auditLog.create({
        data: {
          userId: actor.id,
          action: "APPLICATION_STATUS_CHANGED",
          entity: "Application",
          entityId: current.id,
          metadata: { previousStatus: current.status, status: parsed.data.status },
        },
      }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Inicie sessão." }, { status: 401 });
    if (error instanceof Error && error.message === "FORBIDDEN") return NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 });
    console.error("PATCH /api/admin/candidaturas:", error);
    return NextResponse.json({ error: "Não foi possível atualizar a candidatura." }, { status: 500 });
  }
}
