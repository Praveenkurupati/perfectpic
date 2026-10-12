import { redirect } from 'next/navigation';

export default async function TrackPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const orderId = params.order || params.id || params.search;
  if (orderId) {
    redirect(`/orders?order=${encodeURIComponent(String(orderId))}`);
  }
  redirect('/orders');
}
