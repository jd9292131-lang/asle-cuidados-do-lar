import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/session";
import { deletePrivateFile, uploadPrivateFile } from "@/lib/storage/storage";
import { z } from "zod";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
]);

const ALLOWED_DOCUMENT_TYPES = new Set([
  "ID_CARD",
  "PASSPORT",
  "RESUME",
  "CERTIFICATE",
  "OTHER",
]);

const documentTypeSchema = z.enum([
  "ID_CARD",
  "PASSPORT",
  "RESUME",
  "CERTIFICATE",
  "OTHER",
]);

function sanitizeOriginalName(name: string) {
  return name
    .normalize("NFKC")
    .replace(/[/\\]/g, "_")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim()
    .slice(0, 255);
}

function getExtension(mimeType: string) {
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/png") return "png";

  return "bin";
}

async function matchesFileSignature(file: File) {
  const bytes = Buffer.from(await file.slice(0, 8).arrayBuffer());

  if (file.type === "application/pdf") {
    return bytes.subarray(0, 5).equals(Buffer.from("%PDF-"));
  }

  if (file.type === "image/jpeg") {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }

  if (file.type === "image/png") {
    return bytes.equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }

  return false;
}

function authorizationResponse(error: unknown) {
  if (error instanceof Error && error.message === "UNAUTHORIZED") {
    return NextResponse.json({ error: "Inicie sessão para continuar." }, { status: 401 });
  }

  if (error instanceof Error && error.message === "FORBIDDEN") {
    return NextResponse.json({ error: "Apenas profissionais podem gerir documentos." }, { status: 403 });
  }

  return null;
}

export async function GET() {
  try {
    const user = await requireRole("CANDIDATE");

    const documents = await prisma.document.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        uploadedAt: "desc",
      },
      select: {
        id: true,
        type: true,
        status: true,
        originalName: true,
        mimeType: true,
        sizeBytes: true,
        rejectionReason: true,
        uploadedAt: true,
        reviewedAt: true,
      },
    });

    return NextResponse.json({
      documents,
    });
  } catch (error) {
    const authResponse = authorizationResponse(error);
    if (authResponse) return authResponse;

    console.error("GET /api/profissional/documentos:", error);

    return NextResponse.json(
      {
        error: "Não foi possível carregar os documentos.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(request: Request) {
  let uploadedPathname: string | null = null;

  try {
    const user = await requireRole("CANDIDATE");

    const formData = await request.formData();

    const file = formData.get("file");
    const documentType = formData.get("type");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          error: "Nenhum ficheiro foi enviado.",
        },
        {
          status: 400,
        },
      );
    }

    const parsedDocumentType = documentTypeSchema.safeParse(documentType);
    if (!parsedDocumentType.success || !ALLOWED_DOCUMENT_TYPES.has(parsedDocumentType.data)) {
      return NextResponse.json(
        {
          error: "Tipo de documento inválido.",
        },
        {
          status: 400,
        },
      );
    }

    if (file.size <= 0) {
      return NextResponse.json(
        {
          error: "O ficheiro está vazio.",
        },
        {
          status: 400,
        },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: "O ficheiro excede o limite de 10 MB.",
        },
        {
          status: 400,
        },
      );
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        {
          error: "Formato não permitido. Envie PDF, JPG ou PNG.",
        },
        {
          status: 400,
        },
      );
    }

    if (!(await matchesFileSignature(file))) {
      return NextResponse.json(
        { error: "O conteúdo do ficheiro não corresponde ao formato declarado." },
        { status: 400 },
      );
    }

    const originalName = sanitizeOriginalName(file.name);

    if (!originalName) {
      return NextResponse.json(
        {
          error: "Nome de ficheiro inválido.",
        },
        {
          status: 400,
        },
      );
    }

    const extension = getExtension(file.type);

    const pathname = `professionals/${user.id}/documents/${randomUUID()}.${extension}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const stored = await uploadPrivateFile({
      pathname,
      body: buffer,
      contentType: file.type,
    });

    uploadedPathname = stored.pathname;

    const document = await prisma.document.create({
      data: {
        userId: user.id,
        type: parsedDocumentType.data,
        status: "PENDING",
        originalName,
        mimeType: file.type,
        sizeBytes: file.size,
        storageKey: stored.pathname,
      },
      select: {
        id: true,
        type: true,
        status: true,
        originalName: true,
        mimeType: true,
        sizeBytes: true,
        rejectionReason: true,
        uploadedAt: true,
      },
    });

    return NextResponse.json(
      {
        document,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    const authResponse = authorizationResponse(error);
    if (authResponse) return authResponse;

    if (uploadedPathname) {
      try {
        await deletePrivateFile(uploadedPathname);
      } catch (cleanupError) {
        console.error(
          "Falha ao remover Blob após erro:",
          cleanupError,
        );
      }
    }

    console.error("POST /api/profissional/documentos:", error);

    return NextResponse.json(
      {
        error: "Não foi possível guardar o documento.",
      },
      {
        status: 500,
      },
    );
  }
}