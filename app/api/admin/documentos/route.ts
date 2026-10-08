import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: Request) {
  try {
    await requireRole("ADMIN", "RECRUITER");
    const params = new URL(request.url).searchParams;
    const status = ["PENDING", "APPROVED", "REJECTED", "EXPIRED"].includes(params.get("status") ?? "")
      ? params.get("status") as "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED"
      : undefined;

    const documents = await prisma.document.findMany({
      where: status ? { status } : undefined,
      orderBy: [{ status: "asc" }, { uploadedAt: "asc" }],
      take: 100,
      select: {
        id: true,
        type: true,
        status: true,
        originalName: true,
        mimeType: true,
        sizeBytes: true,
        rejectionReason: true,
        uploadedAt: true,
        reviewedAt: true,
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    return NextResponse.json({ documents });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Inicie sessão para continuar." }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Não tem permissão para consultar documentos." }, { status: 403 });
    }
    console.error("GET /api/admin/documentos:", error);
    return NextResponse.json({ error: "Não foi possível carregar os documentos." }, { status: 500 });
  }
}
