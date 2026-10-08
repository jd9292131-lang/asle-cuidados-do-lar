import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { getPrivateFile } from "@/lib/storage/storage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireRole("ADMIN", "RECRUITER");
    const { id } = await params;
    const document = await prisma.document.findUnique({
      where: { id },
      select: { storageKey: true, originalName: true, mimeType: true, sizeBytes: true },
    });
    if (!document) return NextResponse.json({ error: "Documento não encontrado." }, { status: 404 });

    const blob = await getPrivateFile(document.storageKey);
    if (!blob || blob.statusCode !== 200) {
      return NextResponse.json({ error: "O ficheiro não está disponível no armazenamento." }, { status: 404 });
    }

    await prisma.auditLog.create({
      data: {
        userId: actor.id,
        action: "DOCUMENT_FILE_ACCESSED",
        entity: "Document",
        entityId: id,
      },
    });

    const safeName = document.originalName.replace(/[\r\n"]/g, "_");
    return new Response(blob.stream, {
      headers: {
        "Content-Type": document.mimeType,
        "Content-Length": String(document.sizeBytes),
        "Content-Disposition": `attachment; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(document.originalName)}`,
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Inicie sessão para continuar." }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Não tem permissão para consultar documentos." }, { status: 403 });
    }
    console.error("GET /api/admin/documentos/[id]/ficheiro:", error);
    return NextResponse.json({ error: "Não foi possível obter o ficheiro." }, { status: 500 });
  }
}
