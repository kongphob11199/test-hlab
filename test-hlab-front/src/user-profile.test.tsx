import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import UserProfile from './user-profile';

global.fetch = jest.fn();

describe('UserProfile Component', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('displays loading state initially', () => {
    render(<UserProfile userId="123" />);
    expect(screen.getByText(/loading.../i)).toBeInTheDocument();
  });

  it('displays error message when fetch fails', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Failed to fetch user data'));

    render(<UserProfile userId="123" />);
    await waitFor(() => expect(screen.getByText(/error: failed to fetch user data/i)).toBeInTheDocument());
  });

  it('renders user data on successful fetch', async () => {
    const mockUser = {
      name: 'John Doe',
      email: 'john.doe@example.com',
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockUser,
    });

    render(<UserProfile userId="123" />);
    await waitFor(() => expect(screen.getByText(mockUser.name)).toBeInTheDocument());
    expect(screen.getByText(`Email: ${mockUser.email}`)).toBeInTheDocument();
  });

  it('handles non-200 HTTP response status', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    render(<UserProfile userId="123" />);
    await waitFor(() => expect(screen.getByText(/error: failed to fetch user data/i)).toBeInTheDocument());
  });
});
