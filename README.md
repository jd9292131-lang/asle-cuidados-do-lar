# ASLE – Cuidados do Lar

Plataforma online de recrutamento e intermediação de profissionais
domésticas e prestação de serviços para famílias e clientes.

## Arquitetura

- Next.js
- TypeScript
- PostgreSQL
- Neon
- Prisma
- Vercel

## Áreas

- Site público com contacto direto por WhatsApp
- Área profissional: perfil, documentos, oportunidades, candidaturas,
  entrevistas e mensagens
- Área cliente: submissão e acompanhamento de pedidos de serviço
- Painel administrativo: resumo de clientes, profissionais, pedidos e documentos

O número temporário de WhatsApp está definido em `src/lib/contact.ts`.
Altere a constante `ASLE_WHATSAPP_NUMBER` quando tiver o contacto oficial.

## Segurança

Documentos de identificação e outros ficheiros sensíveis devem ser
armazenados em armazenamento privado. Nunca colocar documentos
pessoais diretamente em /public.

### Primeiro administrador

Depois de aplicar as migrações, crie o primeiro utilizador administrador
num terminal local interativo:

```bash
npm run admin:bootstrap
```

O comando só funciona se ainda não existir uma conta `ADMIN`. Solicita os
dados diretamente no terminal e não aceita credenciais por argumentos.
Introduza uma palavra-passe longa e exclusiva; não reutilize credenciais
de outros serviços. O registo público nunca permite criar contas `ADMIN`.
As tentativas de login falhadas são limitadas por endereço de rede durante
uma janela de 15 minutos. As sessões administrativas e de recrutamento
expiram após quatro horas; sessões de clientes e profissionais duram sete
dias.

### Migrações

Em desenvolvimento, reveja e aplique as migrações com `npm run db:migrate`.
Em produção, faça backup da base de dados e aplique as migrações aprovadas
com `npm run db:deploy`. Não execute migrações de produção sem rever o SQL.

### Limpeza de documentos após eliminação

Se um ficheiro privado não puder ser apagado durante a eliminação de uma
conta, o identificador do Blob fica numa fila durável de limpeza. Um
administrador pode repetir a operação no painel. Confirme que
`BLOB_READ_WRITE_TOKEN` está configurado e que o armazenamento está acessível.

As notificações do painel são internas à plataforma; este projeto ainda não
envia e-mails nem mensagens automáticas por WhatsApp.

## Estado

As oportunidades só aparecem depois de serem publicadas pela equipa ASLE.
O envio e acompanhamento de pedidos e candidaturas requer uma conta e sessão
iniciada. A recuperação de acesso é assistida pela equipa através do WhatsApp.
