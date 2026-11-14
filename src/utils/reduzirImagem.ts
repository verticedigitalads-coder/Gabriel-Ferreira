// Reduz a imagem no aparelho antes de subir: lado maior até maxPx, sem ampliar.
// JPEG continua JPEG; PNG e WebP viram PNG, que mantém a transparência (o
// Safari não gera WebP no canvas).
export async function reduzirImagem(file: File, maxPx: number): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const escala = Math.min(1, maxPx / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.naturalWidth * escala);
    canvas.height = Math.round(img.naturalHeight * escala);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas indisponível');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const tipo = file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png';
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Falha ao gerar a imagem'))), tipo, 0.9),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}
