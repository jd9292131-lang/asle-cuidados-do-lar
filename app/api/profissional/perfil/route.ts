import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function PUT(request: Request) {
  try {
    const user = await requireRole("CANDIDATE");

    const body = await request.json();

    const birthDate =
      body.birthDate && body.birthDate.trim()
        ? new Date(body.birthDate)
        : null;

    if (birthDate && Number.isNaN(birthDate.getTime())) {
      return NextResponse.json(
        { error: "Data de nascimento inválida." },
        { status: 400 }
      );
    }

    const yearsExperience =
      body.yearsExperience === "" ||
      body.yearsExperience === null ||
      body.yearsExperience === undefined
        ? null
        : Number(body.yearsExperience);

    if (
      yearsExperience !== null &&
      (!Number.isInteger(yearsExperience) || yearsExperience < 0)
    ) {
      return NextResponse.json(
        { error: "Anos de experiência inválidos." },
        { status: 400 }
      );
    }

    const candidate = await prisma.candidate.update({
      where: {
        userId: user.id,
      },
      data: {
        birthDate,
        gender: body.gender?.trim() || null,
        nationality: body.nationality?.trim() || null,
        address: body.address?.trim() || null,
        city: body.city?.trim() || null,
        professionalTitle: body.professionalTitle?.trim() || null,
        bio: body.bio?.trim() || null,
        yearsExperience,
        availability: body.availability?.trim() || null,
        availableFrom:
          body.availableFrom && body.availableFrom.trim()
            ? new Date(body.availableFrom)
            : null,
      },
    });

    return NextResponse.json({
      success: true,
      candidate,
    });
  } catch (error) {
    console.error("Erro ao atualizar perfil profissional:", error);

    if (
      error instanceof Error &&
      (error.message === "UNAUTHORIZED" ||
        error.message === "FORBIDDEN")
    ) {
      return NextResponse.json(
        { error: "Não autorizado." },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Não foi possível atualizar o perfil." },
      { status: 500 }
    );
  }
}