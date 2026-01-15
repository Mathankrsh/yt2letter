import { redirect } from "next/navigation";
import { getOptionalUser } from "@/server/users";

export default async function HomePage() {
  const session = await getOptionalUser();

  if (session?.user) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}
