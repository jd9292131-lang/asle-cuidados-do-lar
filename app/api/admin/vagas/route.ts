import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

const serviceType = z.enum(["BABYSITTER", "DOMESTIC_WORKER", "COOK", "CLEANER", "CAREGIVER", "OTHER"]);
const createSchema = z.object({
  clientId: z.string().uuid(),
  title: z.string().trim().min(4).max(150),
  description: z.string().trim().min(10).max(5000),
  location: z.string().trim().max(200).optional(),
  serviceType,
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
});

export async function GET() {
  try {
    await requireRole("ADMIN", "RECRUITER");
    const jobs = await prisma.job.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        client: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
        _count: { select: { applications: true } },
      },
    });
    return NextResponse.json({ jobs });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Inicie sessão." }, { status: 401 });
    if (error instanceof Error && error.message === "FORBIDDEN") return NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 });
    console.error("GET /api/admin/vagas:", error);
    return NextResponse.json({ error: "Não foi possível carregar as vagas." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireRole("ADMIN", "RECRUITER");
    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Verifique os dados da vaga." }, { status: 400 });
    const client = await prisma.client.findUnique({ where: { id: parsed.data.clientId }, select: { id: true } });
    if (!client) return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });

    const now = new Date();
    const job = await prisma.job.create({
      data: {
        id: randomUUID(),
        ...parsed.data,
        location: parsed.data.location || null,
        publishedAt: parsed.data.status === "PUBLISHED" ? now : null,
      },
      select: { id: true, status: true },
    });
    await prisma.auditLog.create({
      data: {
        userId: actor.id,
        action: job.status === "PUBLISHED" ? "JOB_PUBLISHED" : "JOB_CREATED",
        entity: "Job",
        entityId: job.id,
      },
    });
    return NextResponse.json({ job }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Inicie sessão." }, { status: 401 });
    if (error instanceof Error && error.message === "FORBIDDEN") return NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 });
    console.error("POST /api/admin/vagas:", error);
    return NextResponse.json({ error: "Não foi possível criar a vaga." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const actor = await requireRole("ADMIN", "RECRUITER");
    const parsed = z.object({
      id: z.string().uuid(),
      status: z.enum(["DRAFT", "PUBLISHED", "PAUSED", "CLOSED", "ARCHIVED"]),
    }).safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Vaga ou estado inválido." }, { status: 400 });
    const current = await prisma.job.findUnique({ where: { id: parsed.data.id }, select: { id: true, status: true } });
    if (!current) return NextResponse.json({ error: "Vaga não encontrada." }, { status: 404 });

    await prisma.$transaction([
      prisma.job.update({
        where: { id: current.id },
        data: {
          status: parsed.data.status,
          publishedAt: parsed.data.status === "PUBLISHED" ? new Date() : undefined,
          closedAt: parsed.data.status === "CLOSED" || parsed.data.status === "ARCHIVED" ? new Date() : parsed.data.status === "PUBLISHED" ? null : undefined,
        },
      }),
      prisma.auditLog.create({
        data: {
          userId: actor.id,
          action: "JOB_STATUS_CHANGED",
          entity: "Job",
          entityId: current.id,
          metadata: { previousStatus: current.status, status: parsed.data.status },
        },
      }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Inicie sessão." }, { status: 401 });
    if (error instanceof Error && error.message === "FORBIDDEN") return NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 });
    console.error("PATCH /api/admin/vagas:", error);
    return NextResponse.json({ error: "Não foi possível atualizar a vaga." }, { status: 500 });
  }
}
