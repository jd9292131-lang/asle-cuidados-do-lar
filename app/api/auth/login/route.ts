import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { createSession } from "@/lib/auth/session";
import { isLoginThrottled, recordFailedLogin } from "@/lib/auth/login-throttle";

const loginSchema = z.object({
  email: z.string().trim().email("E-mail inválido.").toLowerCase(),
  password: z.string().min(1, "Introduza a palavra-passe."),
});

export async function POST(request: Request) {
  try {
    if (await isLoginThrottled(request)) {
      return NextResponse.json(
        {
          ok: false,
          message: "Demasiadas tentativas de acesso. Aguarde 15 minutos e tente novamente.",
        },
        { status: 429 }
      );
    }

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
        suspendedUntil: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!user) {
      await recordFailedLogin(request);
      return NextResponse.json(
        {
          ok: false,
          message: "E-mail ou palavra-passe inválidos.",
        },
        { status: 401 }
      );
    }

    if (
      user.status === "INACTIVE" ||
      (user.status === "SUSPENDED" &&
        (!user.suspendedUntil || user.suspendedUntil > new Date()))
    ) {
      return NextResponse.json(
        {
          ok: false,
          message: "Esta conta não está disponível para acesso.",
        },
        { status: 403 }
      );
    }

    if (user.status === "SUSPENDED" && user.suspendedUntil) {
      await prisma.user.updateMany({
        where: { id: user.id, status: "SUSPENDED", suspendedUntil: { lte: new Date() } },
        data: { status: "ACTIVE", suspendedUntil: null, statusReason: null },
      });
    }

    const passwordValid = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordValid) {
      await recordFailedLogin(request);
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