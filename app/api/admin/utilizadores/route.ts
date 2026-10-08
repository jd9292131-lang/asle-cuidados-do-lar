import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/session";

const filterSchema = z.object({
  q: z.string().trim().max(120).optional(),
  role: z.enum(["ADMIN", "RECRUITER", "CANDIDATE", "CLIENT"]).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED", "PENDING"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
});

function unauthorized(error: unknown) {
  if (error instanceof Error && error.message === "UNAUTHORIZED") {
    return NextResponse.json({ error: "Inicie sessão para continuar." }, { status: 401 });
  }
  if (error instanceof Error && error.message === "FORBIDDEN") {
    return NextResponse.json({ error: "Não tem permissão para gerir utilizadores." }, { status: 403 });
  }
  return null;
}

export async function GET(request: Request) {
  try {
    await requireRole("ADMIN", "RECRUITER");
    const params = new URL(request.url).searchParams;
    const parsed = filterSchema.safeParse({
      q: params.get("q") ?? undefined,
      role: params.get("role") ?? undefined,
      status: params.get("status") ?? undefined,
      page: params.get("page") ?? 1,
    });
    if (!parsed.success) {
      return NextResponse.json({ error: "Filtros inválidos." }, { status: 400 });
    }

    const { q, role, status, page } = parsed.data;
    const where = {
      ...(role ? { role } : {}),
      ...(status ? { status } : {}),
      ...(q
        ? {
            OR: [
              { email: { contains: q, mode: "insensitive" as const } },
              { firstName: { contains: q, mode: "insensitive" as const } },
              { lastName: { contains: q, mode: "insensitive" as const } },
              { phone: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * 30,
        take: 30,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          status: true,
          statusReason: true,
          suspendedUntil: true,
          createdAt: true,
          lastLoginAt: true,
          candidate: { select: { professionalTitle: true, city: true } },
          client: { select: { companyName: true, city: true } },
          _count: { select: { documents: true, notifications: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({ users, total, page, pageSize: 30 });
  } catch (error) {
    const response = unauthorized(error);
    if (response) return response;
    console.error("GET /api/admin/utilizadores:", error);
    return NextResponse.json({ error: "Não foi possível carregar os utilizadores." }, { status: 500 });
  }
}
