
import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ size = 'md', showText = true }) => {
  // Using a direct reference to the Atlas Honda logo or local path
  const logoSrc = "https://atlas-honda.com.pk/wp-content/themes/atlashonda/assets/images/logo.png"; 
  const [imgError, setImgError] = useState(false);

  const containerWidths = {
    sm: 'w-24',
    md: 'w-32',
    lg: 'w-56'
  };

  return (
    <motion.div 
      className="flex flex-col items-start gap-1 cursor-pointer group"
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
      <motion.div
        className={`${containerWidths[size]} relative flex items-center justify-center p-2 rounded-2xl bg-white/50 backdrop-blur-sm group-hover:bg-white transition-colors`}
        whileHover={{ 
          rotate: [0, -2, 2, -2, 0],
          boxShadow: "0 0 30px rgba(176, 46, 21, 0.2)"
        }}
        transition={{ 
          rotate: { duration: 0.5, repeat: 0 },
          boxShadow: { duration: 0.3 }
        }}
      >
        <img 
          src={logoSrc} 
          alt="Atlas Honda Official Logo" 
          className="w-full h-auto object-contain"
          onError={(e) => {
            setImgError(true);
            // Fallback for demo environment if external URL is blocked
            (e.target as HTMLImageElement).src = "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Honda_Logo.svg/1200px-Honda_Logo.svg.png";
          }}
        />
        
        {/* Glow effect matching brand identity */}
        <motion.div 
          className="absolute inset-0 bg-honda-red opacity-0 rounded-2xl -z-10 blur-xl"
          whileHover={{ opacity: 0.1 }}
        />
      </motion.div>
      
      {showText && size === 'lg' && (
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.4em] ml-2 mt-2"
        >
          Authorized Dealership
        </motion.p>
      )}
    </motion.div>
  );
};

export default Logo;
