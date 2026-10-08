import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth/session";

export async function POST() {
  try {
    await destroySession();

    return NextResponse.json({
      ok: true,
      message: "Sessão terminada com sucesso.",
      redirectTo: "/",
    });
  } catch (error) {
    console.error("LOGOUT_ERROR", error);

    return NextResponse.json(
      {
        ok: false,
        message: "Não foi possível terminar a sessão.",
      },
      { status: 500 }
    );
  }
}