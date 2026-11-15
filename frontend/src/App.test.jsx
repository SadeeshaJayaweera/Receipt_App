import { render, screen } from '@testing-library/react';
import App from './App';

describe('App Root Component', () => {
  test('renders application without crashing and redirects unauthenticated user to login', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /juice receipt app/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });
});
