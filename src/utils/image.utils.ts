export interface IMappedImage {
  publicId: string;
  url: string;
  alt?: string;
  width?: number;
  height?: number;
  isThumbnail: boolean;
  sortOrder: number;
}

export function reorderImages<T extends { publicId: string; sortOrder: number }>(
  images: T[],
  publicIdOrder: string[]
): T[] {
  return images
    .map((img) => {
      const newIdx = publicIdOrder.indexOf(img.publicId);
      if (newIdx !== -1) {
        img.sortOrder = newIdx;
      }
      return img;
    })
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function setThumbnail<T extends { publicId: string; isThumbnail: boolean }>(
  images: T[],
  publicId: string
): T[] {
  return images.map((img) => {
    img.isThumbnail = img.publicId === publicId;
    return img;
  });
}
