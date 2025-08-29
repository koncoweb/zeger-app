import React from 'react';

interface ZegerLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ZegerLogo: React.FC<ZegerLogoProps> = ({
  className = "",
  size = "md"
}) => {
  const sizeClasses = {
    sm: "w-32 h-auto",
    md: "w-40 h-auto", 
    lg: "w-48 h-auto"
  };

  return (
    <div className={className}>
      <img 
        src="/lovable-uploads/d4a2c054-62a4-4959-91f5-e3fcd06dda7d.png" 
        alt="Zeger Coffee Logo"
        className={`${sizeClasses[size]} object-contain`}
      />
    </div>
  );
};