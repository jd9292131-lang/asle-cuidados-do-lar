import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

const requestSchema = z.object({
  serviceType: z.enum([
    "BABYSITTER",
    "DOMESTIC_WORKER",
    "COOK",
    "CLEANER",
    "CAREGIVER",
    "OTHER",
  ]),
  title: z.string().trim().min(4).max(120),
  description: z.string().trim().min(10).max(3000),
  location: z.string().trim().min(2).max(150),
  preferredStartDate: z.iso.date().optional().or(z.literal("")),
});

function authErrorResponse(error: unknown) {
  if (error instanceof Error && error.message === "UNAUTHORIZED") {
    return NextResponse.json({ error: "Inicie sessão para continuar." }, { status: 401 });
  }

  if (error instanceof Error && error.message === "FORBIDDEN") {
    return NextResponse.json({ error: "Apenas clientes podem criar pedidos." }, { status: 403 });
  }

  return null;
}

export async function GET() {
  try {
    const user = await requireRole("CLIENT");
    const client = await prisma.client.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!client) {
      return NextResponse.json({ error: "Perfil de cliente não encontrado." }, { status: 404 });
    }

    const requests = await prisma.serviceRequest.findMany({
      where: { clientId: client.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ requests });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    console.error("GET /api/cliente/pedidos:", error);
    return NextResponse.json({ error: "Não foi possível carregar os pedidos." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole("CLIENT");
    const parsed = requestSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Verifique o serviço, a descrição, a localização e a data indicados." },
        { status: 400 },
      );
    }

    const client = await prisma.client.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!client) {
      return NextResponse.json({ error: "Perfil de cliente não encontrado." }, { status: 404 });
    }

    const serviceRequest = await prisma.serviceRequest.create({
      data: {
        id: randomUUID(),
        clientId: client.id,
        createdById: user.id,
        serviceType: parsed.data.serviceType,
        title: parsed.data.title,
        description: parsed.data.description,
        location: parsed.data.location,
        preferredStartDate: parsed.data.preferredStartDate
          ? new Date(`${parsed.data.preferredStartDate}T00:00:00.000Z`)
          : null,
        status: "SUBMITTED",
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ request: serviceRequest }, { status: 201 });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    console.error("POST /api/cliente/pedidos:", error);
    return NextResponse.json({ error: "Não foi possível enviar o pedido." }, { status: 500 });
  }
}
