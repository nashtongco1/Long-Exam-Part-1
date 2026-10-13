
import { useEffect, useState } from 'react';
import Button from '../../components/Button.jsx';

const inputClasses = 'mt-2 w-full rounded-xl border border-purple-300 bg-purple-100 px-4 py-3 text-sm text-purple-900 outline-none transition placeholder:text-purple-400 focus:border-purple-900 focus:bg-purple-50 disabled:cursor-not-allowed disabled:bg-purple-50 disabled:text-purple-500';

const getProfile = (data) => {
  if (Array.isArray(data?.data)) return data.data[0] || null;
  if (data?.data && typeof data.data === 'object') return data.data;
  if (data?.user && typeof data.user === 'object') return data.user;
  return null;
};

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [address, setAddress] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [profileMessage, setProfileMessage] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');

  const applyProfile = (profile) => {
    setUser(profile);
    setName(profile.name || '');
    setEmail(profile.email || '');
    setContactNumber(profile.contactNumber || '');
    setAddress(profile.address || '');
  };

  const fetchProfile = async () => {
    if (!token) {
      setError('Please log in first');
      return;
    }
    try {
      setError('');
      const response = await fetch('https://rushline-apparel-api.onrender.com/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || 'Unable to load profile');
        return;
      }
      const profile = getProfile(data);
      if (!profile) {
        setError('Profile information was not found');
        return;
      }
      applyProfile(profile);
    } catch (error) {
      console.error(error);
      setError('Unable to connect to the server');
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleEditProfile = () => {
    setProfileMessage('');
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setContactNumber(user.contactNumber || '');
      setAddress(user.address || '');
    }
    setProfileMessage('');
    setIsEditing(false);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileMessage('');
    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanContact = contactNumber.trim();
    const cleanAddress = address.trim();

    if (!cleanName || !cleanEmail || !cleanContact || !cleanAddress) {
      setProfileMessage('Please fill in all profile fields');
      return;
    }
    if (!/^09\d{9}$/.test(cleanContact)) {
      setProfileMessage('Enter a valid 11-digit contact number starting with 09');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('https://rushline-apparel-api.onrender.com/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: cleanName,
          email: cleanEmail,
          contactNumber: cleanContact,
          address: cleanAddress
        })
      });
      const data = await response.json();
      if (!response.ok) {
        setProfileMessage(data.message || 'Unable to update profile');
        return;
      }
      const updatedUser = getProfile(data);
      if (!updatedUser) {
        setProfileMessage('Unable to read updated profile');
        return;
      }
      applyProfile(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setIsEditing(false);
      setProfileMessage('Profile information saved successfully');
    } catch (error) {
      console.error(error);
      setProfileMessage('Unable to connect to the server');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMessage('');
    if (!currentPassword || !newPassword) {
      setPasswordMessage('Please fill in all password fields');
      return;
    }
    try {
      const response = await fetch('https://rushline-apparel-api.onrender.com/api/users/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await response.json();
      if (!response.ok) {
        setPasswordMessage(data.message || 'Unable to change password');
        return;
      }
      setCurrentPassword('');
      setNewPassword('');
      setPasswordMessage('Password changed successfully');
    } catch (error) {
      console.error(error);
      setPasswordMessage('Unable to connect to the server');
    }
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <section className="border-y-2 border-purple-900 bg-purple-50 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-purple-500">Customer Account</p>
          <h1 className="text-3xl font-bold leading-tight text-purple-900 sm:text-4xl">My Profile</h1>
          <div className="mt-6">
            <Button to="/">Back Home</Button>
          </div>
        </div>
      </section>

      <section className="border-y-2 border-purple-900 bg-purple-50 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto max-w-3xl">
          {error && <p className="text-sm text-red-600">{error}</p>}
          {user && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-2xl font-semibold text-purple-900">Profile Information</h2>
                {!isEditing && (
                  <Button type="button" variant="primary" onClick={handleEditProfile}>
                    Edit Profile
                  </Button>
                )}
              </div>
              <form className="mt-6 space-y-5" onSubmit={handleUpdateProfile}>
                <div>
                  <label className="text-sm font-medium text-purple-700">Name</label>
                  <input type="text" className={inputClasses} value={name} onChange={(e) => setName(e.target.value)} disabled={!isEditing || saving} required />
                </div>
                <div>
                  <label className="text-sm font-medium text-purple-700">Email</label>
                  <input type="email" className={inputClasses} value={email} onChange={(e) => setEmail(e.target.value)} disabled={!isEditing || saving} required />
                </div>
                <div>
                  <label className="text-sm font-medium text-purple-700">Contact Number</label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    placeholder="09XXXXXXXXX"
                    maxLength={11}
                    pattern="09[0-9]{9}"
                    className={inputClasses}
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value.replace(/\D/g, '').slice(0, 11))}
                    disabled={!isEditing || saving}
                    required
                  />
                  <p className="mt-2 text-xs text-purple-500">Your 11-digit mobile number registered with your account.</p>
                </div>
                <div className="rounded-2xl border border-purple-300 bg-purple-100/60 p-5">
                  <h3 className="text-lg font-semibold text-purple-900">Address</h3>
                  <textarea
                    id="shippingAddress"
                    className={`${inputClasses} min-h-[110px] resize-y`}
                    placeholder="House/Unit No., Street, Barangay, City/Municipality, Province, ZIP Code"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    disabled={!isEditing || saving}
                    rows={3}
                    required
                  />
                  <p className="mt-2 text-xs text-purple-500">Include your house or unit number, street, barangay, city, province, and ZIP code.</p>
                </div>
                <div>
                  <p className="text-sm text-purple-600">Role: {user.role}</p>
                </div>
                {isEditing && (
                  <div className="flex flex-wrap gap-3">
                    <Button type="submit" variant="primary" disabled={saving}>
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button type="button" onClick={handleCancelEdit} disabled={saving}>
                      Cancel
                    </Button>
                  </div>
                )}
                {profileMessage && <p className="text-sm font-medium text-purple-700">{profileMessage}</p>}
              </form>
            </>
          )}
        </div>
      </section>

      <section className="border-y-2 border-purple-900 bg-purple-50 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-semibold text-purple-900">Change Password</h2>
          <form className="mt-6 space-y-5" onSubmit={handleChangePassword}>
            <div>
              <label className="text-sm font-medium text-purple-700">Current Password</label>
              <input type="password" className={inputClasses} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
            </div>
            <div>
              <label className="text-sm font-medium text-purple-700">New Password</label>
              <input type="password" className={inputClasses} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
            </div>
            <Button type="submit" variant="primary">Change Password</Button>
            {passwordMessage && <p className="text-sm text-purple-700">{passwordMessage}</p>}
          </form>
        </div>
      </section>
    </div>
  );
};

export default ProfilePage;
