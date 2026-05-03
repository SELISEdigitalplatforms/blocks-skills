"use client";

import { Shield, Globe, Brain, Database, Activity, Workflow } from "lucide-react";
import { motion } from "framer-motion";

const foundations = [
  {
    icon: Shield,
    title: "Identity",
    description: "Secure authentication and user management with enterprise-grade security",
  },
  {
    icon: Globe,
    title: "Localization",
    description: "Multi-language support with real-time translation and locale-specific formatting",
  },
  {
    icon: Brain,
    title: "AI & Analytics",
    description: "Built-in ML models and analytics dashboards for data-driven decisions",
  },
  {
    icon: Database,
    title: "Data Platform",
    description: "Unified data layer with real-time sync across all your services",
  },
  {
    icon: Activity,
    title: "Observability",
    description: "End-to-end monitoring, logging, and alerting for complete visibility",
  },
  {
    icon: Workflow,
    title: "Workflows",
    description: "Visual workflow builder for automating complex business processes",
  },
];

export default function SixFoundationsSection() {
  return (
    <section className="py-20 md:py-28 bg-neutral-950">
      <div className="container z-10 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="flex flex-col items-center justify-center"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tighter text-white text-center">
            Six Foundations
          </h2>
          <p className="text-white/50 text-lg md:text-xl tracking-tighter mt-5 text-center">
            Open Source Enterprise Cloud OS — every pillar you need to run production-grade applications.
          </p>
        </motion.div>

        <div className="flex justify-center mt-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {foundations.map((foundation, index) => (
              <motion.div
                key={foundation.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="group relative rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 hover:border-white/20 hover:bg-white/[0.06] transition-all duration-300 cursor-pointer">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full bg-white/5 blur-2xl opacity-0 group-hover:opacity-50 transition-all duration-500" />

                  <div className="relative z-10 flex flex-col items-start gap-4">
                    <div className="p-3 rounded-xl bg-white/10 border border-white/10 group-hover:bg-white/15 transition-colors">
                      <foundation.icon className="size-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{foundation.title}</h3>
                      <p className="text-sm text-white/50 mt-1">
                        {foundation.description}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
