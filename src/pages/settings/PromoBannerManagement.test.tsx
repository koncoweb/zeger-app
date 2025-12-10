import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import PromoBannerManagement from './PromoBannerManagement';

// Mock Supabase
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      order: vi.fn(() => Promise.resolve({
        data: [
          {
            id: '1',
            title: 'Test Banner',
            description: 'Test Description',
            image_url: '/test-banner.png',
            link_url: 'menu',
            is_active: true,
            display_order: 1,
            valid_from: '2024-01-01',
            valid_until: '2025-12-31'
          }
        ],
        error: null
      }))
    })),
    insert: vi.fn(() => Promise.resolve({ error: null })),
    update: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ error: null }))
    })),
    delete: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ error: null }))
    }))
  })),
  auth: {
    getUser: vi.fn(() => Promise.resolve({
      data: { user: { id: 'test-user' } }
    }))
  }
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('PromoBannerManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render banner management page', async () => {
    renderWithRouter(<PromoBannerManagement />);
    
    expect(screen.getByText('Promo Banner Management')).toBeInTheDocument();
    expect(screen.getByText('Panduan Banner Management')).toBeInTheDocument();
  });

  it('should display navigation options in select dropdown', async () => {
    renderWithRouter(<PromoBannerManagement />);
    
    // Click add banner button
    const addButton = screen.getByText('Tambah Banner');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Tambah Banner Baru')).toBeInTheDocument();
    });

    // Check if navigation select is present
    expect(screen.getByText('Navigasi Banner')).toBeInTheDocument();
  });

  it('should show navigation badge for banners with link_url', async () => {
    renderWithRouter(<PromoBannerManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('Menu Produk')).toBeInTheDocument();
    });
  });

  it('should filter banners by active status', async () => {
    renderWithRouter(<PromoBannerManagement />);
    
    await waitFor(() => {
      const filterSelect = screen.getByDisplayValue('Semua Banner');
      expect(filterSelect).toBeInTheDocument();
    });
  });

  it('should show click indicator for banners with navigation', async () => {
    renderWithRouter(<PromoBannerManagement />);
    
    await waitFor(() => {
      const clickIndicator = document.querySelector('.animate-pulse');
      expect(clickIndicator).toBeInTheDocument();
    });
  });

  it('should display banner statistics in header', async () => {
    renderWithRouter(<PromoBannerManagement />);
    
    await waitFor(() => {
      expect(screen.getByText(/Total: \d+ banner/)).toBeInTheDocument();
      expect(screen.getByText(/Aktif: \d+ banner/)).toBeInTheDocument();
      expect(screen.getByText(/Dengan navigasi: \d+ banner/)).toBeInTheDocument();
    });
  });
});