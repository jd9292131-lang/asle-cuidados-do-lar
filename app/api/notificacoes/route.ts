import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Inicie sessão." }, { status: 401 });
    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json({ notifications });
  } catch (error) {
    console.error("GET /api/notificacoes:", error);
    return NextResponse.json({ error: "Não foi possível carregar as notificações." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Inicie sessão." }, { status: 401 });
    const parsed = z.object({ id: z.string().uuid() }).safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Notificação inválida." }, { status: 400 });
    const result = await prisma.notification.updateMany({
      where: { id: parsed.data.id, userId: user.id, readAt: null },
      data: { readAt: new Date() },
    });
    if (result.count === 0) {
      const exists = await prisma.notification.findFirst({
        where: { id: parsed.data.id, userId: user.id },
        select: { id: true },
      });
      if (!exists) return NextResponse.json({ error: "Notificação não encontrada." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PATCH /api/notificacoes:", error);
    return NextResponse.json({ error: "Não foi possível atualizar a notificação." }, { status: 500 });
  }
}
