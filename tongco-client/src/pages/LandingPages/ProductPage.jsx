
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Button from '../../components/Button.jsx';
import {
  getFallbackProductImage,
  getProductImage,
} from '../../assets/productImages.js';

const getSingleData = (data) => {
  if (Array.isArray(data?.data)) {
    return data.data[0] || null;
  }

  if (data?.data && typeof data.data === 'object') {
    return data.data;
  }

  if (data?._id) {
    return data;
  }

  return null;
};

const getArrayData = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.reviews)) return data.reviews;
  return [];
};

function ProductPage() {
  const { id } = useParams();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState('');
  const [cartMessage, setCartMessage] = useState('');
  const [loading, setLoading] = useState(true);

  let loggedInUser = null;

  try {
    loggedInUser = JSON.parse(localStorage.getItem('user'));
  } catch {
    loggedInUser = null;
  }

  const isAdmin = loggedInUser?.role?.toLowerCase() === 'admin';

  const fetchReviews = async (productId) => {
    if (!productId) {
      setReviews([]);
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/reviews?product=${productId}`
      );

      const data = await response.json();

      if (!response.ok) {
        setReviews([]);
        return;
      }

      setReviews(getArrayData(data));
    } catch (error) {
      console.error(error);
      setReviews([]);
    }
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError('');
        setProduct(null);
        setReviews([]);

        const response = await fetch(
          `http://localhost:5000/api/products/${id}`
        );

        const data = await response.json();

        if (!response.ok) {
          setError(data.message || 'Product not found');
          return;
        }

        const productData = getSingleData(data);

        if (!productData) {
          setError('Product not found');
          return;
        }

        setProduct(productData);
        await fetchReviews(productData._id);
      } catch (error) {
        console.error(error);
        setError('Unable to connect to the server');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    } else {
      setProduct(null);
      setReviews([]);
      setError('Product not found');
      setLoading(false);
    }
  }, [id]);

  const handleAddToCart = async () => {
    setCartMessage('');

    if (isAdmin) {
      return;
    }

    if (!product?._id) {
      setCartMessage('Product is unavailable');
      return;
    }

    const token = localStorage.getItem('token');

    if (!token) {
      setCartMessage('Please log in first');
      return;
    }

    try {
      const response = await fetch(
        'http://localhost:5000/api/orders/cart',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            productId: product._id,
            quantity: 1,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setCartMessage(
          data.message || 'Unable to add product to cart'
        );
        return;
      }

      setCartMessage('Product added to cart successfully');
    } catch (error) {
      console.error(error);
      setCartMessage('Unable to connect to the server');
    }
  };

  if (loading) {
    return (
      <div className="flex w-full flex-col gap-6">
        <section className="border-y-2 border-purple-900 bg-purple-50 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h1 className="text-3xl font-bold text-purple-900">
              Loading product...
            </h1>
          </div>
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex w-full flex-col gap-6">
        <section className="border-y-2 border-purple-900 bg-purple-50 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h1 className="text-3xl font-bold text-purple-900">
              {error}
            </h1>

            <Button to="/products" className="mt-6">
              Back to Products
            </Button>
          </div>
        </section>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex w-full flex-col gap-6">
        <section className="border-y-2 border-purple-900 bg-purple-50 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h1 className="text-3xl font-bold text-purple-900">
              Product not found
            </h1>

            <Button to="/products" className="mt-6">
              Back to Products
            </Button>
          </div>
        </section>
      </div>
    );
  }

  const productImage = getProductImage(product);
  const fallbackImage = getFallbackProductImage(product);

  return (
    <div className="flex w-full flex-col gap-6">
      <section className="border-y-2 border-purple-900 bg-purple-50 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-4">
            <Button to="/products">
              Back to Products
            </Button>
          </div>

          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-purple-500">
            {product.category?.name || 'Product'}
          </p>

          <h1 className="text-3xl font-bold leading-tight text-purple-900 sm:text-4xl">
            {product.name}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-purple-600">
            <span className="font-bold text-purple-900">
              ₱{product.price}
            </span>

            <span>
              Stock: {product.stock}
            </span>
          </div>
        </div>
      </section>

      <section className="border-y-2 border-purple-900 bg-purple-50 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 flex h-[420px] items-center justify-center overflow-hidden rounded-[1.25rem] border-2 border-purple-900 bg-white p-6 sm:h-[520px]">
            {productImage ? (
              <img
                src={productImage}
                alt={product.name || 'Product'}
                className="h-full w-full object-contain"
                onError={(e) => {
                  if (
                    fallbackImage &&
                    e.currentTarget.src !== fallbackImage
                  ) {
                    e.currentTarget.src = fallbackImage;
                  } else {
                    e.currentTarget.style.display = 'none';
                  }
                }}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center px-6 text-center">
                <p className="text-sm font-semibold text-purple-600">
                  No Product Image
                </p>
              </div>
            )}
          </div>

          <p className="text-base leading-7 text-purple-700">
            {product.description}
          </p>

          <div className="mt-8 border-t-2 border-purple-900 pt-6">
            {!isAdmin && (
              <Button
                variant="primary"
                className="mr-3"
                onClick={handleAddToCart}
              >
                Add to Cart
              </Button>
            )}

            <Button to="/products">
              Back to Products
            </Button>

            {!isAdmin && cartMessage && (
              <p className="mt-4 text-sm font-medium text-purple-700">
                {cartMessage}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="border-y-2 border-purple-900 bg-purple-50 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-purple-500">
            Customer Feedback
          </p>

          <h2 className="mt-2 text-2xl font-semibold text-purple-900">
            Product Reviews
          </h2>

          <p className="mt-2 text-sm text-purple-600">
            Reviews from customers who purchased this product.
          </p>

          <div className="mt-6 space-y-4">
            {reviews.length === 0 ? (
              <div className="rounded-2xl border border-purple-300 bg-purple-100 p-5">
                <p className="text-sm text-purple-600">
                  No reviews yet.
                </p>
              </div>
            ) : (
              reviews.map((review) => (
                <article
                  key={review._id}
                  className="rounded-2xl border-2 border-purple-900 bg-purple-100 p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-purple-900">
                        {review.user?.name || 'Customer'}
                      </p>

                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-purple-500">
                        Customer Review
                      </p>
                    </div>

                    <div className="rounded-full border-2 border-purple-900 bg-purple-50 px-4 py-2">
                      <span className="text-sm font-bold text-purple-900">
                        {review.rating}/5 ★
                      </span>
                    </div>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-purple-700">
                    {review.comment}
                  </p>
                </article>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default ProductPage;
