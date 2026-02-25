/**
 * Storage local para imagens - substitui o storage externo da Manus.
 * Salva arquivos em /public/uploads/ e serve via Express static.
 */
import fs from "fs";
import path from "path";

// Diretório base de uploads - relativo à raiz do projeto
const UPLOADS_DIR = path.resolve(process.cwd(), "public", "uploads");

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Salva um arquivo no storage local.
 * @param relKey - Caminho relativo, ex: "logos/user123-abc.png"
 * @param data - Buffer ou string com os dados do arquivo
 * @param _contentType - Tipo MIME (não usado localmente, mas mantido para compatibilidade)
 * @returns { key, url } onde url é o caminho público para acesso
 */
export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  _contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const key = relKey.replace(/^\/+/, "");
  const filePath = path.join(UPLOADS_DIR, key);
  const fileDir = path.dirname(filePath);

  ensureDir(fileDir);

  if (typeof data === "string") {
    fs.writeFileSync(filePath, data, "utf-8");
  } else {
    fs.writeFileSync(filePath, data as Buffer);
  }

  // URL pública para acesso via Express static
  const url = `/uploads/${key}`;

  return { key, url };
}

/**
 * Obtém a URL pública de um arquivo no storage local.
 */
export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = relKey.replace(/^\/+/, "");
  const url = `/uploads/${key}`;
  return { key, url };
}
