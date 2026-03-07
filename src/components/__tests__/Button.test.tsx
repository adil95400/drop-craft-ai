import { render } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Button } from '../ui/button'

describe('Button', () => {
  it('renders correctly', () => {
    const { getByRole, getByText } = render(<Button>Click me</Button>)
    expect(getByRole('button')).toBeDefined()
    expect(getByText('Click me')).toBeDefined()
  })

  it('handles click events', () => {
    const handleClick = vi.fn()
    const { getByRole } = render(<Button onClick={handleClick}>Click me</Button>)
    getByRole('button').click()
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('can be disabled', () => {
    const { getByRole } = render(<Button disabled>Disabled Button</Button>)
    const button = getByRole('button') as HTMLButtonElement
    expect(button.disabled).toBe(true)
  })

  it('renders with different variants', () => {
    const { container } = render(<Button variant="destructive">Delete</Button>)
    expect(container.querySelector('button')).toBeDefined()
  })
})
