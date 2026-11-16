
"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Home, MoveLeft, SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background p-4 text-foreground">
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-[10%] -top-[10%] h-[50vh] w-[50vh] rounded-full bg-primary/20 blur-[100px]" />
        <div className="absolute -bottom-[10%] -right-[10%] h-[50vh] w-[50vh] rounded-full bg-accent/20 blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 mx-auto max-w-2xl text-center"
      >
        {/* 404 Glitch Effect Container */}
        <div className="relative mb-8 flex justify-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 15,
              delay: 0.2,
            }}
            className="relative"
          >
            <h1 className="flex items-center justify-center select-none text-[150px] font-black leading-none tracking-tighter text-transparent sm:text-[200px]">
              <span className="bg-gradient-to-b from-primary to-primary/50 bg-clip-text">
                4
              </span>
              <span className="relative inline-block">
                <span className="bg-gradient-to-b from-primary to-primary/50 bg-clip-text">
                  0
                </span>
                <motion.div
                  animate={{
                    rotate: [0, 10, -10, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-primary"
                >
                  <SearchX className="h-24 w-24 opacity-20 sm:h-32 sm:w-32" />
                </motion.div>
              </span>
              <span className="bg-gradient-to-b from-primary to-primary/50 bg-clip-text">
                4
              </span>
            </h1>
          </motion.div>
        </div>

        {/* Text Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="space-y-6"
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Page Not Found
          </h2>
          <p className="mx-auto max-w-md text-lg text-muted-foreground">
            Oops! It seems you've ventured into uncharted territory. The page you
            are looking for might have been moved or doesn't exist.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="group min-w-[160px] gap-2 shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40"
            >
              <Link href="/">
                <Home className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
                Go Home
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="group min-w-[160px] gap-2 hover:bg-accent hover:text-accent-foreground"
            >
              <Link href="#" onClick={() => window.history.back()}>
                <MoveLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                Go Back
              </Link>
            </Button>
          </div>
        </motion.div>
      </motion.div>

      {/* Decorative Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 1 }}
        className="absolute bottom-8 text-sm text-muted-foreground/50"
      >
        Error Code: 404
      </motion.div>
    </div>
  );
}
