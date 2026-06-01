import { PageProps } from "$fresh/server.ts";

export default function NotFound({ url }: PageProps) {
  return (
    <div class="flex flex-col items-center justify-center min-h-screen">
      <h1 class="text-4xl font-bold mb-4">404</h1>
      <p class="text-gray-500">{url.pathname} not found</p>
      <a href="/login" class="mt-8 text-blue-500 hover:underline">Login</a>
    </div>
  );
}
