import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import KnowledgeBasePage from '@/pages/KnowledgeBasePage';

describe('KnowledgeBasePage', () => {
  it('renders the main title', () => {
    const { getByText } = render(<KnowledgeBasePage />);
    expect(getByText("Centre d'Aide")).toBeInTheDocument();
  });

  it('renders article tab with articles', () => {
    const { getByText } = render(<KnowledgeBasePage />);
    expect(getByText('Articles')).toBeInTheDocument();
    expect(getByText('Premiers pas avec ShopOpti+')).toBeInTheDocument();
  });

  it('renders video tab', () => {
    const { getByText } = render(<KnowledgeBasePage />);
    expect(getByText('Vidéos')).toBeInTheDocument();
  });

  it('renders FAQ tab', () => {
    const { getByText } = render(<KnowledgeBasePage />);
    expect(getByText('FAQ')).toBeInTheDocument();
  });

  it('renders category cards', () => {
    const { getByText } = render(<KnowledgeBasePage />);
    expect(getByText('Démarrage')).toBeInTheDocument();
    expect(getByText('Automatisation')).toBeInTheDocument();
  });

  it('renders search input', () => {
    const { getByPlaceholderText } = render(<KnowledgeBasePage />);
    expect(getByPlaceholderText(/Rechercher/)).toBeInTheDocument();
  });
});
