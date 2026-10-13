import Button from './Button';

import {
  getFallbackProductImage,
  getProductImage,
} from '../assets/productImages.js';

const ProductCard = ({ product, index }) => {
  const productImage = getProductImage(product);
  const fallbackImage = getFallbackProductImage(product);

  return (
    <article className="rounded-3xl border-2 border-purple-900 bg-purple-100 p-4">

      <div className="h-80 overflow-hidden rounded-[1.25rem] bg-white">
        {productImage ? (
          <img
            src={productImage}
            alt={product.name}
            className="h-full w-full object-contain p-4"
            onError={(e) => {
              if (fallbackImage) {
                e.currentTarget.src = fallbackImage;
              } else {
                e.currentTarget.style.display = 'none';
              }
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-purple-200 px-6 text-center">
            <p className="text-sm font-semibold text-purple-600">
              No Product Image
            </p>
          </div>
        )}
      </div>

      <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-purple-500">
        {product.category?.name}{' '}
        {String(index + 1).padStart(2, '0')}
      </p>

      <h3 className="mt-2 text-lg font-semibold text-purple-900">
        {product.name}
      </h3>

      <p className="mt-2 text-base font-bold text-purple-900">
        ₱{product.price}
      </p>

      <p className="mt-3 text-sm leading-6 text-purple-600">
        {product.description?.substring(0, 120)}
        {product.description?.length > 120 ? '...' : ''}
      </p>

      <Button
        to={`/products/${product._id}`}
        className="mt-4"
      >
        View Product
      </Button>

    </article>
  );
};

export default ProductCard;