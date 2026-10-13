
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/Button';

const inputClasses = 'mt-2 w-full rounded-xl border border-purple-300 bg-purple-100 px-4 py-3 text-sm text-purple-900 outline-none transition placeholder:text-purple-400 focus:border-purple-900 focus:bg-purple-50';
const actionButtonClassName = 'w-full rounded-xl py-3 text-[11px] tracking-[0.2em]';

const SignUpPage = () => {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanContact = contactNumber.trim();
    const cleanAddress = address.trim();

    if (!firstName.trim() || !lastName.trim() || !cleanEmail || !cleanContact || !cleanAddress || !password) {
      setError('Please fill in all fields');
      return;
    }
    if (!/^09\d{9}$/.test(cleanContact)) {
      setError('Enter a valid 11-digit mobile number starting with 09');
      return;
    }
    if (cleanAddress.length < 10) {
      setError('Please enter your complete address');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('https://rushline-apparel-api.onrender.com/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: cleanEmail,
          contactNumber: cleanContact,
          address: cleanAddress,
          password
        })
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || 'Registration failed');
        return;
      }
      if (data.token) localStorage.setItem('token', data.token);
      if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/');
    } catch (error) {
      console.error(error);
      setError('Unable to connect to the server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight text-purple-900 sm:text-4xl">Sign Up</h1>
      <p className="mt-3 text-sm leading-6 text-purple-600">
        Create a Rushline account for faster checkout, order updates, and pickup details.
      </p>
      <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
        {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="first-name" className="text-sm font-medium text-purple-700">First Name</label>
            <input id="first-name" type="text" placeholder="First name" autoComplete="given-name" className={inputClasses} value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
          </div>
          <div>
            <label htmlFor="last-name" className="text-sm font-medium text-purple-700">Last Name</label>
            <input id="last-name" type="text" placeholder="Last name" autoComplete="family-name" className={inputClasses} value={lastName} onChange={(e) => setLastName(e.target.value)} required />
          </div>
        </div>
        <div>
          <label htmlFor="signup-email" className="text-sm font-medium text-purple-700">Email</label>
          <input id="signup-email" type="email" placeholder="user@email.com" autoComplete="email" className={inputClasses} value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="signup-contact" className="text-sm font-medium text-purple-700">Contact Number</label>
          <input
            id="signup-contact"
            type="tel"
            inputMode="numeric"
            placeholder="09XXXXXXXXX"
            autoComplete="tel"
            maxLength={11}
            pattern="09[0-9]{9}"
            title="Enter an 11-digit mobile number starting with 09"
            className={inputClasses}
            value={contactNumber}
            onChange={(e) => setContactNumber(e.target.value.replace(/\D/g, '').slice(0, 11))}
            required
          />
          <p className="mt-2 text-xs text-purple-500">Enter your 11-digit Philippine mobile number.</p>
        </div>
        <div>
          <label htmlFor="signup-address" className="text-sm font-medium text-purple-700">Complete Address</label>
          <textarea
            id="signup-address"
            placeholder="House/Unit No., Street, Barangay, City/Municipality, Province, ZIP Code"
            autoComplete="street-address"
            rows={3}
            className={`${inputClasses} min-h-[110px] resize-y`}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
          />
          <p className="mt-2 text-xs text-purple-500">This address will be used for your customer profile and checkout.</p>
        </div>
        <div>
          <label htmlFor="signup-password" className="text-sm font-medium text-purple-700">Password</label>
          <input id="signup-password" type="password" placeholder="Password" autoComplete="new-password" className={inputClasses} value={password} onChange={(e) => setPassword(e.target.value)} required />
          <p className="mt-2 text-xs leading-5 text-purple-500">Use a secure password with letters, numbers, and symbols.</p>
        </div>
        <Button type="submit" variant="primary" className={actionButtonClassName} disabled={loading}>
          {loading ? 'Creating Account...' : 'Create Account'}
        </Button>
        <div className="grid gap-3 pt-2 sm:grid-cols-2">
          <Button type="button" variant="secondary" className={actionButtonClassName}>Sign Up with Google</Button>
          <Button type="button" variant="secondary" className={actionButtonClassName}>Sign Up with Apple</Button>
        </div>
      </form>
      <div className="mt-8 border-t border-purple-200 pt-6 text-sm text-purple-600">
        Already have an account?{' '}
        <Link to="/auth/signin" className="font-semibold text-purple-900 transition hover:text-purple-600">Log In</Link>
      </div>
    </>
  );
};

export default SignUpPage;
