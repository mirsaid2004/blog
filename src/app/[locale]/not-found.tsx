"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { motion } from "framer-motion";
import { Home, AlertCircle } from "lucide-react";

export default function NotFound() {
  const t = useTranslations("NotFound");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-dot-pattern px-6">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative inline-block"
        >
          <h1 className="text-[150px] md:text-[200px] font-black leading-none text-transparent bg-clip-text bg-gradient-to-b from-primary to-transparent opacity-80 select-none">
            404
          </h1>
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <AlertCircle size={60} className="opacity-50" />
          </motion.div>
        </motion.div>

        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-3xl md:text-5xl font-bold text-foreground mb-4"
        >
          {t("subtitle")}
        </motion.h2>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-muted-foreground text-lg mb-8 max-w-md mx-auto"
        >
          {t("description")}
        </motion.p>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-primary text-primary-foreground font-bold text-sm uppercase tracking-wider shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-105 transition-all duration-300"
          >
            <Home size={18} />
            {t("backHome")}
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
