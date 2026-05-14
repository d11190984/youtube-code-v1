"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/routing";

const Page = () => {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin?tab=reports");
  }, [router]);

  return null;
};

export default Page;
