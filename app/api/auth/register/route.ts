import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { createSession } from "@/lib/auth/session";

const registerSchema = z
  .object({
    firstName: z.string().trim().min(2, "Nome inválido."),
    lastName: z.string().trim().min(2, "Apelido inválido."),
    email: z.string().trim().email("E-mail inválido.").toLowerCase(),
    phone: z.string().trim().min(7, "Telefone inválido."),
    password: z.string().min(8, "A palavra-passe deve ter pelo menos 8 caracteres."),
    role: z.enum(["CANDIDATE", "CLIENT"]),
    companyName: z.string().trim().max(150).optional(),
    city: z.string().trim().max(100).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === "CLIENT" && !data.city) {
      ctx.addIssue({
        code: "custom",
        path: ["city"],
        message: "Indique a cidade.",
      });
    }
  });

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          ok: false,
          message: "Verifique os dados introduzidos.",
          errors: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = result.data;

    const existingUser = await prisma.user.findUnique({
      where: {
        email: data.email,
      },
      select: {
        id: true,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          ok: false,
          message: "Já existe uma conta com este e-mail.",
        },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          role: data.role,
          status: data.role === "CANDIDATE" ? "PENDING" : "ACTIVE",
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
        },
      });

      if (data.role === "CANDIDATE") {
        await tx.candidate.create({
          data: {
            userId: newUser.id,
            city: data.city || null,
          },
        });
      }

      if (data.role === "CLIENT") {
        await tx.client.create({
          data: {
            userId: newUser.id,
            companyName: data.companyName || null,
            city: data.city || null,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: newUser.id,
          action: "ACCOUNT_CREATED",
          entity: "User",
          entityId: newUser.id,
          metadata: {
            role: data.role,
          },
        },
      });

      return newUser;
    });

    await createSession({
      id: user.id,
      role: user.role,
    });

    const redirectTo =
      user.role === "CANDIDATE"
        ? "/profissional/dashboard"
        : "/cliente/dashboard";

    return NextResponse.json({
      ok: true,
      message: "Conta criada com sucesso.",
      redirectTo,
    });
  } catch (error) {
    console.error("REGISTER_ERROR", error);

    return NextResponse.json(
      {
        ok: false,
        message: "Não foi possível criar a conta.",
      },
      { status: 500 }
    );
  }
}