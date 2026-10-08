import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    await requireRole("ADMIN", "RECRUITER");
    const messages = await prisma.message.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        User_Message_senderIdToUser: { select: { firstName: true, lastName: true, email: true } },
        User_Message_recipientIdToUser: { select: { firstName: true, lastName: true, email: true } },
      },
    });
    return NextResponse.json({ messages });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Inicie sessão." }, { status: 401 });
    if (error instanceof Error && error.message === "FORBIDDEN") return NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 });
    console.error("GET /api/admin/mensagens:", error);
    return NextResponse.json({ error: "Não foi possível carregar as mensagens." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireRole("ADMIN", "RECRUITER");
    const parsed = z.object({
      recipientId: z.string().uuid(),
      subject: z.string().trim().max(150).optional(),
      body: z.string().trim().min(1).max(5000),
    }).safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Destinatário ou mensagem inválidos." }, { status: 400 });
    if (parsed.data.recipientId === actor.id) return NextResponse.json({ error: "Não pode enviar uma mensagem para si próprio." }, { status: 400 });

    const recipient = await prisma.user.findUnique({
      where: { id: parsed.data.recipientId },
      select: { id: true, status: true, role: true },
    });
    if (!recipient || recipient.status !== "ACTIVE") {
      return NextResponse.json({ error: "O destinatário não existe ou não tem uma conta ativa." }, { status: 404 });
    }

    const id = randomUUID();
    await prisma.$transaction([
      prisma.message.create({
        data: {
          id,
          senderId: actor.id,
          recipientId: recipient.id,
          subject: parsed.data.subject || null,
          body: parsed.data.body,
        },
      }),
      prisma.notification.create({
        data: {
          userId: recipient.id,
          type: "MESSAGE",
          title: "Nova mensagem da equipa ASLE",
          message: parsed.data.subject || "Recebeu uma nova mensagem.",
          actionUrl: recipient.role === "CANDIDATE" ? "/profissional/mensagens" : "/cliente/mensagens",
        },
      }),
      prisma.auditLog.create({
        data: {
          userId: actor.id,
          action: "ADMIN_MESSAGE_SENT",
          entity: "Message",
          entityId: id,
          metadata: { recipientId: recipient.id },
        },
      }),
    ]);
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Inicie sessão." }, { status: 401 });
    if (error instanceof Error && error.message === "FORBIDDEN") return NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 });
    console.error("POST /api/admin/mensagens:", error);
    return NextResponse.json({ error: "Não foi possível enviar a mensagem." }, { status: 500 });
  }
}
