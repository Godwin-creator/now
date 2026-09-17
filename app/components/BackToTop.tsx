"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp } from "lucide-react";

export default function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggle = () => setIsVisible(window.scrollY > 320);
    window.addEventListener("scroll", toggle, { passive: true });
    return () => window.removeEventListener("scroll", toggle);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.7, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.7, y: 16 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.93 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-5 z-50 w-11 h-11 bg-[#1E4D2B] text-white flex items-center justify-center border border-[#F3B229]/50 shadow-lg hover:bg-[#14361e] transition-colors"
          style={{ outline: 'none' }}
          aria-label="Retour en haut"
        >
          {/* Animated corner accent */}
          <span className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-[#F3B229]" />
          <span className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-[#F3B229]" />
          <ArrowUp className="w-4 h-4 relative z-10" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}