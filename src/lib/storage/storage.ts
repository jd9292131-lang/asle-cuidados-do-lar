import { del, get, head, put } from "@vercel/blob";

export type StoredFile = {
  pathname: string;
  url: string;
  downloadUrl: string;
  contentType: string;
  size: number;
};

function getBlobToken() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (!token) {
    throw new Error("BLOB_READ_WRITE_TOKEN não configurado.");
  }

  return token;
}

export async function uploadPrivateFile({
  pathname,
  body,
  contentType,
}: {
  pathname: string;
  body: Buffer;
  contentType: string;
}): Promise<StoredFile> {
  const result = await put(pathname, body, {
    access: "private",
    contentType,
    token: getBlobToken(),
    addRandomSuffix: false,
  });

  return {
    pathname: result.pathname,
    url: result.url,
    downloadUrl: result.downloadUrl,
    contentType: result.contentType,
    size: body.length,
  };
}

export async function getPrivateFile(pathname: string) {
  return get(pathname, {
    access: "private",
    token: getBlobToken(),
  });
}

export async function getPrivateFileMetadata(pathname: string) {
  return head(pathname, {
    token: getBlobToken(),
  });
}

export async function deletePrivateFile(pathname: string) {
  await del(pathname, {
    token: getBlobToken(),
  });
}