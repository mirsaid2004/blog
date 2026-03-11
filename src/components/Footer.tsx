"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Github,
  Mail,
  Heart,
  ArrowUp,
  Linkedin,
  Send,
  Instagram,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { useTranslations, useLocale } from "next-intl";
import Logo from "./Logo";

const socialLinks = [
  {
    icon: <Github size={20} />,
    href: "https://github.com/mirsaid2004",
    label: "GitHub",
  },
  {
    icon: <Linkedin size={20} />,
    href: "https://www.linkedin.com/in/mirsaid-mirakhmedov-56a658225/",
    label: "LinkedIn",
  },
  {
    icon: <Mail size={20} />,
    href: "mailto:mir21.07.2004@gmail.com",
    label: "Email",
  },
  {
    icon: <Send size={20} />,
    href: "https://t.me/mirakhmedov_mirsaid",
    label: "Telegram",
  },
  {
    icon: <Instagram size={20} />,
    href: "https://www.instagram.com/mirsaid20045/",
    label: "Instagram",
  },
];

export function Footer() {
  const t = useTranslations("Footer");
  const tNav = useTranslations("Navigation");
  const locale = useLocale();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDownloadResume = () => {
    // Download resume based on locale
    const resumeFiles: Record<string, string> = {
      en: "/cv_en.pdf",
      uz: "/cv_uz.pdf",
      ru: "/cv_ru.pdf",
    };

    const resumeFile = resumeFiles[locale] || resumeFiles.en;

    // Create temporary link and trigger download
    const link = document.createElement("a");
    link.href = resumeFile;
    link.download = `Mirsaid_Mirakhmedov_CV_${locale}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const footerLinks = {
    navigation: [
      { label: tNav("home"), href: "/" },
      { label: tNav("about"), href: "/#about" },
      { label: tNav("work"), href: "/#projects" },
      { label: tNav("contact"), href: "/contact" },
    ],
    resources: [
      {
        label: t("resources.npmPackages"),
        href: "https://www.npmjs.com/~mirsaid_dev",
      },
      { label: t("resources.github"), href: "https://github.com/mirsaid2004" },
      { label: t("resources.blog"), href: "/blog" },
      { label: t("resources.resume"), onClick: handleDownloadResume },
    ],
  };

  return (
    <footer className="relative w-full bg-card/30 dark:bg-card/20 backdrop-blur-xl border-t border-border/50 overflow-hidden px-4 py-16">
      {/* Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Logo className="w-8 h-8" />
                <h3 className="text-2xl font-bold text-foreground">
                  {t("brandName")}
                </h3>
              </div>
              <p className="text-muted-foreground mb-6 max-w-md leading-relaxed">
                {t("brandDescription")}
              </p>

              {/* Social Links */}
              <div className="flex gap-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="w-10 h-10 rounded-full bg-background/50 hover:bg-primary/10 border border-border/50 hover:border-primary/50 flex items-center justify-center text-muted-foreground hover:text-primary transition-all duration-300 hover:scale-110"
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Navigation Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h4 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4">
              {t("navigationTitle")}
            </h4>
            <ul className="space-y-3">
              {footerLinks.navigation.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors duration-300 text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Resources Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h4 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4">
              {t("resourcesTitle")}
            </h4>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.label}>
                  {link.onClick ? (
                    <button
                      onClick={link.onClick}
                      className="text-muted-foreground hover:text-primary transition-colors duration-300 text-sm"
                    >
                      {link.label}
                    </button>
                  ) : (
                    <a
                      href={link.href}
                      target={
                        link.href?.startsWith("http") ? "_blank" : undefined
                      }
                      rel={
                        link.href?.startsWith("http")
                          ? "noopener noreferrer"
                          : undefined
                      }
                      className="text-muted-foreground hover:text-primary transition-colors duration-300 text-sm"
                    >
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-linear-to-r from-transparent via-border/50 to-transparent mb-8" />

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-sm text-muted-foreground flex items-center gap-2"
          >
            © {new Date().getFullYear()} {t("copyright")}{" "}
            <Heart size={14} className="text-primary fill-primary" />{" "}
            {t("using")}
          </motion.p>

          {/* Scroll to Top Button */}
          <motion.button
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            onClick={scrollToTop}
            className="w-10 h-10 rounded-full bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground border border-primary/50 flex items-center justify-center transition-all duration-300 hover:scale-110 group"
            aria-label={t("scrollToTop")}
          >
            <ArrowUp
              size={18}
              className="group-hover:translate-y-[-2px] transition-transform"
            />
          </motion.button>
        </div>
      </div>
    </footer>
  );
}
