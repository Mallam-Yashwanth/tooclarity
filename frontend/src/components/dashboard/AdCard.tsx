import React from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { motion } from "framer-motion";

interface AdCardProps {
  onShare?: (platform: string) => void;
}

import { WhatsAppLogo, XLogo, LinkedInLogo } from "../ui/BrandLogos";
const AdCard: React.FC<AdCardProps> = ({ onShare }) => {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
      <Card className="relative overflow-hidden border-none rounded-2xl shadow-sm bg-gradient-to-br from-[#F2F6FF] via-[#E8EEFF] to-[#E3E9FF] dark:from-gray-800 dark:via-gray-800 dark:to-gray-800">
        <CardContent className="p-4 md:p-9">
          <div className="relative grid grid-cols-12 items-center min-h-[180px] gap-x-8">
            {/* Left social icons (images only) */}
            <div className="col-span-12 md:col-span-3 relative h-[160px] mb-4 md:mb-0 overflow-hidden w-full">
              {/* WhatsApp top-left */}
              <div className="absolute top-0 left-2 h-12 w-12 rounded-full bg-white ring-4 ring-white flex items-center justify-center shadow-[0_8px_24px_rgba(16,185,129,0.35)] z-10">
                <WhatsAppLogo />
              </div>
              {/* X slightly to the right, centered vertically between */}
              <div className="absolute top-12 left-14 h-12 w-12 rounded-full bg-black flex items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,0.25)] z-10">
                <XLogo />
              </div>
              {/* LinkedIn bottom-left */}
              <div className="absolute bottom-0 left-2 h-12 w-12 rounded-full bg-white ring-4 ring-white flex items-center justify-center shadow-[0_10px_24px_rgba(10,102,194,0.35)] z-10">
                <LinkedInLogo />
              </div>
            </div>

            {/* Center content */}
            <div className="col-span-12 md:col-span-6 flex flex-col justify-center md:pl-6 z-10">
              <div className="text-[24px] font-semibold text-gray-900 dark:text-gray-100 leading-snug">Increase your reach</div>
              <div className="text-sm text-gray-600 dark:text-gray-300 mt-2">Share now on various social medias</div>
              <Button className="mt-5 w-[170px] bg-[#1859FF] hover:bg-[#0f4be0] text-white rounded-xl shadow-[0_8px_24px_rgba(24,89,255,0.35)]">
                Share Now
              </Button>
            </div>

            {/* Right arrow watermark */}
            <div className="hidden md:block col-span-12 md:col-span-3 relative h-full z-0 pointer-events-none">
              <svg
                className="absolute right-2 bottom-2 opacity-20"
                width="140"
                height="120"
                viewBox="0 0 140 120"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M20 95C55 95 80 70 80 35" stroke="#7EA2FF" strokeWidth="10" strokeLinecap="round" />
                <path d="M80 35 L110 60 M80 35 L110 10" stroke="#7EA2FF" strokeWidth="10" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AdCard;
