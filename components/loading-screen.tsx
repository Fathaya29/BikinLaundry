"use client";

import { AnimatePresence, motion, type Variants } from "framer-motion";
import PixelSnow from "@/components/pixel-snow";
import { BrandLockup } from "@/components/brand-lockup";

export type LoadingScreenProps = {
  isLoaded?: boolean;
};

const loaderVariants: Variants = {
  initial: { scale: 0.8, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: { type: "spring", stiffness: 200, damping: 20 },
  },
  pulse: {
    scale: [1, 1.02, 1],
    transition: { duration: 2, ease: "easeInOut", repeat: Infinity },
  },
  exit: {
    scale: 0.9,
    opacity: 0,
    transition: { duration: 0.3 },
  },
};

export function LoadingScreen({ isLoaded = false }: LoadingScreenProps) {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-950 px-6 text-center text-white">
      <PixelSnow className="z-0 opacity-40" color="#ffffff" flakeSize={0.01} minFlakeSize={1.25} pixelResolution={200} speed={1.1} density={0.22} direction={125} brightness={0.8} />
      <BrandLockup className="absolute left-6 top-6 z-10 sm:left-10 sm:top-8" />
      <div className="relative z-10 flex min-h-40 flex-col items-center justify-end gap-8 overflow-hidden">
        <AnimatePresence initial={false} mode="wait">
          {!isLoaded ? (
            <motion.div
              key="loading-loader"
              className="flex flex-col items-center"
              variants={loaderVariants}
              initial="initial"
              animate={["animate", "pulse"]}
              exit="exit"
              aria-hidden="true"
            >
              <LoaderMark />
            </motion.div>
          ) : (
            <motion.div
              key="success-loader"
              className="flex flex-col items-center"
              variants={loaderVariants}
              initial="animate"
              animate="exit"
              aria-hidden="true"
            >
              <LoaderMark />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex h-6 items-center justify-center">
          <AnimatePresence initial={false} mode="wait">
          <motion.p
            key={isLoaded ? "success-message" : "loading-message"}
            role="status"
            aria-live="polite"
            className={`max-w-[min(34rem,calc(100vw-3rem))] text-balance font-mono text-[0.68rem] uppercase tracking-[0.14em] sm:text-xs sm:tracking-[0.2em] ${isLoaded ? "font-semibold text-cyan-200" : "text-slate-400"}`}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            {isLoaded ? "PROJEK BERHASIL DIMUAT, SELAMAT BEKERJA" : "MEMUAT PROYEK..."}
          </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}

function LoaderMark() {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="size-24 flex items-center justify-center">
        {/* @ts-expect-error Custom Element */}
        <dotlottie-player src="/washing-machine.lottie" background="transparent" speed="1" style={{ width: "100%", height: "100%" }} loop autoPlay></dotlottie-player>
      </div>
      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 shadow-sm backdrop-blur-sm">
        <span className="size-1.5 animate-pulse rounded-full bg-cyan-300" />
        <span className="font-mono text-[9px] font-semibold tracking-[0.18em] text-slate-300">RUANG KERJA OUTLET</span>
      </div>
    </div>
  );
}
