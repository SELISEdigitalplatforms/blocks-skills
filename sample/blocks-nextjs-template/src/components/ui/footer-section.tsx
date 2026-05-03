"use client";
import React from "react";
import type { ComponentProps, ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Frame } from "lucide-react";

const socialLinks = [
  {
    title: "Twitter",
    href: "https://x.com/seliseblocks",
    icon: (
      <svg className="size-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.91-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    title: "LinkedIn",
    href: "https://linkedin.com/company/selise-group",
    icon: (
      <svg className="size-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    title: "GitHub",
    href: "https://github.com/SELISEdigitalplatforms",
    icon: (
      <svg className="size-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
      </svg>
    ),
  },
];

export function Footer() {
  const footerLinks = [
    {
      label: "Product",
      links: [
        { title: "Features", href: "#features" },
        { title: "Pricing", href: "#pricing" },
        { title: "Changelog", href: "https://docs.seliseblocks.com/changelog" },
        { title: "Roadmap", href: "https://github.com/SELISEdigitalplatforms/blocks-website-next/projects" },
      ],
    },
    {
      label: "Resources",
      links: [
        { title: "Documentation", href: "https://docs.seliseblocks.com" },
        { title: "API Reference", href: "https://docs.seliseblocks.com/api" },
        { title: "Guides", href: "https://docs.seliseblocks.com/guides" },
        { title: "Support", href: "https://selisegroup.com/contact-us" },
      ],
    },
    {
      label: "Company",
      links: [
        { title: "About", href: "https://selisegroup.com/about-us" },
        { title: "Careers", href: "https://selisegroup.com/about-us#selise-career" },
        { title: "Contact", href: "https://selisegroup.com/contact-us" },
      ],
    },
    {
      label: "Legal",
      links: [
        { title: "Privacy", href: "https://selisegroup.com/privacy-policy/" },
        { title: "Terms", href: "https://selisegroup.com/software-development-terms/" },
        { title: "Security", href: "https://docs.seliseblocks.com/security" },
      ],
    },
  ];

  return (
    <footer className="relative w-full max-w-6xl mx-auto flex flex-col items-center justify-center rounded-t-xl border-t border-white/10 bg-neutral-950 px-6 py-12 lg:py-16">
      <div className="bg-white/5 absolute top-0 right-1/2 left-1/2 h-px w-1/3 -translate-x-1/2 -translate-y-1/2 rounded-full blur" />

      <div className="grid w-full gap-8 xl:grid-cols-3 xl:gap-8">
        <AnimatedContainer className="space-y-4">
          <Frame className="size-8 text-white" />
          <p className="text-white/40 mt-8 text-sm md:mt-0">
            © {new Date().getFullYear()} Selise Blocks. All rights reserved.
          </p>
          <p className="text-white/40 text-sm">Open Source Enterprise Cloud OS</p>
          <div className="flex items-center gap-3 mt-2">
            {socialLinks.map((link) => (
              <a
                key={link.title}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/40 hover:text-white transition-colors duration-300"
                aria-label={link.title}
              >
                {link.icon}
              </a>
            ))}
          </div>
        </AnimatedContainer>

        <div className="mt-10 grid grid-cols-2 gap-8 md:grid-cols-4 xl:col-span-2 xl:mt-0">
          {footerLinks.map((section, index) => (
            <AnimatedContainer key={section.label} delay={0.1 + index * 0.1}>
              <div className="mb-10 md:mb-0">
                <h3 className="text-xs font-medium text-white/60">{section.label}</h3>
                <ul className="text-white/40 mt-4 space-y-2 text-sm">
                  {section.links.map((link) => (
                    <li key={link.title}>
                      <a
                        href={link.href}
                        target={link.href.startsWith("http") ? "_blank" : undefined}
                        rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
                        className="hover:text-white transition-all duration-300"
                      >
                        {link.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </AnimatedContainer>
          ))}
        </div>
      </div>
    </footer>
  );
}

type ViewAnimationProps = {
  delay?: number;
  className?: ComponentProps<typeof motion.div>["className"];
  children: ReactNode;
};

function AnimatedContainer({
  className,
  delay = 0.1,
  children,
}: ViewAnimationProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return children;
  }

  return (
    <motion.div
      initial={{ filter: "blur(4px)", translateY: -8, opacity: 0 }}
      whileInView={{ filter: "blur(0px)", translateY: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.8 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
