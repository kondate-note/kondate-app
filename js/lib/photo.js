// 写真の圧縮。長辺1024px・JPEG品質0.6にして保存容量を節約する
export const MAX_SIDE = 1024;
export const QUALITY = 0.6;

// 縦横比を保って長辺を max 以下にする（小さい写真は拡大しない）
export function fitSize(width, height, max = MAX_SIDE) {
  const scale = Math.min(1, max / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

// スマホ写真の向き（EXIF）を反映して読み込む
async function loadImage(file) {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch { /* 古いブラウザは下の方法で */ }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function compressPhoto(file) {
  if (!file || !file.type.startsWith("image/")) throw new Error("NOT_IMAGE");
  const img = await loadImage(file);
  const { width, height } = fitSize(img.width, img.height);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fff"; // 透明部分を白に（JPEGは透明にできない）
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);
  img.close?.();
  const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", QUALITY));
  if (!blob) throw new Error("NOT_IMAGE");
  return blob;
}
