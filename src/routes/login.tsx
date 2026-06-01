import { Handlers } from "$fresh/server.ts";
import { checkToken } from "../lib/auth.ts";

export const handler: Handlers = {
  GET() {
    return renderPage(null);
  },

  async POST(req) {
    const form = await req.formData();
    const token = form.get("token") as string | null;
    if (!token || !checkToken(token)) {
      if (!token || token === "") {
        return new Response(null, { status: 400 });
      }
      return renderPage("Invalid token");
    }

    return new Response(null, {
      status: 303,
      headers: {
        Location: "/",
        "Set-Cookie": `token=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/`,
      },
    });
  },
};

function renderPage(error: string | null): Response {
  return new Response(
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login — Slaytester 2</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body class="min-h-screen flex items-center justify-center bg-gray-50">
  <div class="bg-white p-8 rounded-2xl shadow-sm border max-w-sm w-full">
    <h1 class="text-2xl font-bold text-center mb-6">Slaytester 2</h1>
    ${error ? `<p class="text-red-500 text-sm text-center mb-4">${error}</p>` : ""}
    <form method="POST" class="flex flex-col gap-4">
      <input
        type="password"
        name="token"
        placeholder="Admin Token"
        required
        class="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-gray-500"
      />
      <button
        type="submit"
        class="bg-black text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-800"
      >
        Login
      </button>
    </form>
  </div>
</body>
</html>`,
    {
      status: error ? 200 : 200,
      headers: { "Content-Type": "text/html" },
    },
  );
}
