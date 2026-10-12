import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState({
    username: '',
    display_name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      await register({
        username: form.username,
        display_name: form.display_name,
        email: form.email,
        password: form.password
      });

      navigate('/login', {
        replace: true,
        state: { registered: true }
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Registration failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    {
      name: 'username',
      label: 'Username',
      type: 'text',
      placeholder: 'Choose a username'
    },
    {
      name: 'display_name',
      label: 'Display Name',
      type: 'text',
      placeholder: 'Your display name'
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      placeholder: 'you@example.com'
    },
    {
      name: 'password',
      label: 'Password',
      type: 'password',
      placeholder: 'At least 8 characters'
    },
    {
      name: 'confirmPassword',
      label: 'Confirm Password',
      type: 'password',
      placeholder: 'Confirm your password'
    }
  ];

  return (
    <div className="flex min-h-[85vh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#171725] p-8 shadow-2xl">
        <div className="mb-7 text-center">
          <h1 className="text-3xl font-bold">
            Create Account
          </h1>
          <p className="mt-2 text-gray-400">
            Begin your own visual novel journey.
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map((field) => (
            <div key={field.name}>
              <label className="mb-2 block text-sm text-gray-300">
                {field.label}
              </label>

              <input
                type={field.type}
                name={field.name}
                value={form[field.name]}
                onChange={handleChange}
                required={field.name !== 'display_name'}
                minLength={
                  field.name === 'password' ? 8 : undefined
                }
                placeholder={field.placeholder}
                className="w-full rounded-lg border border-white/10 bg-[#0e0e18] px-4 py-3 text-white outline-none focus:border-purple-500"
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-purple-600 py-3 font-semibold text-white hover:bg-purple-500 disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="text-purple-400">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}