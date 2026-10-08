import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

const staffAccountSchema = z
  .object({
    firstName: z.string().trim().min(2).max(80),
    lastName: z.string().trim().min(2).max(80),
    email: z.string().trim().email().max(254).toLowerCase(),
    phone: z.string().trim().max(30).optional(),
    role: z.enum(["ADMIN", "RECRUITER"]),
    password: z.string().min(14).refine(
      (password) => Buffer.byteLength(password, "utf8") <= 72,
      "A palavra-passe não pode exceder 72 bytes.",
    ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "As palavras-passe não coincidem.",
  });

export async function POST(request: Request) {
  try {
    const actor = await requireRole("ADMIN");
    const parsed = staffAccountSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Verifique os dados introduzidos." },
        { status: 400 },
      );
    }

    const { firstName, lastName, email, phone, role, password } = parsed.data;
    const passwordHash = await bcrypt.hash(password, 12);

    const createdUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          firstName,
          lastName,
          email,
          phone: phone || null,
          role,
          passwordHash,
          status: "ACTIVE",
        },
        select: {
          id: true,
          role: true,
          email: true,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: actor.id,
          action: "STAFF_ACCOUNT_CREATED",
          entity: "User",
          entityId: user.id,
          metadata: { role: user.role, email: user.email },
        },
      });

      return user;
    });

    return NextResponse.json({ ok: true, user: createdUser }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Inicie sessão para continuar." }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Apenas administradores podem gerir contas da equipa." }, { status: 403 });
    }
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "Já existe uma conta com este e-mail." }, { status: 409 });
    }

    console.error("POST /api/admin/equipa:", error);
    return NextResponse.json({ error: "Não foi possível criar a conta da equipa." }, { status: 500 });
  }
}
