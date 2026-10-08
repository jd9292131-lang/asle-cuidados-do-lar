import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

const reviewSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("APPROVED") }),
  z.object({ status: z.literal("REJECTED"), reason: z.string().trim().min(5).max(500) }),
]);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const reviewer = await requireRole("ADMIN", "RECRUITER");
    const { id } = await params;
    const parsed = reviewSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Decisão ou motivo de rejeição inválido." }, { status: 400 });
    }

    const document = await prisma.document.findUnique({
      where: { id },
      select: { id: true, userId: true, status: true, originalName: true },
    });
    if (!document) return NextResponse.json({ error: "Documento não encontrado." }, { status: 404 });

    const rejectionReason = parsed.data.status === "REJECTED" ? parsed.data.reason : null;
    await prisma.$transaction([
      prisma.document.update({
        where: { id },
        data: {
          status: parsed.data.status,
          rejectionReason,
          reviewedAt: new Date(),
          reviewedById: reviewer.id,
        },
      }),
      prisma.notification.create({
        data: {
          userId: document.userId,
          type: "DOCUMENT",
          title: parsed.data.status === "APPROVED" ? "Documento aprovado" : "Documento rejeitado",
          message: parsed.data.status === "APPROVED"
            ? `O documento ${document.originalName} foi aprovado pela equipa ASLE.`
            : `O documento ${document.originalName} foi rejeitado. Motivo: ${rejectionReason}`,
          actionUrl: "/profissional/documentos",
        },
      }),
      prisma.auditLog.create({
        data: {
          userId: reviewer.id,
          action: `DOCUMENT_${parsed.data.status}`,
          entity: "Document",
          entityId: id,
          metadata: {
            previousStatus: document.status,
            status: parsed.data.status,
            ...(rejectionReason ? { reason: rejectionReason } : {}),
          },
        },
      }),
    ]);

    return NextResponse.json({ ok: true, status: parsed.data.status });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Inicie sessão para continuar." }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Não tem permissão para rever documentos." }, { status: 403 });
    }
    console.error("PATCH /api/admin/documentos/[id]:", error);
    return NextResponse.json({ error: "Não foi possível rever o documento." }, { status: 500 });
  }
}
