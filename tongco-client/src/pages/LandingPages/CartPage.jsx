
import { useEffect, useState } from 'react';
import Button from '../../components/Button.jsx';

import {
  getFallbackProductImage,
  getProductImage,
} from '../../assets/productImages.js';

const getCartData = (data) => {
  if (Array.isArray(data?.data)) {
    return data.data[0] || null;
  }

  if (data?.data && typeof data.data === 'object') {
    return data.data;
  }

  if (data?.items) {
    return data;
  }

  return null;
};

const CartPage = () => {
  const [cart, setCart] = useState(null);
  const [shippingAddress, setShippingAddress] = useState('');
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState('');
  const [checkingOut, setCheckingOut] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchCart = async () => {
    const token = localStorage.getItem('token');

    if (!token) {
      setCart(null);
      setError('Please log in first');
      return;
    }

    try {
      const response = await fetch(
        'https://rushline-apparel-api.onrender.com/api/orders/cart',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setCart(null);
        setError(data.message || 'Unable to load cart');
        return;
      }

      setCart(getCartData(data));
      setError('');
    } catch (error) {
      console.error(error);
      setCart(null);
      setError('Unable to connect to the server');
    }
  };

  const fetchProfile = async () => {
    const token = localStorage.getItem('token');

    setProfileLoading(true);
    setProfileError('');
    setShippingAddress('');

    if (!token) {
      setProfileError('Please log in first');
      setProfileLoading(false);
      return '';
    }

    try {
      const response = await fetch(
        'https://rushline-apparel-api.onrender.com/api/users/profile',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setProfileError(data.message || 'Unable to load shipping address');
        return '';
      }

      const profile = data.data?.[0] || data.user || null;

      if (!profile) {
        setProfileError('Profile information was not found');
        return '';
      }

      const savedAddress = (profile.address || '').trim();

      setShippingAddress(savedAddress);

      return savedAddress;
    } catch (error) {
      console.error(error);
      setProfileError('Unable to connect to the server');
      return '';
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
    fetchProfile();
  }, []);

  const handleCheckout = async () => {
    setMessage('');

    const token = localStorage.getItem('token');

    if (!token) {
      setMessage('Please log in first');
      return;
    }

    if (!cart?.items?.length) {
      setMessage('Your cart is empty');
      return;
    }

    if (profileLoading) {
      setMessage('Please wait while your shipping address loads');
      return;
    }

    if (profileError) {
      setMessage('Unable to verify your shipping address. Please try again.');
      return;
    }

    setCheckingOut(true);

    try {
      const address = await fetchProfile();

      if (!address) {
        setMessage(
          'Please save your shipping address in your Profile before checking out'
        );
        return;
      }

      const response = await fetch(
        'https://rushline-apparel-api.onrender.com/api/orders/checkout',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            shippingAddress: address,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || 'Checkout failed');
        return;
      }

      setMessage('Order placed successfully');
      setCart(null);

      await fetchCart();
    } catch (error) {
      console.error(error);
      setMessage('Unable to connect to the server');
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <section className="border-y-2 border-purple-900 bg-purple-50 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-purple-500">
            Customer Cart
          </p>

          <h1 className="text-3xl font-bold leading-tight text-purple-900 sm:text-4xl">
            My Cart
          </h1>

          <div className="mt-6">
            <Button to="/products">
              Back to Products
            </Button>
          </div>
        </div>
      </section>

      <section className="border-y-2 border-purple-900 bg-purple-50 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto max-w-3xl">
          {error && (
            <p className="text-sm text-purple-700">
              {error}
            </p>
          )}

          {!error &&
            (!cart ||
              !cart.items ||
              cart.items.length === 0) && (
              <p className="text-sm text-purple-600">
                Your cart is empty.
              </p>
            )}

          {cart?.items?.map((item) => {
            const productImage = getProductImage(item.product);
            const fallbackImage = getFallbackProductImage(item.product);

            return (
              <div
                key={item._id || item.product?._id}
                className="mb-4 rounded-3xl border-2 border-purple-900 bg-purple-100 p-4"
              >
                <div className="flex flex-col gap-4 sm:flex-row">
                  <div className="flex h-32 w-full items-center justify-center overflow-hidden rounded-[1.25rem] bg-white p-2 sm:w-40">
                    {productImage ? (
                      <img
                        src={productImage}
                        alt={item.product?.name || 'Product'}
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
                      <div className="flex h-full w-full items-center justify-center px-4 text-center">
                        <p className="text-xs font-semibold text-purple-600">
                          No Product Image
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold text-purple-900">
                      {item.product?.name || 'Product'}
                    </h2>

                    <p className="mt-2 text-sm text-purple-600">
                      Price: ₱{item.price}
                    </p>

                    <p className="mt-1 text-sm text-purple-600">
                      Quantity: {item.quantity}
                    </p>

                    <p className="mt-1 text-sm font-bold text-purple-900">
                      Subtotal: ₱{item.price * item.quantity}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}

          {cart?.items?.length > 0 && (
            <div className="mt-6 border-t-2 border-purple-900 pt-6">
              <p className="mb-5 text-xl font-bold text-purple-900">
                Total: ₱{cart.totalAmount}
              </p>

              <Button
                variant="primary"
                onClick={handleCheckout}
                disabled={
                  checkingOut ||
                  profileLoading ||
                  !!profileError ||
                  !shippingAddress
                }
              >
                {checkingOut ? 'Processing...' : 'Checkout'}
              </Button>
            </div>
          )}

          {message && (
            <p className="mt-4 text-sm font-medium text-purple-700">
              {message}
            </p>
          )}
        </div>
      </section>
    </div>
  );
};

export default CartPage;
