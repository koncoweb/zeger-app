import React from 'react';
import { Card } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

const PromoBannerCarousel = () => {
  const plugin = React.useRef(
    Autoplay({ delay: 3000, stopOnInteraction: true })
  );

  // Dummy promo images - will be replaced by user's actual promo banners
  const promoBanners = [
    {
      id: 1,
      title: "Buy 1 Get 1 Free",
      image: "/lovable-uploads/d4a2c054-62a4-4959-91f5-e3fcd06dda7d.png",
      gradient: "from-orange-500 to-red-500"
    },
    {
      id: 2,
      title: "International Coffee Day",
      image: "/lovable-uploads/af4d1a9a-5f56-4c8a-81a2-eb098eb7c2cb.png",
      gradient: "from-blue-500 to-purple-500"
    },
    {
      id: 3,
      title: "Member Exclusive Deals",
      image: "/lovable-uploads/d4a2c054-62a4-4959-91f5-e3fcd06dda7d.png",
      gradient: "from-green-500 to-teal-500"
    }
  ];

  return (
    <Carousel
      plugins={[plugin.current]}
      className="w-full"
      onMouseEnter={plugin.current.stop}
      onMouseLeave={plugin.current.reset}
    >
      <CarouselContent>
        {promoBanners.map((banner) => (
          <CarouselItem key={banner.id}>
            <Card className="border-0 shadow-lg overflow-hidden">
              <div className={`relative h-40 bg-gradient-to-r ${banner.gradient} flex items-center justify-center`}>
                <div className="absolute inset-0 bg-black/20" />
                <h3 className="relative text-white text-2xl font-bold text-center px-4">
                  {banner.title}
                </h3>
              </div>
            </Card>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="left-2" />
      <CarouselNext className="right-2" />
    </Carousel>
  );
};

export default PromoBannerCarousel;
