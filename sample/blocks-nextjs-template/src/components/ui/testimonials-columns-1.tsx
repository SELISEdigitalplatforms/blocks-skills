"use client";
import React from "react";
import Image from "next/image";
import { motion } from "motion/react";

export const TestimonialsColumn = (props: {
  className?: string;
  testimonials: typeof testimonials;
  duration?: number;
}) => {
  return (
    <div className={props.className}>
      <motion.div
        animate={{
          translateY: "-50%",
        }}
        transition={{
          duration: props.duration || 10,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-6 pb-6"
      >
        {[
          ...new Array(2).fill(0).map((_, index) => (
            <React.Fragment key={index}>
              {props.testimonials.map(({ text, image, name, role }) => (
                <div className="p-8 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-2xl max-w-xs w-full hover:border-white/20 hover:bg-white/[0.05] transition-all duration-300" key={name}>
                  <div className="text-white/70 text-sm leading-relaxed">{text}</div>
                  <div className="flex items-center gap-3 mt-6">
                    <Image
                      width={40}
                      height={40}
                      src={image}
                      alt={name}
                      className="h-10 w-10 rounded-full border border-white/20"
                    />
                    <div className="flex flex-col">
                      <div className="font-medium tracking-tight leading-5 text-white">{name}</div>
                      <div className="leading-5 text-white/40 tracking-tight text-sm">{role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </React.Fragment>
          )),
        ]}
      </motion.div>
    </div>
  );
};


const testimonials = [
  {
    text: "We cut our infrastructure setup from 3 weeks to a single afternoon. Blocks gave us enterprise-grade auth and observability on day one.",
    image: "https://randomuser.me/api/portraits/men/32.jpg",
    name: "Marcus Chen",
    role: "CTO, FinTech Startup",
  },
  {
    text: "Managing multi-language support across 12 markets used to require a full-time team. Blocks' AI localization handles it automatically.",
    image: "https://randomuser.me/api/portraits/women/44.jpg",
    name: "Sarah Lindqvist",
    role: "IT Director, Healthcare SaaS",
  },
  {
    text: "The Git-based deployment pipeline with built-in SCA and SAST scanning changed how we ship. Every commit is now production-ready.",
    image: "https://randomuser.me/api/portraits/men/75.jpg",
    name: "Daniel Okonkwo",
    role: "DevOps Lead, E-commerce Platform",
  },
  {
    text: "Our team focuses on domain logic now. All the infrastructure complexity — identity, storage, monitoring — just works out of the box.",
    image: "https://randomuser.me/api/portraits/women/68.jpg",
    name: "Priya Sharma",
    role: "VP Engineering, Logistics Co.",
  },
  {
    text: "Blocks workflows let our business analysts automate processes without touching code. That's cut our sprint backlog by 30%.",
    image: "https://randomuser.me/api/portraits/men/46.jpg",
    name: "James Whitfield",
    role: "Product Manager, B2B SaaS",
  },
  {
    text: "The GraphQL data gateway alone saved us 6 weeks of backend work. Instant APIs over our existing schemas.",
    image: "https://randomuser.me/api/portraits/women/21.jpg",
    name: "Ananya Patel",
    role: "Lead Developer, Insurance Tech",
  },
  {
    text: "Observability from day one meant we caught a performance issue in production before our first user did. That's unheard of.",
    image: "https://randomuser.me/api/portraits/men/61.jpg",
    name: "Tobias Müller",
    role: "Engineering Manager, Retail SaaS",
  },
  {
    text: "Moving from a monolith to microservices felt impossible until Blocks gave us the modular architecture and deployment pipeline.",
    image: "https://randomuser.me/api/portraits/women/37.jpg",
    name: "Lucia Ferrara",
    role: "CTO, Manufacturing Software",
  },
  {
    text: "The open-source core means we're never locked in. We run Blocks on our own Kubernetes cluster — full control, SELISE support.",
    image: "https://randomuser.me/api/portraits/men/22.jpg",
    name: "Rajesh Kumar",
    role: "Platform Engineer, Telecom",
  },
];


const firstColumn = testimonials.slice(0, 3);
const secondColumn = testimonials.slice(3, 6);
const thirdColumn = testimonials.slice(6, 9);


const Testimonials = () => {
  return (
    <section className="my-20 relative bg-neutral-950">

      <div className="container z-10 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="flex flex-col items-center justify-center max-w-[540px] mx-auto"
        >
          <div className="flex justify-center">
            <div className="border border-white/20 py-1 px-4 rounded-md text-xs font-medium text-white/60">Testimonials</div>
          </div>

          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold tracking-tighter mt-5 text-white">
            Trusted by engineering teams
          </h2>
          <p className="text-center mt-5 text-white/50 text-lg">
            See what CTOs, DevOps leads, and platform engineers say about SELISE Blocks.
          </p>
        </motion.div>

        <div className="flex justify-center gap-6 mt-10 [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)] max-h-[740px] overflow-hidden">
          <TestimonialsColumn testimonials={firstColumn} duration={15} />
          <TestimonialsColumn testimonials={secondColumn} className="hidden md:block" duration={19} />
          <TestimonialsColumn testimonials={thirdColumn} className="hidden lg:block" duration={17} />
        </div>
      </div>
    </section>
  );
};

export { Testimonials as TestimonialsSection };
