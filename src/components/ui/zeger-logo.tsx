import React from 'react';

interface ZegerLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ZegerLogo: React.FC<ZegerLogoProps> = ({ className = "", size = "md" }) => {
  const sizeClasses = {
    sm: "w-24 h-24",
    md: "w-32 h-32", 
    lg: "w-48 h-48"
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl"
  };

  return (
    <div className={`flex flex-col items-center justify-center ${sizeClasses[size]} ${className}`}>
      {/* Zeger Bean Logo */}
      <div className="relative">
        <div className="w-16 h-24 bg-gradient-to-br from-primary via-primary-light to-primary rounded-full transform rotate-12 relative overflow-hidden">
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-2 h-8 bg-background rounded-full opacity-80"></div>
        </div>
      </div>
      
      {/* Zeger Text */}
      <div className={`mt-2 font-bold ${textSizes[size]} text-foreground tracking-wider`}>
        <span className="text-primary">Zeger</span>
        <span className="text-muted-foreground">!</span>
      </div>
      
      {/* Coffee Text */}
      <div className="text-xs text-muted-foreground font-medium tracking-widest uppercase">
        COFFEE
      </div>
    </div>
  );
};