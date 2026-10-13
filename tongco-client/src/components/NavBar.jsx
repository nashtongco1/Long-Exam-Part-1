import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import logo from '../assets/img/cover.jpg';

const navLinkClassName = ({ isActive }) =>
  [
    'rounded-full border-2 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] transition',
    isActive
      ? 'border-purple-900 bg-purple-900 text-purple-50'
      : 'border-transparent text-purple-500 hover:border-purple-900 hover:bg-purple-50 hover:text-purple-900',
  ].join(' ');

const authLinkClassName = ({ isActive }) =>
  [
    'rounded-full border-2 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] transition',
    isActive
      ? 'border-purple-900 bg-purple-900 text-purple-50'
      : 'border-purple-900 bg-purple-50 text-purple-900 hover:bg-purple-900 hover:text-purple-50',
  ].join(' ');

const NavBar = () => {
  const navigate = useNavigate();

  const [token, setToken] = useState(
    localStorage.getItem('token')
  );

  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');

      return savedUser
        ? JSON.parse(savedUser)
        : null;
    } catch {
      return null;
    }
  });

  const isLoggedIn = Boolean(token && user);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    setToken(null);
    setUser(null);

    navigate('/');
  };

  const customerLinks = [
    { label: 'Home', to: '/' },
    { label: 'About', to: '/about' },
    { label: 'Products', to: '/products' },
    { label: 'Cart', to: '/cart' },
    { label: 'Orders', to: '/orders' },
  ];

  const guestLinks = [
    { label: 'Home', to: '/' },
    { label: 'About', to: '/about' },
    { label: 'Products', to: '/products' },
  ];

  const adminLinks = [
    { label: 'Home', to: '/' },
    { label: 'About', to: '/about' },
    { label: 'Products', to: '/products' },
    { label: 'Admin', to: '/admin' },
  ];

  let links = guestLinks;

  if (isLoggedIn && user?.role === 'customer') {
    links = customerLinks;
  }

  if (isLoggedIn && user?.role === 'admin') {
    links = adminLinks;
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b-2 border-purple-900 bg-purple-100/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">

        <NavLink
          to="/"
          className="flex items-center gap-3"
        >
          <img
            src={logo}
            alt="Rushline Apparel"
            className="h-9 w-9 rounded-full border-2 border-purple-900 bg-purple-50 object-contain"
          />

          <p className="text-xl font-bold text-purple-900">
            Rushline Apparel
          </p>
        </NavLink>

        <nav className="hidden items-center gap-2 md:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={navLinkClassName}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <nav className="hidden items-center gap-2 md:flex">

          {!isLoggedIn ? (
            <>
              <NavLink
                to="/auth/signin"
                className={authLinkClassName}
              >
                Sign In
              </NavLink>

              <NavLink
                to="/auth/signup"
                className={authLinkClassName}
              >
                Sign Up
              </NavLink>
            </>
          ) : (
            <>
              <NavLink
                to="/profile"
                className={authLinkClassName}
              >
                Profile
              </NavLink>

              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full border-2 border-purple-900 bg-purple-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-purple-900 transition hover:bg-purple-900 hover:text-purple-50"
              >
                Logout
              </button>
            </>
          )}

        </nav>

      </div>
    </header>
  );
};

export default NavBar;