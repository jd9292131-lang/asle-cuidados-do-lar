import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    const user = await requireRole("CLIENT");
    await prisma.message.updateMany({
      where: { recipientId: user.id, status: "SENT" },
      data: { status: "READ", readAt: new Date() },
    });
    const messages = await prisma.message.findMany({
      where: { OR: [{ recipientId: user.id }, { senderId: user.id }] },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        User_Message_senderIdToUser: { select: { firstName: true, lastName: true, role: true } },
        User_Message_recipientIdToUser: { select: { firstName: true, lastName: true, role: true } },
      },
    });
    return NextResponse.json({ messages });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Inicie sessão." }, { status: 401 });
    if (error instanceof Error && error.message === "FORBIDDEN") return NextResponse.json({ error: "Apenas clientes podem consultar mensagens." }, { status: 403 });
    console.error("GET /api/cliente/mensagens:", error);
    return NextResponse.json({ error: "Não foi possível carregar as mensagens." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole("CLIENT");
    const parsed = z.object({ subject: z.string().trim().max(150).optional(), body: z.string().trim().min(1).max(3000) }).safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Mensagem inválida." }, { status: 400 });
    const recipients = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "RECRUITER"] }, status: "ACTIVE" },
      select: { id: true },
    });
    if (recipients.length === 0) return NextResponse.json({ error: "A equipa ASLE não está disponível para receber mensagens." }, { status: 503 });

    await prisma.$transaction(
      recipients.map((recipient) => prisma.message.create({
        data: {
          id: randomUUID(),
          senderId: user.id,
          recipientId: recipient.id,
          subject: parsed.data.subject || "Mensagem de cliente",
          body: parsed.data.body,
        },
      })),
    );
    await prisma.auditLog.create({
      data: { userId: user.id, action: "CLIENT_MESSAGE_SENT", entity: "Message", metadata: { recipientCount: recipients.length } },
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Inicie sessão." }, { status: 401 });
    if (error instanceof Error && error.message === "FORBIDDEN") return NextResponse.json({ error: "Apenas clientes podem enviar mensagens." }, { status: 403 });
    console.error("POST /api/cliente/mensagens:", error);
    return NextResponse.json({ error: "Não foi possível enviar a mensagem." }, { status: 500 });
  }
}
