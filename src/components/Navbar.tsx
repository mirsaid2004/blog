"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter, Link } from "@/i18n/routing";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import { Moon, Sun, Globe, Menu, X } from "lucide-react";
import Logo from "./Logo";
import { cn } from "@/lib/utils";
import { useMounted } from "@/lib/use-mounted";
import { Locale } from "next-intl";
import { LANGUAGES_LIST } from "@/constants/langs";

const navItems: Array<{
  name: "home" | "articles" | "posts" | "serieses";
  href: string;
}> = [
    { name: "home", href: "/" },
    { name: "articles", href: "/articles" },
    { name: "posts", href: "/posts" },
    { name: "serieses", href: "/serieses" },
  ];

export function Navbar() {
  const { resolvedTheme } = useTheme();
  const t = useTranslations();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setScrolled(scrollY > 20);
      setIsAtTop(scrollY < 50);
    };
    handleScroll(); // Initial check
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when route changes
  const pathname = usePathname();
  const [menuPathname, setMenuPathname] = useState(pathname);
  if (pathname !== menuPathname) {
    setMenuPathname(pathname);
    setIsMobileMenuOpen(false);
  }

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  const isActiveLink = (href: string) => {
    return pathname === href;
  };

  return (
    <>
      <motion.header
        className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-4xl rounded-full border transition-all duration-500 ease-out ${scrolled
            ? "backdrop-blur-xl border-white/20 shadow-xl py-3 px-6"
            : "bg-white/5 dark:bg-black/5 backdrop-blur-sm border-white/10 py-4 px-6"
          }`}
        initial={{ y: -100, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{
          duration: 1,
          ease: [0.25, 0.46, 0.45, 0.94],
          opacity: { duration: 0.6 },
          scale: { duration: 0.8, ease: [0.34, 1.56, 0.64, 1] },
        }}
      >
        <div className="flex items-center justify-between text-foreground">
          {/* Logo */}
          {/* <Link
            href="/"
            className="relative flex items-center hover:opacity-70 transition-opacity duration-300 min-w-[100px]"
          > */}
          <div className="relative flex items-center">
            <motion.div
              layout
              className={cn(
                "flex flex-col items-center transition-all duration-500 ease-out w-fit h-fit"
              )}
              transition={{
                layout: {
                  duration: 0.5,
                  ease: [0.34, 1.56, 0.64, 1], // Bouncy easing
                },
              }}
            >
              <motion.div
                animate={{
                  scale: isAtTop ? 1 : 0.9,
                  rotate: isAtTop ? 0 : 360,
                }}
                transition={{
                  duration: 0.6,
                  ease: [0.34, 1.56, 0.64, 1],
                  rotate: { duration: 0.8 },
                }}
              >
                <Logo
                  height={isAtTop ? 50 : 40}
                  width={isAtTop ? 50 : 40}
                  className="transition-all duration-500 ease-out flex-shrink-0"
                />
              </motion.div>

              <motion.div
                animate={{
                  height: isAtTop ? "auto" : 0,
                  opacity: isAtTop ? 1 : 0,
                  y: isAtTop ? 0 : -10,
                }}
                transition={{
                  duration: 0.4,
                  ease: [0.25, 0.46, 0.45, 0.94],
                  opacity: { duration: 0.3 },
                }}
                className="overflow-hidden"
              >
                <h4 className="text-base font-bold tracking-tight whitespace-nowrap">
                  M_DEV{" "}
                </h4>
              </motion.div>
            </motion.div>

            <motion.div
              animate={{
                width: !isAtTop ? "auto" : 0,
                opacity: !isAtTop ? 1 : 0,
                x: !isAtTop ? 0 : -20,
              }}
              transition={{
                duration: 0.4,
                ease: [0.25, 0.46, 0.45, 0.94],
                opacity: { duration: 0.3, delay: !isAtTop ? 0.1 : 0 },
              }}
              className="overflow-hidden"
            >
              <h4 className="text-base font-bold tracking-tight whitespace-nowrap">
                M_DEV <sup className="text-[10px]">BLOG</sup>
              </h4>
            </motion.div>
          </div>
          {/* </Link> */}

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1 bg-white/5 dark:bg-black/5 rounded-full px-2 py-1 border border-white/5">
            {navItems.map((item, index) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative px-4 py-2 text-sm font-medium transition-colors",
                  isActiveLink(item.href) && "text-primary"
                )}
                onMouseEnter={() => {
                  if (timeoutRef.current) clearTimeout(timeoutRef.current);
                  setHoveredIndex(index);
                }}
                onMouseLeave={() => {
                  timeoutRef.current = setTimeout(() => {
                    setHoveredIndex(null);
                  }, 50);
                }}
              >
                <span className="relative z-10">{t(item.name)}</span>
                {hoveredIndex === index && (
                  <motion.div
                    className={cn("absolute inset-0 rounded-full")}
                    layoutId="navbarhub-hover"
                    style={{
                      backgroundColor:
                        resolvedTheme === "dark" ? "#333" : "#ccc",
                    }}
                    transition={{
                      type: "spring",
                      bounce: 0.3,
                      duration: 0.6,
                    }}
                  />
                )}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-full bg-background/50 hover:bg-background border border-border/50 hover:border-primary/50 transition-all duration-300"
            aria-label="Toggle Menu"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={isMobileMenuOpen ? "close" : "open"}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </motion.div>
            </AnimatePresence>
          </button>
        </div>
      </motion.header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-[80%] max-w-sm bg-background border-l border-border shadow-2xl z-50 md:hidden overflow-y-auto"
            >
              <div className="flex flex-col h-full p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2">
                    <Logo height={40} width={40} />
                    <span className="text-lg font-bold">M_DEV</span>
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 rounded-full hover:bg-muted transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* Navigation Links */}
                <nav className="flex flex-col gap-2 mb-8">
                  {navItems.map((item, index) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="px-4 py-3 rounded-xl text-base font-medium hover:bg-primary/10 hover:text-primary transition-all duration-200"
                    >
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        {t(item.name)}
                      </motion.div>
                    </Link>
                  ))}
                </nav>

                {/* Divider */}
                <div className="border-t border-border my-4" />

                {/* Language Switcher */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-4">
                    Language
                  </h3>
                  <MobileLanguageSwitcher />
                </div>

                {/* Theme Toggle */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-4">
                    Theme
                  </h3>
                  <MobileThemeToggle />
                </div>

                {/* Footer */}
                <div className="mt-auto pt-6 border-t border-border">
                  <p className="text-xs text-muted-foreground text-center">
                    © 2026 Mirsaid Mirakhmedov
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const mounted = useMounted();

  if (!mounted) return <div className="w-8 h-8" />;

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative w-9 h-9 flex items-center justify-center rounded-full bg-background/50 hover:bg-background border border-border/50 hover:border-primary/50 transition-all duration-300 hover:scale-110 shadow-sm hover:shadow-lg"
      aria-label="Toggle Theme"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={isDark ? "dark" : "light"}
          initial={{ rotate: -90, scale: 0 }}
          animate={{ rotate: 0, scale: 1 }}
          exit={{ rotate: 90, scale: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="absolute text-foreground"
        >
          {isDark ? <Moon size={18} /> : <Sun size={18} />}
        </motion.div>
      </AnimatePresence>
    </button>
  );
}

function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const switchLocale = (newLocale: Locale) => {
    router.replace(pathname, { locale: newLocale });
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full bg-background/50 hover:bg-background border border-border/50 hover:border-primary/50 transition-all duration-300 hover:scale-105 shadow-sm hover:shadow-lg"
      >
        <Globe size={16} className="text-foreground" />
        <span className="uppercase text-foreground">{locale}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-32 bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl overflow-hidden py-1 z-50"
          >
            {LANGUAGES_LIST.map((l) => (
              <button
                key={l}
                onClick={() => switchLocale(l)}
                className={`w-full text-left px-4 py-2.5 text-sm transition-all duration-200 ${locale === l
                    ? "font-bold text-primary bg-primary/10"
                    : "text-foreground hover:bg-primary/5 hover:text-primary"
                  }`}
              >
                {l === "en" ? "English" : l === "uz" ? "O'zbek" : "Русский"}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MobileLanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  const switchLocale = (newLocale: Locale) => {
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <div className="flex flex-col gap-2">
      {LANGUAGES_LIST.map((l) => (
        <button
          key={l}
          onClick={() => switchLocale(l)}
          className={cn(
            "px-4 py-3 rounded-xl text-left transition-all duration-200",
            locale === l
              ? "bg-primary/20 text-primary font-bold border border-primary/30"
              : "hover:bg-muted text-foreground"
          )}
        >
          <div className="flex items-center gap-3">
            <Globe size={18} />
            <span>
              {l === "en" ? "English" : l === "uz" ? "O'zbek" : "Русский"}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}

function MobileThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const mounted = useMounted();

  if (!mounted) return null;

  const isDark = resolvedTheme === "dark";

  return (
    <div className="flex gap-2">
      <button
        onClick={() => setTheme("light")}
        className={cn(
          "flex-1 px-4 py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2",
          !isDark
            ? "bg-primary/20 text-primary font-bold border border-primary/30"
            : "hover:bg-muted text-foreground"
        )}
      >
        <Sun size={18} />
        <span>Light</span>
      </button>
      <button
        onClick={() => setTheme("dark")}
        className={cn(
          "flex-1 px-4 py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2",
          isDark
            ? "bg-primary/20 text-primary font-bold border border-primary/30"
            : "hover:bg-muted text-foreground"
        )}
      >
        <Moon size={18} />
        <span>Dark</span>
      </button>
    </div>
  );
}
