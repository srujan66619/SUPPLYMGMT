import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import DisruptionAnalyzer from './DisruptionAnalyzer';

// Mock the axios post request
import axios from 'axios';
vi.mock('axios');

describe('DisruptionAnalyzer Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => render(
    <BrowserRouter>
      <DisruptionAnalyzer />
    </BrowserRouter>
  );

  test('renders correctly', () => {
    renderComponent();
    expect(screen.getByText('Disruption Analyzer')).toBeInTheDocument();
    expect(screen.getByText(/Paste the notice exactly as received/i)).toBeInTheDocument();
  });

  test('shows error when notice is too short', async () => {
    renderComponent();
    
    const textarea = screen.getByPlaceholderText(/Paste email/i);
    fireEvent.change(textarea, { target: { value: 'short' } });
    
    const button = screen.getByText('Analyze Disruption');
    fireEvent.click(button);
    
    expect(await screen.findByText(/Notice is too short/i)).toBeInTheDocument();
  });

  test('submits notice successfully', async () => {
    axios.post.mockResolvedValueOnce({ data: { id: 123 } });
    
    renderComponent();
    
    const textarea = screen.getByPlaceholderText(/Paste email/i);
    fireEvent.change(textarea, { target: { value: 'This is a valid test notice that is long enough.' } });
    
    const button = screen.getByText('Analyze Disruption');
    fireEvent.click(button);
    
    expect(await screen.findByText(/Submitting.../i)).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText(/Disruption Submitted Successfully/i)).toBeInTheDocument();
      expect(screen.getByText(/Disruption ID: 123/i)).toBeInTheDocument();
    });
  });
});
