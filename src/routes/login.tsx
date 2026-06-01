import { checkToken } from "../lib/auth.ts";
import { PageLayout } from "../components/PageLayout.tsx";
import { Card } from "../components/Card.tsx";
import { Heading } from "../components/Heading.tsx";
import { Input } from "../components/Input.tsx";
import { Button } from "../components/Button.tsx";

export function LoginPage({ error }: { error: string | null }) {
  return (
    <PageLayout>
      <Card>
        <Heading>Slaytester 2</Heading>
        {error && (
          <p class="text-red-500 text-sm text-center mb-4">{error}</p>
        )}
        <form method="POST" class="flex flex-col gap-4">
          <Input type="password" name="token" placeholder="Admin Token" required />
          <Button type="submit">Login</Button>
        </form>
      </Card>
    </PageLayout>
  );
}

export const handler = {
  GET(ctx: any) {
    return ctx.render(<LoginPage error={null} />);
  },

  async POST(ctx: any) {
    const form = await ctx.req.formData();
    const token = form.get("token") as string | null;
    if (!token || !checkToken(token)) {
      if (!token || token === "") {
        return new Response(null, { status: 400 });
      }
      return ctx.render(<LoginPage error="Invalid token" />);
    }

    return new Response(null, {
      status: 303,
      headers: {
        Location: "/",
        "Set-Cookie": `token=${
          encodeURIComponent(token)
        }; HttpOnly; SameSite=Lax; Path=/`,
      },
    });
  },
};
