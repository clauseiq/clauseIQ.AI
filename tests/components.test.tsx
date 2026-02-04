// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';
import React from 'react';

// Mock child components to isolate App testing
vi.mock('../pages/Landing', () => ({ Landing: () => <div>Landing Page</div> }));
vi.mock('../pages/Dashboard', () => ({ Dashboard: () => <div>Dashboard</div> }));

describe('App Component', () => {
    it('renders without crashing', () => {
        // We can't easily test full App with routing here without more setup,
        // but we can check if it mounts.
        // For now, let's just make sure it doesn't throw.
        expect(() => render(<App />)).not.toThrow();
    });
});
