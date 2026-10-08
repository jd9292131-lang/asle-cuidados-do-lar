import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { createSession } from "@/lib/auth/session";

const loginSchema = z.object({
  email: z.string().trim().email("E-mail inválido.").toLowerCase(),
  password: z.string().min(1, "Introduza a palavra-passe."),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          ok: false,
          message: "E-mail ou palavra-passe inválidos.",
        },
        { status: 400 }
      );
    }

    const { email, password } = result.data;

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        role: true,
        status: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          ok: false,
          message: "E-mail ou palavra-passe inválidos.",
        },
        { status: 401 }
      );
    }

    if (user.status === "INACTIVE" || user.status === "SUSPENDED") {
      return NextResponse.json(
        {
          ok: false,
          message: "Esta conta não está disponível para acesso.",
        },
        { status: 403 }
      );
    }

    const passwordValid = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordValid) {
      return NextResponse.json(
        {
          ok: false,
          message: "E-mail ou palavra-passe inválidos.",
        },
        { status: 401 }
      );
    }

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        lastLoginAt: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "LOGIN",
        entity: "User",
        entityId: user.id,
      },
    });

    await createSession({
      id: user.id,
      role: user.role,
    });

    let redirectTo = "/";

    if (user.role === "CANDIDATE") {
      redirectTo = "/profissional/dashboard";
    } else if (user.role === "CLIENT") {
      redirectTo = "/cliente/dashboard";
    } else if (user.role === "RECRUITER") {
      redirectTo = "/admin/dashboard";
    } else if (user.role === "ADMIN") {
      redirectTo = "/admin/dashboard";
    }

    return NextResponse.json({
      ok: true,
      message: "Login efetuado com sucesso.",
      redirectTo,
    });
  } catch (error) {
    console.error("LOGIN_ERROR", error);

    return NextResponse.json(
      {
        ok: false,
        message: "Não foi possível efetuar o login.",
      },
      { status: 500 }
    );
  }
}