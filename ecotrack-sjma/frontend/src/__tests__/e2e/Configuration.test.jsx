import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ConfigurationPage from '../pages/desktop/admin/Configuration';
import { configService } from '../services/configService';

const showSuccessMock = vi.fn();
const showErrorMock = vi.fn();

vi.mock('../services/configService');
vi.mock('../components/common', async () => {
  const actual = await vi.importActual('../components/common');
  return {
    ...actual,
    Alert: ({ type, message }) => <div data-testid="alert">{message}</div>,
    useAlert: () => ({
      alert: null,
      showSuccess: showSuccessMock,
      showError: showErrorMock
    })
  };
});

const mockConfigData = {
  security: {
    'jwt.access_token_expiration': { value: '24h', type: 'string' },
    'jwt.refresh_token_expiration': { value: '168h', type: 'string' },
    'session.max_concurrent_sessions': { value: 3, type: 'number' },
    'security.bcrypt_rounds': { value: 10, type: 'number' },
    'rate_limit.max_requests': { value: 100, type: 'number' }
  },
  environment: {
    'CO2_PER_KM': { value: 0.85, type: 'number' },
    'FUEL_CONSUMPTION_PER_100KM': { value: 35, type: 'number' },
    'FUEL_PRICE_PER_LITER': { value: 1.65, type: 'number' },
    'LABOR_COST_PER_HOUR': { value: 50, type: 'number' },
    'MAINTENANCE_COST_PER_KM': { value: 0.15, type: 'number' },
    'CO2_PER_TREE_PER_YEAR': { value: 20, type: 'number' },
    'CO2_PER_KM_CAR': { value: 0.12, type: 'number' }
  },
  performance: {
    'COLLECTION_RATE_WEIGHT': { value: 0.4, type: 'number' },
    'COMPLETION_RATE_WEIGHT': { value: 0.3, type: 'number' },
    'TIME_EFFICIENCY_WEIGHT': { value: 0.15, type: 'number' },
    'DISTANCE_EFFICIENCY_WEIGHT': { value: 0.15, type: 'number' }
  }
};

describe('ConfigurationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    showSuccessMock.mockReset();
    showErrorMock.mockReset();
    configService.getAll.mockResolvedValue(mockConfigData);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <ConfigurationPage />
      </BrowserRouter>
    );
  };

  it('should render loading state initially', () => {
    configService.getAll.mockReturnValue(new Promise(() => {}));
    renderComponent();
    expect(screen.getByText(/Chargement/i)).toBeInTheDocument();
  });

  it('should load configuration data on mount', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(configService.getAll).toHaveBeenCalledTimes(1);
    }, { timeout: 3000 });
  });

  it('should display page title', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Configuration système')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should display all three sections after loading', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Sécurité')).toBeInTheDocument();
      expect(screen.getByText('Performance Agents')).toBeInTheDocument();
      expect(screen.getByText('Impact CO2 & Environnement')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should have save buttons for each section', async () => {
    renderComponent();
    
    await waitFor(() => {
      const buttons = screen.getAllByRole('button', { name: /Sauvegarder/i });
      expect(buttons.length).toBe(3);
    }, { timeout: 3000 });
  });

  it('should call updateSecurity when saving security section', async () => {
    configService.updateSecurity.mockResolvedValue({ success: true });
    
    const { container } = renderComponent();
    
    await waitFor(() => {
      const buttons = container.querySelectorAll('.btn-primary');
      expect(buttons.length).toBe(3);
    }, { timeout: 3000 });

    const buttons = screen.getAllByRole('button', { name: /Sauvegarder/i });
    fireEvent.click(buttons[0]);

    await waitFor(() => {
      expect(configService.updateSecurity).toHaveBeenCalledWith('jwt.access_token_expiration', '24h');
      expect(showSuccessMock).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('should call updateEnvironmental when saving environment section', async () => {
    configService.updateEnvironmental.mockResolvedValue({ success: true });
    
    renderComponent();
    
    const buttons = await screen.findAllByRole('button', { name: /Sauvegarder/i });
    fireEvent.click(buttons[2]);

    await waitFor(() => {
      expect(configService.updateEnvironmental).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('should call updatePerformance when saving performance section', async () => {
    configService.updatePerformance.mockResolvedValue({ success: true });
    
    renderComponent();
    
    const buttons = await screen.findAllByRole('button', { name: /Sauvegarder/i });
    fireEvent.click(buttons[1]);

    await waitFor(() => {
      expect(configService.updatePerformance).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('should handle load errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    configService.getAll.mockRejectedValueOnce(new Error('API Error'));
    
    renderComponent();
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
      expect(showErrorMock).toHaveBeenCalledWith('Erreur de chargement des configurations');
    }, { timeout: 3000 });
    
    consoleSpy.mockRestore();
  });

  it('should disable performance save when sum is not equal to 1', async () => {
    const badPerformance = {
      ...mockConfigData,
      performance: {
        ...mockConfigData.performance,
        'COLLECTION_RATE_WEIGHT': { value: 0.5, type: 'number' },
        'COMPLETION_RATE_WEIGHT': { value: 0.3, type: 'number' },
        'TIME_EFFICIENCY_WEIGHT': { value: 0.15, type: 'number' },
        'DISTANCE_EFFICIENCY_WEIGHT': { value: 0.15, type: 'number' }
      }
    };
    configService.getAll.mockResolvedValueOnce(badPerformance);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/La somme doit etre egale a 1|La somme doit être égale à 1/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    const buttons = screen.getAllByRole('button', { name: /Sauvegarder/i });
    expect(buttons[1]).toBeDisabled();
  });

  it('should disable environment save when a required value is empty', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Sauvegarder/i }).length).toBe(3);
    }, { timeout: 3000 });

    const envInputs = document.querySelectorAll('input');
    fireEvent.change(envInputs[9], { target: { value: '' } });

    const buttons = screen.getAllByRole('button', { name: /Sauvegarder/i });
    expect(buttons[2]).toBeDisabled();
  });

  it('should show API error message when save fails with backend error', async () => {
    configService.updateEnvironmental.mockRejectedValueOnce({
      response: { data: { error: 'Valeur invalide' } }
    });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    renderComponent();

    const buttons = await screen.findAllByRole('button', { name: /Sauvegarder/i });
    fireEvent.click(buttons[2]);

    await waitFor(() => {
      expect(showErrorMock).toHaveBeenCalledWith('Erreur: Valeur invalide');
    }, { timeout: 3000 });

    consoleSpy.mockRestore();
  });

  it('should fallback to unknown error message when save fails without details', async () => {
    configService.updatePerformance.mockRejectedValueOnce({});

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    renderComponent();

    const buttons = await screen.findAllByRole('button', { name: /Sauvegarder/i });
    fireEvent.click(buttons[1]);

    await waitFor(() => {
      expect(showErrorMock).toHaveBeenCalledWith('Erreur: Erreur inconnue');
    }, { timeout: 3000 });

    consoleSpy.mockRestore();
  });
});

describe('ConfigurationPage Data Mapping', () => {
  it('should map JWT access token correctly', async () => {
    const dataWithHours = {
      security: {
        'jwt.access_token_expiration': { value: '48h', type: 'string' }
      },
      environment: {},
      performance: {}
    };
    configService.getAll.mockResolvedValue(dataWithHours);

    render(
      <BrowserRouter>
        <ConfigurationPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      const inputs = document.querySelectorAll('input');
      const jwtInput = Array.from(inputs).find(input => input.value === '48');
      expect(jwtInput).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should map refresh token from hours to days', async () => {
    const dataWithRefresh = {
      security: {
        'jwt.refresh_token_expiration': { value: '168h', type: 'string' }
      },
      environment: {},
      performance: {}
    };
    configService.getAll.mockResolvedValue(dataWithRefresh);

    render(
      <BrowserRouter>
        <ConfigurationPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      const inputs = document.querySelectorAll('input');
      const refreshInput = Array.from(inputs).find(input => input.value === '7');
      expect(refreshInput).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});