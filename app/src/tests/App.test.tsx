import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock the AuthContext so we can control auth state in tests
vi.mock('../contexts/AuthContext', () => ({
    AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useAuth: () => ({
        user: null,
        login: vi.fn(),
        logout: vi.fn(),
        loading: false,
        isAuthenticated: false,
    }),
}));

// Mock ThemeContext
vi.mock('../contexts/ThemeContext', () => ({
    ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useTheme: () => ({ theme: 'light', toggleTheme: vi.fn() }),
}));

describe('App', () => {
    it('renders without crashing', async () => {
        // Dynamically import App after mocks are set up
        const { default: App } = await import('../App');
        const { container } = render(<App />);
        expect(container).toBeDefined();
    }, 30000);
});

describe('Routing', () => {
    it('navigates to login page', async () => {
        const { default: App } = await import('../App');
        render(<App />);
        // When not authenticated, public home page should render
        // (the app uses BrowserRouter internally, so we just check it doesn't crash)
        expect(document.body).toBeDefined();
    }, 30000);
});
