import { del } from "@vercel/blob";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/session";

const statusSchema = z.object({
  action: z.enum(["activate", "block", "suspend"]),
  reason: z.string().trim().min(5).max(500),
  suspendedUntil: z.iso.datetime().optional(),
});

const deleteSchema = z.object({
  confirm: z.literal("ELIMINAR"),
});

function authResponse(error: unknown) {
  if (error instanceof Error && error.message === "UNAUTHORIZED") {
    return NextResponse.json({ error: "Inicie sessão para continuar." }, { status: 401 });
  }
  if (error instanceof Error && error.message === "FORBIDDEN") {
    return NextResponse.json({ error: "Apenas administradores podem alterar utilizadores." }, { status: 403 });
  }
  return null;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireRole("ADMIN");
    const { id } = await params;
    const parsed = statusSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Ação ou motivo inválido." }, { status: 400 });
    }

    const target = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, status: true },
    });
    if (!target) return NextResponse.json({ error: "Utilizador não encontrado." }, { status: 404 });
    if (target.role === "ADMIN") {
      return NextResponse.json({ error: "A alteração de contas ADMIN exige um procedimento de recuperação separado." }, { status: 409 });
    }

    const now = new Date();
    const suspendedUntil = parsed.data.suspendedUntil
      ? new Date(parsed.data.suspendedUntil)
      : null;

    if (parsed.data.action === "suspend" && suspendedUntil && suspendedUntil <= now) {
      return NextResponse.json({ error: "A data de fim da suspensão deve estar no futuro." }, { status: 400 });
    }

    const status =
      parsed.data.action === "activate"
        ? "ACTIVE"
        : parsed.data.action === "block"
          ? "INACTIVE"
          : "SUSPENDED";

    await prisma.$transaction([
      prisma.user.update({
        where: { id },
        data: {
          status,
          statusReason: parsed.data.action === "activate" ? null : parsed.data.reason,
          suspendedUntil: parsed.data.action === "suspend" ? suspendedUntil : null,
        },
      }),
      prisma.auditLog.create({
        data: {
          userId: actor.id,
          action: `USER_${parsed.data.action.toUpperCase()}D`,
          entity: "User",
          entityId: id,
          metadata: {
            previousStatus: target.status,
            status,
            reason: parsed.data.reason,
            suspendedUntil: suspendedUntil?.toISOString() ?? null,
          },
        },
      }),
    ]);

    return NextResponse.json({ ok: true, status });
  } catch (error) {
    const response = authResponse(error);
    if (response) return response;
    console.error("PATCH /api/admin/utilizadores/[id]:", error);
    return NextResponse.json({ error: "Não foi possível atualizar o utilizador." }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireRole("ADMIN");
    const { id } = await params;
    const parsed = deleteSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Confirmação de eliminação inválida." }, { status: 400 });
    }
    if (actor.id === id) {
      return NextResponse.json({ error: "Não pode eliminar a sua própria conta." }, { status: 409 });
    }

    const target = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true },
    });
    if (!target) return NextResponse.json({ error: "Utilizador não encontrado." }, { status: 404 });
    if (target.role === "ADMIN" || target.role === "RECRUITER") {
      return NextResponse.json({ error: "Contas administrativas não podem ser eliminadas por esta ação." }, { status: 409 });
    }

    const documents = await prisma.document.findMany({
      where: { userId: id },
      select: { storageKey: true },
    });
    const storageKeys = documents.map((document) => document.storageKey);

    await prisma.$transaction(async (tx) => {
      if (storageKeys.length > 0) {
        await tx.blobCleanup.createMany({
          data: storageKeys.map((storageKey) => ({
            id: randomUUID(),
            storageKey,
            requestedBy: actor.id,
          })),
          skipDuplicates: true,
        });
      }

      await tx.auditLog.create({
        data: {
          userId: actor.id,
          action: "USER_PERMANENTLY_DELETED",
          entity: "User",
          entityId: id,
          metadata: { role: target.role, documentCount: storageKeys.length },
        },
      });

      await tx.user.delete({ where: { id } });
    });

    for (const storageKey of storageKeys) {
      try {
        await del(storageKey, { token: process.env.BLOB_READ_WRITE_TOKEN });
        await prisma.blobCleanup.deleteMany({ where: { storageKey } });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message.slice(0, 500) : "Falha desconhecida no armazenamento.";
        await prisma.blobCleanup.updateMany({
          where: { storageKey },
          data: { attempts: { increment: 1 }, lastError: errorMessage },
        });
        console.error("Falha na limpeza do documento após eliminar utilizador:", error);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const response = authResponse(error);
    if (response) return response;
    console.error("DELETE /api/admin/utilizadores/[id]:", error);
    return NextResponse.json({ error: "Não foi possível eliminar o utilizador." }, { status: 500 });
  }
}
