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
    sm: "w-24 h-24",
    md: "w-32 h-32",
    lg: "w-48 h-48"
  };
  const textSizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl"
  };
  return <div className={`flex flex-col items-center justify-center ${sizeClasses[size]} ${className}`}>
      
    </div>;
};