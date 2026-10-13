
import { useEffect, useState } from 'react';
import Button from '../../components/Button.jsx';
import {
  getFallbackProductImage,
  getProductImage,
} from '../../assets/productImages.js';

const API_URL = 'http://localhost:5000/api';

const getArrayData = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.orders)) return data.orders;
  return [];
};

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState('');
  const [orderMessage, setOrderMessage] = useState('');
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [reviewingProduct, setReviewingProduct] = useState(null);
  const [editingReview, setEditingReview] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewMessage, setReviewMessage] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const getCurrentUserId = () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      return user?._id || user?.id || user?.user?._id || user?.user?.id || null;
    } catch {
      return null;
    }
  };

  const fetchOrders = async () => {
    const token = localStorage.getItem('token');

    if (!token) {
      setOrders([]);
      setError('Please log in first');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/orders/my-orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setOrders([]);
        setError(data.message || 'Unable to load orders');
        return;
      }

      setOrders(getArrayData(data));
      setError('');
    } catch (error) {
      console.error(error);
      setOrders([]);
      setError('Unable to connect to the server');
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await fetch(`${API_URL}/reviews`);
      const data = await response.json();

      if (!response.ok) return;

      setReviews(getArrayData(data));
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchReviews();
  }, []);

  const getMyReview = (productId) => {
    const currentUserId = getCurrentUserId();

    if (!currentUserId || !productId) return null;

    return reviews.find((review) => {
      const reviewProductId =
        typeof review.product === 'object'
          ? review.product?._id
          : review.product;

      const reviewUserId =
        typeof review.user === 'object'
          ? review.user?._id
          : review.user;

      return (
        String(reviewProductId) === String(productId) &&
        String(reviewUserId) === String(currentUserId)
      );
    }) || null;
  };

  const handleItemReceived = async (orderId) => {
    const token = localStorage.getItem('token');

    if (!token) {
      setOrderMessage('Please log in first');
      return;
    }

    const confirmed = window.confirm(
      'Have you received your order? This will mark it as delivered.'
    );

    if (!confirmed) return;

    try {
      setUpdatingOrderId(orderId);
      setOrderMessage('');

      const response = await fetch(
        `${API_URL}/orders/${orderId}/delivered`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setOrderMessage(data.message || 'Unable to update order');
        return;
      }

      setOrders((previousOrders) =>
        previousOrders.map((order) =>
          order._id === orderId
            ? { ...order, status: 'delivered' }
            : order
        )
      );

      setOrderMessage('Order marked as delivered successfully.');
      await fetchOrders();
    } catch (error) {
      console.error(error);
      setOrderMessage('Unable to connect to the server');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const openReviewForm = (product) => {
    if (!product?._id) return;

    const existingReview = getMyReview(product._id);

    setReviewingProduct(product);
    setEditingReview(existingReview);
    setRating(existingReview?.rating ?? 5);
    setComment(existingReview?.comment ?? '');
    setReviewMessage('');

    setTimeout(() => {
      document.getElementById('customer-review-form')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 0);
  };

  const closeReviewForm = () => {
    setReviewingProduct(null);
    setEditingReview(null);
    setRating(5);
    setComment('');
    setReviewMessage('');
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewMessage('');

    const token = localStorage.getItem('token');

    if (!token) {
      setReviewMessage('Please log in first');
      return;
    }

    if (!reviewingProduct?._id) {
      setReviewMessage('Product not found');
      return;
    }

    const numericRating = Number(rating);
    const cleanComment = comment.trim();

    if (
      !Number.isInteger(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      setReviewMessage('Rating must be between 1 and 5');
      return;
    }

    if (!cleanComment) {
      setReviewMessage('Please enter your review');
      return;
    }

    try {
      setSubmittingReview(true);

      const isEditing = Boolean(editingReview?._id);

      const endpoint = isEditing
        ? `${API_URL}/reviews/${editingReview._id}`
        : `${API_URL}/reviews`;

      const response = await fetch(endpoint, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(
          isEditing
            ? {
                rating: numericRating,
                comment: cleanComment,
              }
            : {
                product: reviewingProduct._id,
                rating: numericRating,
                comment: cleanComment,
              }
        ),
      });

      const data = await response.json();

      if (!response.ok) {
        setReviewMessage(data.message || 'Unable to save review');
        return;
      }

      setReviewMessage(
        isEditing
          ? 'Review updated successfully'
          : 'Review submitted successfully'
      );

      await fetchReviews();

      const savedReview = getArrayData(data)[0];

      if (savedReview) {
        setEditingReview(savedReview);
      }
    } catch (error) {
      console.error(error);
      setReviewMessage('Unable to connect to the server');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <section className="border-y-2 border-purple-900 bg-purple-50 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-purple-500">
            Customer Orders
          </p>

          <h1 className="text-3xl font-bold leading-tight text-purple-900 sm:text-4xl">
            My Orders
          </h1>

          <p className="mt-3 text-sm text-purple-600">
            Track your orders, confirm when you receive them, and leave a review after delivery.
          </p>

          <div className="mt-6">
            <Button to="/products">Back to Products</Button>
          </div>
        </div>
      </section>

      <section className="border-y-2 border-purple-900 bg-purple-50 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto max-w-3xl">
          {error && (
            <p className="mb-4 text-sm text-purple-700">{error}</p>
          )}

          {orderMessage && (
            <p className="mb-4 rounded-xl border border-purple-300 bg-purple-100 p-4 text-sm font-medium text-purple-900">
              {orderMessage}
            </p>
          )}

          {!error && orders.length === 0 && (
            <p className="text-sm text-purple-600">No orders found.</p>
          )}

          <div className="space-y-5">
            {orders.map((order) => (
              <div
                key={order._id}
                className="rounded-3xl border-2 border-purple-900 bg-purple-100 p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-purple-500">
                      Order
                    </p>

                    <p className="mt-2 break-all text-xs text-purple-600">
                      ID: {order._id}
                    </p>
                  </div>

                  <div className="rounded-full border-2 border-purple-900 bg-purple-50 px-4 py-2">
                    <p className="text-xs font-bold uppercase text-purple-900">
                      {order.status}
                    </p>
                  </div>
                </div>

                {order.status === 'ready' && (
                  <div className="mt-5 rounded-2xl border border-purple-300 bg-purple-50 p-4">
                    <p className="mb-3 text-sm text-purple-700">
                      Your order is ready. Confirm once you have received your items.
                    </p>

                    <Button
                      variant="primary"
                      disabled={updatingOrderId === order._id}
                      onClick={() => handleItemReceived(order._id)}
                    >
                      {updatingOrderId === order._id
                        ? 'Updating...'
                        : 'Item Received'}
                    </Button>
                  </div>
                )}

                {order.status === 'delivered' && (
                  <p className="mt-4 text-sm font-semibold text-purple-900">
                    Your order has been delivered. You can now review your products.
                  </p>
                )}

                <div className="mt-5 space-y-5">
                  {Array.isArray(order.items) &&
                    order.items.map((item, index) => {
                      const product =
                        item.product &&
                        typeof item.product === 'object'
                          ? item.product
                          : null;

                      const productImage = getProductImage(product);
                      const fallbackImage =
                        getFallbackProductImage(product);

                      const canReview = order.status === 'delivered';
                      const existingReview = product?._id
                        ? getMyReview(product._id)
                        : null;

                      return (
                        <div
                          key={`${order._id}-${product?._id || index}`}
                          className="rounded-2xl border border-purple-300 bg-purple-50 p-4"
                        >
                          <div className="flex flex-col gap-4 sm:flex-row">
                            <div className="h-28 w-full overflow-hidden rounded-[1.25rem] bg-purple-200 sm:w-36">
                              {productImage ? (
                                <img
                                  src={productImage}
                                  alt={product?.name || 'Product'}
                                  className="h-full w-full object-cover"
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
                                <div className="flex h-full w-full items-center justify-center px-4 text-center">
                                  <p className="text-xs font-semibold text-purple-600">
                                    No Product Image
                                  </p>
                                </div>
                              )}
                            </div>

                            <div className="flex-1">
                              <p className="text-base font-semibold text-purple-900">
                                {product?.name || 'Product'}
                              </p>

                              <p className="mt-2 text-sm text-purple-600">
                                Quantity: {item.quantity}
                              </p>

                              <p className="mt-1 text-sm text-purple-600">
                                Price: ₱{item.price}
                              </p>

                              {canReview && product && (
                                <Button
                                  className="mt-4"
                                  variant="primary"
                                  onClick={() => openReviewForm(product)}
                                >
                                  {existingReview
                                    ? 'Edit Review'
                                    : 'Write Review'}
                                </Button>
                              )}

                              {!canReview && (
                                <p className="mt-4 text-xs text-purple-500">
                                  Reviews will be available once you confirm that your order has been delivered.
                                </p>
                              )}

                              {canReview && !product && (
                                <p className="mt-4 text-xs text-purple-500">
                                  This product is no longer available for review.
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>

                <p className="mt-5 text-base font-bold text-purple-900">
                  Total: ₱{order.totalAmount}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {reviewingProduct && (
        <section
          id="customer-review-form"
          className="border-y-2 border-purple-900 bg-purple-50 px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
        >
          <div className="mx-auto max-w-3xl">
            <div className="rounded-3xl border-2 border-purple-900 bg-purple-100 p-5 sm:p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-purple-500">
                Product Review
              </p>

              <h2 className="mt-2 text-2xl font-semibold text-purple-900">
                {editingReview ? 'Edit Review' : 'Review'}{' '}
                {reviewingProduct.name}
              </h2>

              <p className="mt-2 text-sm text-purple-600">
                Tell us about your experience with this product.
              </p>

              <form
                className="mt-6 space-y-5"
                onSubmit={handleReviewSubmit}
              >
                <div>
                  <label
                    htmlFor="rating"
                    className="text-sm font-semibold text-purple-900"
                  >
                    Rating
                  </label>

                  <select
                    id="rating"
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                    className="mt-2 w-full rounded-xl border-2 border-purple-300 bg-purple-50 px-4 py-3 text-sm text-purple-900 outline-none focus:border-purple-900"
                  >
                    <option value="5">5 - Excellent</option>
                    <option value="4">4 - Very Good</option>
                    <option value="3">3 - Good</option>
                    <option value="2">2 - Fair</option>
                    <option value="1">1 - Poor</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="comment"
                    className="text-sm font-semibold text-purple-900"
                  >
                    Review
                  </label>

                  <textarea
                    id="comment"
                    rows="5"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Write your review here..."
                    className="mt-2 w-full resize-none rounded-xl border-2 border-purple-300 bg-purple-50 px-4 py-3 text-sm leading-6 text-purple-900 outline-none placeholder:text-purple-400 focus:border-purple-900"
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={submittingReview}
                  >
                    {submittingReview
                      ? 'Saving...'
                      : editingReview
                        ? 'Update Review'
                        : 'Submit Review'}
                  </Button>

                  <Button
                    type="button"
                    onClick={closeReviewForm}
                    disabled={submittingReview}
                  >
                    Cancel
                  </Button>
                </div>

                {reviewMessage && (
                  <p className="text-sm font-medium text-purple-700">
                    {reviewMessage}
                  </p>
                )}
              </form>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default OrdersPage;
