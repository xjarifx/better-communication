const IMAGEKIT_UPLOAD_URL = "https://upload.imagekit.io/api/v1/files/upload";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function uploadToImageKit(file: File) {
  if (file.size > MAX_FILE_SIZE) {
    return { error: "File exceeds 10MB limit" as const, status: 400 };
  }

  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");
  const fileName = file.name || `upload-${Date.now()}`;

  const auth = Buffer.from(`${process.env.IMAGEKIT_PRIVATE_KEY!}:`).toString(
    "base64",
  );

  const body = new URLSearchParams({
    file: base64,
    fileName,
    useUniqueFileName: "true",
  });

  const res = await fetch(IMAGEKIT_UPLOAD_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    return {
      error: err?.message ?? "Upload failed",
      status: 502,
    };
  }

  const data = await res.json();

  return {
    url: data.url as string,
    thumbnailUrl: data.thumbnailUrl as string,
    fileName: data.name as string,
    fileSize: data.size as number,
  };
}
