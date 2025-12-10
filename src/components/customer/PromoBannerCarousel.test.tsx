import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { PromoBannerCarousel } from './PromoBannerCarousel';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          gte: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({
              data: [
                {
                  id: '1',
                  title: 'Test Banner',
                  image_url: '/test-banner.png',
                  link_url: 'menu'
                }
              ],
              error: null
            }))
          }))
        }))
      }))
    }))
  }
}));

// Mock Embla Carousel
vi.mock('embla-carousel-autoplay', () => ({
  default: vi.fn(() => ({}))
}));

describe('PromoBannerCarousel', () => {
  const mockOnNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render banner carousel', async () => {
    render(<PromoBannerCarousel onNavigate={mockOnNavigate} />);
    
    await waitFor(() => {
      expect(screen.getByAltText('Test Banner')).toBeInTheDocument();
    });
  });

  it('should call onNavigate when banner with link_url is clicked', async () => {
    render(<PromoBannerCarousel onNavigate={mockOnNavigate} />);
    
    await waitFor(() => {
      const banner = screen.getByAltText('Test Banner');
      expect(banner).toBeInTheDocument();
    });

    const bannerContainer = screen.getByAltText('Test Banner').parentElement;
    fireEvent.click(bannerContainer!);

    expect(mockOnNavigate).toHaveBeenCalledWith('menu');
  });

  it('should show click indicator for banners with link_url', async () => {
    render(<PromoBannerCarousel onNavigate={mockOnNavigate} />);
    
    await waitFor(() => {
      const indicator = document.querySelector('.animate-pulse');
      expect(indicator).toBeInTheDocument();
    });
  });

  it('should not call onNavigate when banner without link_url is clicked', async () => {
    // Mock banner without link_url
    vi.mocked(require('@/integrations/supabase/client').supabase.from).mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          gte: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({
              data: [{
                id: '1',
                title: 'Test Banner No Link',
                image_url: '/test-banner.png',
                link_url: null
              }],
              error: null
            }))
          }))
        }))
      }))
    });

    render(<PromoBannerCarousel onNavigate={mockOnNavigate} />);
    
    await waitFor(() => {
      const banner = screen.getByAltText('Test Banner No Link');
      expect(banner).toBeInTheDocument();
    });

    const bannerContainer = screen.getByAltText('Test Banner No Link').parentElement;
    fireEvent.click(bannerContainer!);

    expect(mockOnNavigate).not.toHaveBeenCalled();
  });
});