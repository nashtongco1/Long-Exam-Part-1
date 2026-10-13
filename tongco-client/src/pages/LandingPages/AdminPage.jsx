
import { useEffect, useRef, useState } from 'react';
import Button from '../../components/Button.jsx';

const API = 'https://rushline-apparel-api.onrender.com/api';
const inputClasses = 'mt-2 w-full rounded-xl border border-purple-300 bg-purple-100 px-4 py-3 text-sm text-purple-900 outline-none transition placeholder:text-purple-400 focus:border-purple-900 focus:bg-purple-50';
const getArrayData = (data) => {
  if (Array.isArray(data)) return data;
  for (const key of ['data', 'products', 'categories', 'suppliers', 'orders', 'reviews', 'users']) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  return [];
};
const getAllProducts = async () => {
  const products = [];
  let page = 1;
  let hasNextPage = true;
  while (hasNextPage) {
    const response = await fetch(`${API}/products?page=${page}&limit=100`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to load products');
    products.push(...getArrayData(data));
    hasNextPage = Boolean(data.pagination?.hasNextPage);
    page++;
  }
  return products;
};

const AdminPage = () => {
  const token = localStorage.getItem('token');
  const fileInputRef = useRef(null);
  let loggedInUser = null;
  try {
    loggedInUser = JSON.parse(localStorage.getItem('user'));
  } catch {
    loggedInUser = null;
  }
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState('');
  const [imageError, setImageError] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [editingProductId, setEditingProductId] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '', description: '', price: '', category: '',
    supplier: '', stock: '', image: ''
  });
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };

  const fetchProducts = async () => {
    try {
      setProducts(await getAllProducts());
    } catch (error) {
      console.error(error);
      setMessage(error.message || 'Unable to load products');
    }
  };
  const fetchResource = async (resource, setter, authenticated = false) => {
    try {
      const response = await fetch(`${API}/${resource}`, {
        headers: authenticated ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || `Failed to load ${resource}`);
      setter(getArrayData(data));
    } catch (error) {
      console.error(error);
    }
  };
  const fetchCategories = () => fetchResource('categories', setCategories);
  const fetchSuppliers = () => fetchResource('suppliers', setSuppliers);
  const fetchOrders = () => fetchResource('orders', setOrders, true);
  const fetchReviews = () => fetchResource('reviews', setReviews);
  const fetchUsers = () => fetchResource('users', setUsers, true);

  useEffect(() => {
    if (loggedInUser?.role === 'admin' && token) {
      fetchProducts();
      fetchCategories();
      fetchSuppliers();
      fetchOrders();
      fetchReviews();
      fetchUsers();
    }
  }, []);

  const handleProductChange = (e) => {
    const { name, value } = e.target;
    if ((name === 'price' || name === 'stock') && Number(value) < 0) return;
    setProductForm(current => ({ ...current, [name]: value }));
  };
  const handleImageClick = () => fileInputRef.current?.click();
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    setImageError('');
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setImageError('Only JPEG, PNG, and WebP image files are allowed.');
      e.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImageError('Image must be smaller than 5MB.');
      e.target.value = '';
      return;
    }
    setImageFile(file);
    setProductForm(current => ({ ...current, image: URL.createObjectURL(file) }));
  };
  const removeImage = () => {
    setImageFile(null);
    setProductForm(current => ({ ...current, image: '' }));
    setImageError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  const clearProductForm = () => {
    setProductForm({
      name: '', description: '', price: '', category: '',
      supplier: '', stock: '', image: ''
    });
    setImageFile(null);
    setEditingProductId(null);
    setImageError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setImageError('');
    const name = productForm.name.trim();
    const description = productForm.description.trim();
    const price = Number(productForm.price);
    const stock = Number(productForm.stock);
    if (name.length < 2) return setMessage('Product name must be at least 2 characters.');
    if (description.length < 5) return setMessage('Product description must be at least 5 characters.');
    if (productForm.price === '' || !Number.isFinite(price) || price <= 0) return setMessage('Price must be greater than 0.');
    if (productForm.stock === '' || !Number.isInteger(stock) || stock < 0) return setMessage('Stock must be a whole number of 0 or greater.');
    if (!productForm.category) return setMessage('Please select a category.');
    if (!productForm.supplier) return setMessage('Please select a supplier.');
    const url = editingProductId ? `${API}/products/${editingProductId}` : `${API}/products`;
    const method = editingProductId ? 'PUT' : 'POST';
    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('price', price.toString());
    formData.append('category', productForm.category);
    formData.append('supplier', productForm.supplier);
    formData.append('stock', stock.toString());
    if (imageFile) formData.append('image', imageFile);
    try {
      const response = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await response.json();
      if (!response.ok) {
        if (data.message?.toLowerCase().includes('image')) setImageError(data.message);
        else setMessage(data.message || 'Product operation failed');
        return;
      }
      setMessage(editingProductId ? 'Product updated successfully' : 'Product created successfully');
      clearProductForm();
      await fetchProducts();
    } catch (error) {
      console.error(error);
      setMessage('Unable to connect to the server');
    }
  };

  const handleEditProduct = (product) => {
    setEditingProductId(product._id);
    setImageFile(null);
    setProductForm({
      name: product.name || '',
      description: product.description || '',
      price: product.price ?? '',
      category: product.category?._id || product.category || '',
      supplier: product.supplier?._id || product.supplier || '',
      stock: product.stock ?? '',
      image: product.image || ''
    });
    setMessage('');
    setImageError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateResource = async (url, body, successMessage, refresh) => {
    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: authHeaders,
        ...(body ? { body: JSON.stringify(body) } : {})
      });
      const data = await response.json();
      setMessage(data.message || (response.ok ? successMessage : 'Operation failed'));
      if (response.ok) await refresh();
    } catch (error) {
      console.error(error);
      setMessage('Unable to connect to the server');
    }
  };
  const handleConfirmOrder = (id) => updateResource(`${API}/orders/${id}/confirm`, null, 'Order confirmed successfully', fetchOrders);
  const handleReadyOrder = (id) => updateResource(`${API}/orders/${id}/ready`, null, 'Order is ready for claiming', fetchOrders);
  const handleEditReview = async (review) => {
    const newComment = window.prompt('Edit review comment:', review.comment);
    if (newComment === null) return;
    const newRating = window.prompt('Edit rating from 1 to 5:', review.rating);
    if (newRating === null) return;
    const rating = Number(newRating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return setMessage('Rating must be a whole number from 1 to 5.');
    if (!newComment.trim()) return setMessage('Review comment cannot be empty.');
    await updateResource(`${API}/reviews/${review._id}`, {
      rating, comment: newComment.trim()
    }, 'Review updated successfully', fetchReviews);
  };
  const handleToggleUser = (user) => updateResource(`${API}/users/${user._id}`, {
    isActive: !user.isActive
  }, 'User updated successfully', fetchUsers);
  const handleEditUser = async (user) => {
    const name = window.prompt('Edit user name:', user.name || '');
    if (name === null) return;
    if (!name.trim()) return setMessage('User name cannot be empty.');
    await updateResource(`${API}/users/${user._id}`, {
      name: name.trim()
    }, 'User updated successfully', fetchUsers);
  };

  if (!token || !loggedInUser) {
    return (
      <div className="flex w-full flex-col gap-6">
        <section className="border-y-2 border-purple-900 bg-purple-50 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h1 className="text-3xl font-bold text-purple-900">Please log in first</h1>
            <Button to="/auth/signin" className="mt-6">Sign In</Button>
          </div>
        </section>
      </div>
    );
  }
  if (loggedInUser.role !== 'admin') {
    return (
      <div className="flex w-full flex-col gap-6">
        <section className="border-y-2 border-purple-900 bg-purple-50 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h1 className="text-3xl font-bold text-purple-900">Access Denied</h1>
            <p className="mt-3 text-sm text-purple-600">Admin account required.</p>
            <Button to="/" className="mt-6">Back Home</Button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <section className="border-y-2 border-purple-900 bg-purple-50 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-purple-500">Administrator</p>
          <h1 className="text-3xl font-bold leading-tight text-purple-900 sm:text-4xl">Admin Dashboard</h1>
          <p className="mt-3 text-sm text-purple-600">Manage Rushline Apparel products, orders, reviews, and users.</p>
          {message && <p className="mt-4 text-sm font-semibold text-purple-700">{message}</p>}
        </div>
      </section>

      <section className="border-y-2 border-purple-900 bg-purple-50 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-purple-500">Products</p>
          <h2 className="mt-2 text-2xl font-semibold text-purple-900">Manage Products</h2>
          <form className="mt-6 space-y-5" onSubmit={handleProductSubmit}>
            <div>
              <label className="text-sm font-medium text-purple-700">Product Name</label>
              <input name="name" minLength="2" value={productForm.name} onChange={handleProductChange} className={inputClasses} required />
            </div>
            <div>
              <label className="text-sm font-medium text-purple-700">Description</label>
              <textarea name="description" rows="4" minLength="5" value={productForm.description} onChange={handleProductChange} className={inputClasses} required />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-purple-700">Price</label>
                <input name="price" type="number" min="0.01" step="0.01" value={productForm.price} onChange={handleProductChange} className={inputClasses} required />
              </div>
              <div>
                <label className="text-sm font-medium text-purple-700">Stock</label>
                <input name="stock" type="number" min="0" step="1" value={productForm.stock} onChange={handleProductChange} className={inputClasses} required />
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-purple-700">Category</label>
                <select name="category" value={productForm.category} onChange={handleProductChange} className={inputClasses} required>
                  <option value="">Select Category</option>
                  {categories.map(item => <option key={item._id} value={item._id}>{item.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-purple-700">Supplier</label>
                <select name="supplier" value={productForm.supplier} onChange={handleProductChange} className={inputClasses} required>
                  <option value="">Select Supplier</option>
                  {suppliers.map(item => <option key={item._id} value={item._id}>{item.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-purple-700">Product Image</label>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} className="hidden" />
              <button type="button" onClick={handleImageClick} className="mt-2 flex min-h-44 w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-purple-400 bg-purple-100 px-4 py-5 text-center transition hover:border-purple-900 hover:bg-purple-50">
                {productForm.image ? (
                  <img src={productForm.image} alt="Product preview" className="max-h-56 w-auto rounded-xl object-contain" />
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-10 w-10 text-purple-900">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.5 6.5 13 4h-2L9.5 6.5H6A2.5 2.5 0 0 0 3.5 9v8A2.5 2.5 0 0 0 6 19.5h12a2.5 2.5 0 0 0 2.5-2.5V9A2.5 2.5 0 0 0 18 6.5h-3.5Z" />
                      <circle cx="12" cy="13" r="3.5" />
                    </svg>
                    <p className="mt-3 text-sm font-semibold text-purple-900">Choose Product Image</p>
                    <p className="mt-1 text-xs text-purple-500">JPEG, PNG or WebP. Maximum 5MB.</p>
                  </>
                )}
              </button>
              {productForm.image && (
                <div className="mt-3 flex flex-wrap gap-3">
                  <Button type="button" onClick={handleImageClick}>Change Image</Button>
                  <Button type="button" onClick={removeImage}>Remove Image</Button>
                </div>
              )}
              {imageError && <p className="mt-2 text-sm font-medium text-purple-700">{imageError}</p>}
            </div>
            <div className="flex flex-wrap gap-3">
              <Button type="submit" variant="primary">{editingProductId ? 'Update Product' : 'Create Product'}</Button>
              {editingProductId && <Button type="button" onClick={clearProductForm}>Cancel Edit</Button>}
            </div>
          </form>
          <div className="mt-8 space-y-4">
            <p className="text-sm font-semibold text-purple-900">Total Products: {products.length}</p>
            {products.length === 0 ? <p className="text-sm text-purple-600">No products found.</p> : products.map(product => (
              <div key={product._id} className="rounded-3xl border-2 border-purple-900 bg-purple-100 p-4">
                {product.image && <img src={product.image} alt={product.name} className="mb-4 h-40 w-full rounded-2xl object-contain" />}
                <h3 className="text-lg font-semibold text-purple-900">{product.name}</h3>
                <p className="mt-2 text-sm text-purple-600">₱{product.price} | Stock: {product.stock}</p>
                <p className="mt-1 text-sm text-purple-600">Category: {product.category?.name || 'N/A'}</p>
                <p className="mt-1 text-sm text-purple-600">Supplier: {product.supplier?.name || 'N/A'}</p>
                <Button className="mt-4" onClick={() => handleEditProduct(product)}>Edit Product</Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y-2 border-purple-900 bg-purple-50 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-purple-500">Orders</p>
          <h2 className="mt-2 text-2xl font-semibold text-purple-900">Manage Orders</h2>
          <div className="mt-6 space-y-4">
            {orders.length === 0 ? <p className="text-sm text-purple-600">No orders found.</p> : orders.map(order => (
              <div key={order._id} className="rounded-3xl border-2 border-purple-900 bg-purple-100 p-4">
                <p className="font-semibold text-purple-900">Customer: {order.user?.name || 'N/A'}</p>
                <p className="mt-2 text-sm text-purple-600">Status: {order.status}</p>
                <p className="mt-1 text-sm text-purple-600">Total: ₱{order.totalAmount}</p>
                <div className="mt-4">
                  {order.status === 'ongoing' && <Button variant="primary" onClick={() => handleConfirmOrder(order._id)}>Confirm Order</Button>}
                  {order.status === 'confirmed' && <Button variant="primary" onClick={() => handleReadyOrder(order._id)}>Ready for Claiming</Button>}
                  {order.status === 'ready' && <p className="text-sm font-semibold text-purple-700">Order is ready for claiming.</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y-2 border-purple-900 bg-purple-50 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-purple-500">Reviews</p>
          <h2 className="mt-2 text-2xl font-semibold text-purple-900">Manage Reviews</h2>
          <div className="mt-6 space-y-4">
            {reviews.length === 0 ? <p className="text-sm text-purple-600">No reviews found.</p> : reviews.map(review => (
              <div key={review._id} className="rounded-3xl border-2 border-purple-900 bg-purple-100 p-4">
                <p className="font-semibold text-purple-900">{review.product?.name || 'Product'}</p>
                <p className="mt-2 text-sm text-purple-600">Customer: {review.user?.name || 'N/A'}</p>
                <p className="mt-1 text-sm text-purple-600">Rating: {review.rating}/5</p>
                <p className="mt-2 text-sm text-purple-700">{review.comment}</p>
                <Button className="mt-4" onClick={() => handleEditReview(review)}>Edit Review</Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y-2 border-purple-900 bg-purple-50 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-purple-500">Users</p>
          <h2 className="mt-2 text-2xl font-semibold text-purple-900">Manage Users</h2>
          <div className="mt-6 space-y-4">
            {users.length === 0 ? <p className="text-sm text-purple-600">No users found.</p> : users.map(user => (
              <div key={user._id} className="rounded-3xl border-2 border-purple-900 bg-purple-100 p-4">
                <h3 className="text-lg font-semibold text-purple-900">{user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim()}</h3>
                <p className="mt-2 text-sm text-purple-600">{user.email}</p>
                <p className="mt-1 text-sm text-purple-600">Role: {user.role}</p>
                <p className="mt-1 text-sm font-semibold text-purple-900">Status: {user.isActive ? 'Active' : 'Inactive'}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Button onClick={() => handleEditUser(user)}>Edit User</Button>
                  <Button variant="primary" onClick={() => handleToggleUser(user)}>{user.isActive ? 'Set Inactive' : 'Set Active'}</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminPage;
