import { del } from "@vercel/blob";
import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function POST() {
  try {
    const actor = await requireRole("ADMIN");
    const pending = await prisma.blobCleanup.findMany({
      orderBy: { createdAt: "asc" },
      take: 25,
      select: { id: true, storageKey: true },
    });
    let deleted = 0;

    for (const item of pending) {
      try {
        await del(item.storageKey, { token: process.env.BLOB_READ_WRITE_TOKEN });
        await prisma.blobCleanup.delete({ where: { id: item.id } });
        deleted += 1;
      } catch (error) {
        const lastError = error instanceof Error ? error.message.slice(0, 500) : "Falha desconhecida no armazenamento.";
        await prisma.blobCleanup.update({
          where: { id: item.id },
          data: { attempts: { increment: 1 }, lastError },
        });
        console.error("Falha ao repetir limpeza de Blob:", error);
      }
    }

    const remaining = await prisma.blobCleanup.count();
    await prisma.auditLog.create({
      data: {
        userId: actor.id,
        action: "BLOB_CLEANUP_RETRIED",
        entity: "BlobCleanup",
        metadata: { attempted: pending.length, deleted, remaining },
      },
    });
    return NextResponse.json({ attempted: pending.length, deleted, remaining });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Inicie sessão." }, { status: 401 });
    if (error instanceof Error && error.message === "FORBIDDEN") return NextResponse.json({ error: "Apenas administradores podem executar esta operação." }, { status: 403 });
    console.error("POST /api/admin/limpeza-armazenamento:", error);
    return NextResponse.json({ error: "Não foi possível repetir a limpeza do armazenamento." }, { status: 500 });
  }
}
