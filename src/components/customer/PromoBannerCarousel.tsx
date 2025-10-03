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

  const promoBanners = [
    {
      id: 1,
      title: "OCTOBREW Promo",
      image: "/promo-banners/octobrew-1.png"
    },
    {
      id: 2,
      title: "Special Offers",
      image: "/promo-banners/octobrew-2.png"
    },
    {
      id: 3,
      title: "Member Deals",
      image: "/promo-banners/octobrew-3.png"
    },
    {
      id: 4,
      title: "New Menu",
      image: "/promo-banners/octobrew-4.png"
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
            <div className="relative h-48 overflow-hidden rounded-none">
              <img 
                src={banner.image} 
                alt={banner.title}
                className="w-full h-full object-cover"
              />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="left-2" />
      <CarouselNext className="right-2" />
    </Carousel>
  );
};

export default PromoBannerCarousel;
