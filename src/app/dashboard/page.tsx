import { getCurrentUser } from "@/server/users";
import { Header } from "@/components/newsletter/header";
import { NewsletterGenerator } from "@/components/newsletter/newsletter-generator";

export default async function DashboardPage() {
  const { user } = await getCurrentUser();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <Header userName={user.name} />
      <main className="container mx-auto max-w-2xl px-4 py-12">
        <NewsletterGenerator />
      </main>
    </div>
  );
}
