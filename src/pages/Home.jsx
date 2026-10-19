import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

export const route = { path: '/', layout: 'public', access: 'public' };

export default function Home() {
  const user = useSelector((s) => s.user.user);

  const destination = user?.Id
    ? user.profile === 'Admin_c' ? '/admin' : '/home'
    : '/check';

  return <Navigate to={destination} replace />;
}
