import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function RootPage() {
  // Check if user is authenticated
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken');
  
  if (token) {
    redirect('/dashboard');
  }
  
  // Show landing page for non-authenticated users
  redirect('/home');
}
