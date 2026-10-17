"use client";
import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export default function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggle = () => setIsVisible(window.scrollY > 320);
    window.addEventListener("scroll", toggle, { passive: true });
    return () => window.removeEventListener("scroll", toggle);
  }, []);

  return (
    <>
      {isVisible && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-5 z-50 w-11 h-11 bg-[#15274D] text-white flex items-center justify-center border border-[#FFC000]/50 shadow-lg hover:bg-[#0f1f3a] transition-colors"
          type="button"
          aria-label="Retour en haut"
        >
          {/* Animated corner accent */}
          <span className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-[#FFC000]" />
          <span className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-[#FFC000]" />
          <ArrowUp className="w-4 h-4 relative z-10" />
        </button>
      )}
    </>
  );
}
