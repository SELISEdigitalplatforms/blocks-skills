"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const durations = [26.3, 22.7, 29.1, 24.5, 27.8, 23.2, 28.9, 21.6, 25.4, 22.1, 29.7, 24.8, 27.2, 23.9, 28.3, 21.4, 26.6, 22.9, 29.4, 24.1, 27.9, 23.5, 28.7, 22.2, 25.8, 29.2, 24.6, 27.1, 22.8, 28.4, 21.9, 26.2, 23.7, 29.8, 24.3, 27.5, 22.4];

function FloatingPaths({ position }: { position: number }) {
    const paths = Array.from({ length: 36 }, (_, i) => ({
        id: i,
        d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${
            380 - i * 5 * position
        } -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
            152 - i * 5 * position
        } ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
            684 - i * 5 * position
        } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
        color: `rgba(255,255,255,${0.03 + i * 0.02})`,
        width: 0.5 + i * 0.03,
        duration: durations[i],
    }));

    return (
        <div className="absolute inset-0 pointer-events-none">
            <svg
                className="w-full h-full text-white"
                viewBox="0 0 696 316"
                fill="none"
            >
                <title>Background Paths</title>
                {paths.map((path) => (
                    <motion.path
                        key={path.id}
                        d={path.d}
                        stroke="currentColor"
                        strokeWidth={path.width}
                        strokeOpacity={0.1 + path.id * 0.03}
                        initial={{ pathLength: 0.3, opacity: 0.6 }}
                        animate={{
                            pathLength: 1,
                            opacity: [0.3, 0.6, 0.3],
                            pathOffset: [0, 1, 0],
                        }}
                        transition={{
                            duration: path.duration,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "linear",
                        }}
                    />
                ))}
            </svg>
        </div>
    );
}

export function BackgroundPaths({
    title = "Selise Blocks",
}: {
    title?: string;
}) {
    const words = title.split(" ");

    return (
        <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-neutral-950">
            <div className="absolute inset-0">
                <FloatingPaths position={1} />
                <FloatingPaths position={-1} />
            </div>

            <div className="relative z-10 container mx-auto px-4 md:px-6 text-center">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 2 }}
                    className="max-w-4xl mx-auto"
                >
                    <h1 className="text-5xl sm:text-7xl md:text-8xl font-bold mb-8 tracking-tighter">
                        {words.map((word, wordIndex) => (
                            <span
                                key={wordIndex}
                                className="inline-block mr-4 last:mr-0"
                            >
                                {word.split("").map((letter, letterIndex) => (
                                    <motion.span
                                        key={`${wordIndex}-${letterIndex}`}
                                        initial={{ y: 100, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{
                                            delay:
                                                wordIndex * 0.1 +
                                                letterIndex * 0.03,
                                            type: "spring",
                                            stiffness: 150,
                                            damping: 25,
                                        }}
                                        className="inline-block text-transparent bg-clip-text 
                                        bg-gradient-to-r from-white to-white/80"
                                    >
                                        {letter}
                                    </motion.span>
                                ))}
                            </span>
                        ))}
                    </h1>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <a
                            href="https://docs.seliseblocks.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block group/cta relative bg-gradient-to-b from-white/10 to-black/10 
                            p-px rounded-2xl backdrop-blur-lg 
                            overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
                        >
                            <Button
                                variant="ghost"
                                className="rounded-[1.15rem] px-8 py-6 text-lg font-semibold backdrop-blur-md 
                                bg-white text-black hover:bg-white/90 transition-all duration-300 
                                group-hover/cta:-translate-y-0.5 border border-white/20
                                hover:shadow-md shadow-white/10"
                            >
                                <span className="opacity-90 group-hover/cta:opacity-100 transition-opacity">
                                    Start Building
                                </span>
                                <span
                                    className="ml-3 opacity-70 group-hover/cta:opacity-100 group-hover/cta:translate-x-1.5 
                                    transition-all duration-300"
                                >
                                    →
                                </span>
                            </Button>
                        </a>
                        <a
                            href="https://cloud.seliseblocks.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-white/50 hover:text-white transition-colors"
                        >
                            Watch Demo
                        </a>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
