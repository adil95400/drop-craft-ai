import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { VisualWorkflowCanvas, type WorkflowNode } from '@/components/workflows/VisualWorkflowCanvas';

// Mock @dnd-kit
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: any) => <div>{children}</div>,
  closestCenter: vi.fn(),
  KeyboardSensor: vi.fn(),
  PointerSensor: vi.fn(),
  useSensor: vi.fn(() => ({})),
  useSensors: vi.fn(() => []),
}));

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: any) => <div>{children}</div>,
  sortableKeyboardCoordinates: vi.fn(),
  verticalListSortingStrategy: vi.fn(),
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
}));

vi.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: () => '' } },
}));

const TRIGGER_NODE: WorkflowNode = {
  id: '1',
  type: 'trigger',
  name: 'Nouvelle commande',
  icon: 'ShoppingCart',
  config: {},
  isConfigured: false,
};

const ACTION_NODE: WorkflowNode = {
  id: '2',
  type: 'action',
  name: 'Envoyer un email',
  icon: 'Mail',
  config: {},
  isConfigured: true,
};

describe('VisualWorkflowCanvas', () => {
  const mockOnNodesChange = vi.fn();
  const mockOnNodeSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows empty state when no nodes', () => {
    const { getByText } = render(
      <VisualWorkflowCanvas
        nodes={[]}
        onNodesChange={mockOnNodesChange}
        onNodeSelect={mockOnNodeSelect}
      />
    );
    expect(getByText('Canvas vide')).toBeInTheDocument();
    expect(getByText(/Ajouter la première étape/)).toBeInTheDocument();
  });

  it('renders nodes with correct labels', () => {
    const { getByText } = render(
      <VisualWorkflowCanvas
        nodes={[TRIGGER_NODE, ACTION_NODE]}
        onNodesChange={mockOnNodesChange}
        onNodeSelect={mockOnNodeSelect}
      />
    );
    expect(getByText('Nouvelle commande')).toBeInTheDocument();
    expect(getByText('Envoyer un email')).toBeInTheDocument();
  });

  it('shows step count badge', () => {
    const { getByText } = render(
      <VisualWorkflowCanvas
        nodes={[TRIGGER_NODE, ACTION_NODE]}
        onNodesChange={mockOnNodesChange}
      />
    );
    expect(getByText('2 étapes')).toBeInTheDocument();
  });

  it('shows "À configurer" badge for unconfigured nodes', () => {
    const { getByText } = render(
      <VisualWorkflowCanvas
        nodes={[TRIGGER_NODE]}
        onNodesChange={mockOnNodesChange}
      />
    );
    expect(getByText('À configurer')).toBeInTheDocument();
  });

  it('shows Trigger OK badge when trigger exists', () => {
    const { getByText } = render(
      <VisualWorkflowCanvas
        nodes={[TRIGGER_NODE]}
        onNodesChange={mockOnNodesChange}
      />
    );
    expect(getByText('Trigger OK')).toBeInTheDocument();
  });
});
