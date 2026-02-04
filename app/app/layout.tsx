import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }

  // Let the page handle workspace logic
  return <>{children}</>;
}
