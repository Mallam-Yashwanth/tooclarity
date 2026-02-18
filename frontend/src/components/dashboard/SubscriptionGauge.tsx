import React, { useState, useEffect } from "react";
import { _Card, _CardContent } from "../ui/card";
import { motion } from "framer-motion";
import Kebab from "../ui/Kebab";

interface Props {
  daysLeft: number;
  _onUpgrade?: () => void;
}

const SubscriptionGauge: React.FC<Props> = ({ daysLeft, _onUpgrade }) => {
  const [animatedDaysLeft, setAnimatedDaysLeft] = useState(daysLeft);

  // Sync with prop updates from backend
  useEffect(() => {
    setAnimatedDaysLeft(daysLeft);
  }, [daysLeft]);

  // Fixed 11 rectangles with level colors like the mock
  const totalSegments = 11;
  const _totalDays = 30;

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.6 }
    }
  };

  // Fixed palette: 11 level colors (4 red shades -> 3 orange/beige -> 4 mint)
  const fixedPalette = [
    "#D32F2F", "#E53935", "#F44336", "#EF5350",
    "#FB8C00", "#FFB74D", "#FDD39B",
    "#C8E6C9", "#B2DFDB", "#CDEECD", "#D7F5D7"
  ].slice(0, totalSegments);

  const getSegmentColor = (index: number) => fixedPalette[index] || "#E5E7EB";

  const getNumberColor = () => {
    if (animatedDaysLeft > 20) return "#10b981"; // Green
    if (animatedDaysLeft > 10) return "#f59e0b"; // Orange
    return "#ea580c"; // Red
  };

  const generateRectangularSegments = () => {
    const segments: React.ReactElement[] = [];
    const centerX = 150;
    const centerY = 100;
    const radius = 82; // tuned to match mock
    const segmentWidth = 16; // card-like rounded rectangles
    const segmentHeight = 26;
    const startAngle = -180; // Start from left
    const endAngle = 0; // End at right (180 degrees)
    const angleStep = (endAngle - startAngle) / totalSegments;

    for (let i = 0; i < totalSegments; i++) {
      const angle = startAngle + (i * angleStep) + (angleStep / 2);
      const x = centerX + radius * Math.cos((angle * Math.PI) / 180) - (segmentWidth / 2);
      const y = centerY + radius * Math.sin((angle * Math.PI) / 180) - (segmentHeight / 2);
      const angleDeg = (angle * 180) / Math.PI; // rotate each card along the arc
      const cx = x + segmentWidth / 2;
      const cy = y + segmentHeight / 2;
      segments.push(
        <motion.rect
          key={i}
          x={x}
          y={y}
          width={segmentWidth}
          height={segmentHeight}
          fill={getSegmentColor(i)}
          rx={4}
          ry={4}
          transform={`rotate(${angleDeg}, ${cx}, ${cy})`}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05, duration: 0.3 }}
        />
      );
    }
    return segments;
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
    >
      <_Card className="border-none bg-gray-50 h-full shadow-sm rounded-2xl border border-gray-100 hover:shadow-md transition-shadow duration-200 overflow-hidden dark:bg-gray-900 dark:border-gray-800">
        <_CardContent className="p-6 h-full flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="tezt-sm md:text-2xl font-semibold dark:text-gray-100">Subscription</div>
            <motion.div
              className="text-gray-400 cursor-pointer dark:text-gray-300"
              whileHover={{ scale: 1.2 }}
              transition={{ duration: 0.2 }}
            >
              {/* vertical kebab */}
              <span className="inline-flex"><Kebab /></span>
            </motion.div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center bg-white pb-7 rounded-2xl dark:bg-gray-800 dark:border-gray-700">
            <div className="relative mb-4 w-full mt-4">
              <svg width="100%" height={230} viewBox="0 0 300 160" className="mx-auto">
                {generateRectangularSegments()}
              </svg>
            </div>

            <motion.div
              className="text-4xl font-bold -mt-8"
              style={{ color: getNumberColor() }}
              key={Math.floor(animatedDaysLeft)}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {Math.floor(animatedDaysLeft)}
            </motion.div>
            <motion.div
              className="text-sm text-gray-500 mt-1 dark:text-gray-300"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.5 }}
            >
              Days left
            </motion.div>
          </div>
        </_CardContent>
      </_Card>
    </motion.div>
  );
};

export default SubscriptionGauge;
