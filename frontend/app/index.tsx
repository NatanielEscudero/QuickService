import { Redirect } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import LoadingScreen from './common/loading';

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Redirect href={'/auth/login' as any} />;
  }

  if (user.role === 'client') {
    return <Redirect href={'/client' as any} />;
  } else if (user.role === 'worker') {
    return <Redirect href={'/worker' as any} />;
  }

  return <Redirect href={'/auth/login' as any} />;
}