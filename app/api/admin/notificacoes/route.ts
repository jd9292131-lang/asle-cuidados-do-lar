import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

const createSchema = z.object({
  title: z.string().trim().min(3).max(150),
  content: z.string().trim().min(5).max(3000),
  audience: z.enum(["ALL", "CANDIDATES", "CLIENTS", "RECRUITERS", "ADMINS", "SPECIFIC_USERS"]),
  userIds: z.array(z.string().uuid()).max(500).optional(),
  buttonText: z.string().trim().max(50).optional(),
  buttonUrl: z.string().trim().max(300).optional(),
});

export async function GET() {
  try {
    await requireRole("ADMIN", "RECRUITER");
    const announcements = await prisma.announcement.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { _count: { select: { AnnouncementRecipient: true } } },
    });
    return NextResponse.json({ announcements });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Inicie sessão." }, { status: 401 });
    if (error instanceof Error && error.message === "FORBIDDEN") return NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 });
    console.error("GET /api/admin/notificacoes:", error);
    return NextResponse.json({ error: "Não foi possível carregar os avisos." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireRole("ADMIN", "RECRUITER");
    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Título, mensagem ou destinatários inválidos." }, { status: 400 });
    const { title, content, audience, userIds = [], buttonText, buttonUrl } = parsed.data;
    if (audience === "SPECIFIC_USERS" && userIds.length === 0) {
      return NextResponse.json({ error: "Selecione pelo menos um destinatário." }, { status: 400 });
    }
    if (buttonUrl && (!buttonUrl.startsWith("/") || buttonUrl.startsWith("//"))) {
      return NextResponse.json({ error: "A ligação do botão deve apontar para uma página interna." }, { status: 400 });
    }

    const selectedUserIds = [...new Set(userIds)];
    const roleFilter =
      audience === "CANDIDATES" ? "CANDIDATE" :
      audience === "CLIENTS" ? "CLIENT" :
      audience === "RECRUITERS" ? "RECRUITER" :
      audience === "ADMINS" ? "ADMIN" : undefined;
    const recipients = await prisma.user.findMany({
      where: {
        status: "ACTIVE",
        ...(roleFilter ? { role: roleFilter } : {}),
        ...(audience === "SPECIFIC_USERS" ? { id: { in: selectedUserIds } } : {}),
      },
      select: { id: true },
      take: 5000,
    });
    if (audience === "SPECIFIC_USERS" && recipients.length !== selectedUserIds.length) {
      return NextResponse.json({ error: "Um ou mais destinatários não existem ou não têm uma conta ativa." }, { status: 400 });
    }
    if (recipients.length === 0) return NextResponse.json({ error: "Não foram encontrados destinatários ativos." }, { status: 400 });

    const id = randomUUID();
    const now = new Date();
    await prisma.$transaction(async (tx) => {
      await tx.announcement.create({
        data: {
          id,
          title,
          content,
          type: "GENERAL",
          status: "PUBLISHED",
          display: "NOTIFICATION",
          audience,
          buttonText: buttonText || null,
          buttonUrl: buttonUrl || null,
          createdById: actor.id,
          publishedAt: now,
          updatedAt: now,
        },
      });

      for (let offset = 0; offset < recipients.length; offset += 250) {
        const batch = recipients.slice(offset, offset + 250);
        await tx.announcementRecipient.createMany({
          data: batch.map(({ id: userId }) => ({ id: randomUUID(), announcementId: id, userId })),
        });
        await tx.notification.createMany({
          data: batch.map(({ id: userId }) => ({
            id: randomUUID(),
            userId,
            type: "ANNOUNCEMENT",
            title,
            message: content,
            actionUrl: buttonUrl || null,
          })),
        });
      }

      await tx.auditLog.create({
        data: {
          userId: actor.id,
          action: "ANNOUNCEMENT_PUBLISHED",
          entity: "Announcement",
          entityId: id,
          metadata: { audience, recipientCount: recipients.length },
        },
      });
    });

    return NextResponse.json({ id, recipientCount: recipients.length }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Inicie sessão." }, { status: 401 });
    if (error instanceof Error && error.message === "FORBIDDEN") return NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 });
    console.error("POST /api/admin/notificacoes:", error);
    return NextResponse.json({ error: "Não foi possível publicar o aviso." }, { status: 500 });
  }
}
