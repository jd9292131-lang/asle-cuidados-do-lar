import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { z } from "zod";

dotenv.config({ path: ".env.local" });
dotenv.config();

const emailSchema = z.string().trim().email().toLowerCase();

async function askHidden(question: string) {
  if (!stdin.isTTY || typeof stdin.setRawMode !== "function") {
    throw new Error("Este comando deve ser executado num terminal interativo seguro.");
  }

  stdout.write(question);
  stdin.setRawMode(true);
  stdin.resume();

  return new Promise<string>((resolve, reject) => {
    let value = "";

    function finish(error?: Error) {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.removeListener("data", onData);
      stdout.write("\n");
      if (error) reject(error);
      else resolve(value);
    }

    function onData(buffer: Buffer) {
      for (const byte of buffer) {
        if (byte === 3) {
          finish(new Error("Configuração cancelada."));
          return;
        }

        if (byte === 13 || byte === 10) {
          finish();
          return;
        }

        if (byte === 8 || byte === 127) {
          value = value.slice(0, -1);
          continue;
        }

        if (byte >= 32 && byte <= 126) value += String.fromCharCode(byte);
      }
    }

    stdin.on("data", onData);
  });
}

async function main() {
  if (!stdin.isTTY || !stdout.isTTY) {
    throw new Error("Execute `npm run admin:bootstrap` diretamente num terminal interativo.");
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL não configurada.");

  const prompt = createInterface({ input: stdin, output: stdout });
  let pool: Pool | undefined;
  let prisma: PrismaClient | undefined;

  try {
    stdout.write("Configuração do primeiro administrador ASLE\n");
    const emailInput = await prompt.question("E-mail administrativo: ");
    const email = emailSchema.parse(emailInput);
    const firstName = (await prompt.question("Nome: ")).trim();
    const lastName = (await prompt.question("Apelido: ")).trim();
    prompt.close();

    if (firstName.length < 2 || lastName.length < 2) {
      throw new Error("Nome e apelido devem ter pelo menos 2 caracteres.");
    }

    const password = await askHidden("Palavra-passe (mínimo 14 caracteres): ");
    const confirmation = await askHidden("Confirme a palavra-passe: ");

    if (password.length < 14) throw new Error("A palavra-passe deve ter pelo menos 14 caracteres.");
    if (password !== confirmation) throw new Error("As palavras-passe não coincidem.");

    pool = new Pool({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
    prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
    const passwordHash = await bcrypt.hash(password, 12);

    const admin = await prisma.$transaction(
      async (tx) => {
        const existingAdmins = await tx.user.count({ where: { role: "ADMIN" } });
        if (existingAdmins > 0) {
          throw new Error("Já existe uma conta ADMIN. O bootstrap só pode ser executado uma vez.");
        }

        const existingUser = await tx.user.findUnique({
          where: { email },
          select: { id: true },
        });
        if (existingUser) throw new Error("Já existe uma conta com este e-mail.");

        const user = await tx.user.create({
          data: {
            email,
            passwordHash,
            role: "ADMIN",
            status: "ACTIVE",
            firstName,
            lastName,
          },
          select: { id: true },
        });

        await tx.auditLog.create({
          data: {
            userId: user.id,
            action: "INITIAL_ADMIN_CREATED",
            entity: "User",
            entityId: user.id,
            metadata: { role: "ADMIN", method: "secure-bootstrap" },
          },
        });

        return user;
      },
      {
        isolationLevel: "Serializable",
        maxWait: 15_000,
        timeout: 30_000,
      },
    );

    stdout.write(`Administrador inicial criado. ID: ${admin.id}\n`);
  } finally {
    prompt.close();
    await prisma?.$disconnect();
    await pool?.end();
  }
}

main().catch((error: unknown) => {
  console.error("Falha ao criar administrador:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
