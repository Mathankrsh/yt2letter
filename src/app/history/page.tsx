import { getUserNewsletters } from "@/server/newsletters";
import { getCurrentUser } from "@/server/users";
import { Header } from "@/components/newsletter/header";
import { HistoryList } from "@/components/newsletter/history-list";

export default async function HistoryPage() {
  const { user } = await getCurrentUser();
  const newsletters = await getUserNewsletters();

  return (
    <div className="min-h-screen bg-background">
      <Header userName={user.name} />
      <main className="container mx-auto max-w-4xl px-4 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Your Newsletters
            </h1>
            <p className="text-muted-foreground mt-1">
              View and manage your generated newsletters
            </p>
          </div>
          
          <HistoryList newsletters={newsletters} />
        </div>
      </main>
    </div>
  );
}
