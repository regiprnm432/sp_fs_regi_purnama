"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";

// Fungsi untuk membaca cookie di sisi client
function getCookie(name: string): string | undefined {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
}

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Cek status login saat komponen dimuat di client
  useEffect(() => {
    const token = getCookie("token");
    setIsLoggedIn(!!token);
  }, [pathname]); // Cek ulang setiap kali path berubah

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setIsLoggedIn(false);
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="bg-gray-100 dark:bg-gray-900 border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link href={isLoggedIn ? "/dashboard" : "/"} className="font-bold text-lg">
          ProjectManager
        </Link>
        {isLoggedIn && (
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        )}
      </div>
    </header>
  );
}
