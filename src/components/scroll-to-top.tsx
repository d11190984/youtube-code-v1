"use client";

import { useState, useEffect } from "react";

export const ScrollToTopButton = () => {
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowButton(window.scrollY > 300);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!showButton) return null;

  return (
    <div className="fixed bottom-8 right-8 cursor-pointer hover:scale-125 transition-transform">
      <img
        src="/toTop.Cuiv4RfP.svg"
        alt="Lên đầu"
        className="w-20 h-20" // tăng kích thước icon
        onClick={scrollToTop}
      />
    </div>
  );
};
