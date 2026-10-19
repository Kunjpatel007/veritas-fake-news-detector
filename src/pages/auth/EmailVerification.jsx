import { Navigate } from 'react-router-dom';

export default function EmailVerification() {
  return <Navigate to='/member/login' replace />;
}
