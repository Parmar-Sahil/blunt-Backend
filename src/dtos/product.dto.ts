export function toPublicProductDto(product: any) {
  if (!product) return null;
  const p = typeof product.toObject === "function" ? product.toObject() : product;

  const categoryObj = p.categoryId && typeof p.categoryId === "object" ? p.categoryId : null;
  const collectionObj = p.collectionId && typeof p.collectionId === "object" ? p.collectionId : null;

  return {
    _id: String(p._id),
    name: p.name,
    slug: p.slug,
    quote: p.quote || "",
    shortDescription: p.shortDescription || "",
    description: p.description,
    categoryId: categoryObj ? { _id: String(categoryObj._id), name: categoryObj.name, slug: categoryObj.slug } : (p.categoryId ? String(p.categoryId) : null),
    collectionId: collectionObj ? { _id: String(collectionObj._id), name: collectionObj.name, slug: collectionObj.slug } : (p.collectionId ? String(p.collectionId) : null),
    labels: Array.isArray(p.labels) ? p.labels : [],
    visibility: p.visibility || "public",
    status: p.status || "published",
    images: (p.images || []).map((img: any) => ({
      url: img.url,
      alt: img.alt || "",
      isThumbnail: !!img.isThumbnail,
      sortOrder: img.sortOrder || 0,
    })),
    thumbnail: p.thumbnail || (p.images && p.images[0]?.url) || "",
    variants: (p.variants || []).map((v: any) => ({
      _id: String(v._id || v.id || v.sku),
      color: v.color,
      size: v.size,
      sku: v.sku,
      stock: Math.max(0, v.stock || 0),
      availableStock: Math.max(0, v.availableStock || 0),
      priceOverride: v.priceOverride ?? null,
      status: (v.availableStock || v.stock) > 0 ? "active" : "out-of-stock",
    })),
    price: p.price,
    mrp: p.mrp || p.price,
    discount: p.discount || 0,
    isFeatured: !!p.isFeatured,
    displayPriority: p.displayPriority || 0,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

export function toPublicPaginatedProductsDto(paginatedResult: any) {
  if (!paginatedResult) return paginatedResult;

  return {
    ...paginatedResult,
    items: (paginatedResult.items || []).map(toPublicProductDto),
  };
}
