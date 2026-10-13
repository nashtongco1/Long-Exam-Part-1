
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Button from '../../components/Button.jsx';
import ProductList from '../../components/ProductList.jsx';

const API = 'https://rushline-apparel-api.onrender.com/api';
const getArrayData = (data, key) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.[key])) return data[key];
  return [];
};

const ProductListPage = () => {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const categoryFromHome = searchParams.get('category');

  useEffect(() => {
    let cancelled = false;
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API}/categories`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to load categories');
        const list = getArrayData(data, 'categories');
        if (cancelled) return;
        setCategories(list);
        if (categoryFromHome) {
          const matched = list.find(item => item.name?.toLowerCase() === categoryFromHome.toLowerCase());
          setCategory(matched?.name || '');
        } else {
          setCategory('');
        }
      } catch (error) {
        console.error(error);
        if (!cancelled) setCategories([]);
      }
    };
    fetchCategories();
    return () => { cancelled = true; };
  }, [categoryFromHome]);

  useEffect(() => {
    let cancelled = false;
    const fetchProducts = async () => {
      setLoading(true);
      setError('');
      try {
        const allProducts = [];
        let page = 1;
        let hasNextPage = true;
        while (hasNextPage) {
          const params = new URLSearchParams();
          params.set('page', page.toString());
          params.set('limit', '100');
          if (search.trim()) params.set('search', search.trim());
          if (category) params.set('category', category);
          const response = await fetch(`${API}/products?${params.toString()}`);
          const data = await response.json();
          if (!response.ok) throw new Error(data.message || 'Failed to load products');
          allProducts.push(...getArrayData(data, 'products'));
          hasNextPage = Boolean(data.pagination?.hasNextPage);
          page++;
        }
        if (!cancelled) {
          setProducts(allProducts);
          setError('');
        }
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          setProducts([]);
          setError(error.message || 'Unable to connect to the server');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchProducts();
    return () => { cancelled = true; };
  }, [search, category]);

  return (
    <div className="flex w-full flex-col gap-6">
      <section className="border-y-2 border-purple-900 bg-purple-50 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-purple-500">
          {categoryFromHome ? `${categoryFromHome} Collection` : 'Rushline Products'}
        </p>
        <h1 className="max-w-xl text-3xl font-bold leading-tight text-purple-900 sm:text-4xl">
          {categoryFromHome ? `Shop ${categoryFromHome}` : 'Gear up for the planet. Performance kits that protect your track.'}
        </h1>
        <p className="mt-4 max-w-lg text-sm leading-7 text-purple-600 sm:text-base">
          {categoryFromHome ? `Browse our available ${categoryFromHome} products.` : 'Enter the Rushline. Explore high-performance gear crafted from recycled fibers for zero-waste speed.'}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button to="/">Back Home</Button>
          {categoryFromHome && <Button to="/products">View All Products</Button>}
        </div>
      </section>
      <section className="border-y-2 border-purple-900 bg-purple-50 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-purple-500">Featured Products</p>
          <h2 className="mt-2 text-2xl font-semibold text-purple-900">
            {categoryFromHome ? `${categoryFromHome} Products` : 'Rushline Lab collection'}
          </h2>
        </div>
        <div className={`mb-6 grid gap-4 ${categoryFromHome ? 'grid-cols-1' : 'sm:grid-cols-2'}`}>
          <input
            type="text"
            placeholder={categoryFromHome ? `Search ${categoryFromHome} products` : 'Search products'}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="rounded-xl border border-purple-300 bg-purple-100 px-4 py-3 text-sm text-purple-900 outline-none placeholder:text-purple-400 focus:border-purple-900 focus:bg-purple-50"
          />
          {!categoryFromHome && (
            <select value={category} onChange={e => setCategory(e.target.value)} className="rounded-xl border border-purple-300 bg-purple-100 px-4 py-3 text-sm text-purple-900 outline-none focus:border-purple-900 focus:bg-purple-50">
              <option value="">All Categories</option>
              {categories.map(item => <option key={item._id} value={item.name}>{item.name}</option>)}
            </select>
          )}
        </div>
        {loading ? (
          <p className="text-sm text-purple-600">Loading products...</p>
        ) : error ? (
          <p className="text-sm text-purple-600">{error}</p>
        ) : products.length === 0 ? (
          <p className="text-sm text-purple-600">No products found.</p>
        ) : (
          <>
            <p className="mb-4 text-sm font-medium text-purple-700">Showing {products.length} products</p>
            <ProductList products={products} />
          </>
        )}
      </section>
    </div>
  );
};

export default ProductListPage;
