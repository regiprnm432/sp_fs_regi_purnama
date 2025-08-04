"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    // Panggil API untuk menghapus cookie token
    await fetch("/api/auth/logout", { method: "POST" });
    
    // Arahkan pengguna kembali ke halaman login dan segarkan state
    router.push("/login");
    router.refresh();
  };

  return (
    <Button variant="outline" onClick={handleLogout}>
      Logout
    </Button>
  );
}
