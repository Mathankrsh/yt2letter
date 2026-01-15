import { LoginForm } from "@/components/auth/login-form";
import { Mail } from "lucide-react";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 rounded-xl bg-primary p-3 w-fit">
          <Mail className="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Newsletter Generator</h1>
        <p className="mt-2 text-muted-foreground max-w-sm">
          Transform YouTube videos into engaging email newsletters with AI
        </p>
      </div>
      <LoginForm />
    </main>
  );
}
