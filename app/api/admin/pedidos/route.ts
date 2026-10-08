import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

const statusSchema = z.enum([
  "SUBMITTED",
  "IN_REVIEW",
  "MATCHING",
  "PROPOSED",
  "ACCEPTED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
]);

export async function GET() {
  try {
    await requireRole("ADMIN", "RECRUITER");
    const requests = await prisma.serviceRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        User: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
      },
    });
    return NextResponse.json({ requests });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Inicie sessão." }, { status: 401 });
    if (error instanceof Error && error.message === "FORBIDDEN") return NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 });
    console.error("GET /api/admin/pedidos:", error);
    return NextResponse.json({ error: "Não foi possível carregar os pedidos." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const actor = await requireRole("ADMIN", "RECRUITER");
    const bodySchema = z.object({ id: z.string().uuid(), status: statusSchema, notes: z.string().trim().max(2000).optional() });
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Estado ou pedido inválido." }, { status: 400 });
    const current = await prisma.serviceRequest.findUnique({
      where: { id: parsed.data.id },
      select: { id: true, status: true, createdById: true },
    });
    if (!current) return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });

    await prisma.$transaction([
      prisma.serviceRequest.update({
        where: { id: current.id },
        data: { status: parsed.data.status, ...(parsed.data.notes !== undefined ? { notes: parsed.data.notes } : {}) },
      }),
      prisma.notification.create({
        data: {
          userId: current.createdById,
          type: "SYSTEM",
          title: "Atualização do pedido",
          message: `O estado do seu pedido foi atualizado para ${parsed.data.status.replaceAll("_", " ").toLowerCase()}.`,
          actionUrl: "/cliente/dashboard",
        },
      }),
      prisma.auditLog.create({
        data: {
          userId: actor.id,
          action: "SERVICE_REQUEST_STATUS_CHANGED",
          entity: "ServiceRequest",
          entityId: current.id,
          metadata: { previousStatus: current.status, status: parsed.data.status },
        },
      }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Inicie sessão." }, { status: 401 });
    if (error instanceof Error && error.message === "FORBIDDEN") return NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 });
    console.error("PATCH /api/admin/pedidos:", error);
    return NextResponse.json({ error: "Não foi possível atualizar o pedido." }, { status: 500 });
  }
}
