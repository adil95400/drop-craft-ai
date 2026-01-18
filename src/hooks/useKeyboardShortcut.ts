/**
 * useKeyboardShortcut - Optimized keyboard shortcut hook
 * Uses useCallback for stable handler references
 */
import { useEffect, useCallback, useRef } from 'react'

interface KeyboardShortcutOptions {
  /** The key to listen for (e.g., 'k', 'Escape', 'Enter') */
  key: string
  /** Require Cmd (Mac) / Ctrl (Windows) modifier */
  cmdOrCtrl?: boolean
  /** Require Shift modifier */
  shift?: boolean
  /** Require Alt modifier */
  alt?: boolean
  /** Callback function when shortcut is triggered */
  onTrigger: () => void
  /** Whether the shortcut is currently enabled */
  enabled?: boolean
}

export function useKeyboardShortcut({
  key,
  cmdOrCtrl = false,
  shift = false,
  alt = false,
  onTrigger,
  enabled = true,
}: KeyboardShortcutOptions): void {
  // Store callback in ref to avoid recreating handler
  const callbackRef = useRef(onTrigger)
  callbackRef.current = onTrigger

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Check if key matches (case-insensitive)
    if (event.key.toLowerCase() !== key.toLowerCase()) return

    // Check modifiers
    const cmdOrCtrlPressed = event.metaKey || event.ctrlKey
    const shiftPressed = event.shiftKey
    const altPressed = event.altKey

    if (cmdOrCtrl && !cmdOrCtrlPressed) return
    if (shift && !shiftPressed) return
    if (alt && !altPressed) return

    // Prevent default behavior
    event.preventDefault()
    
    // Call the callback
    callbackRef.current()
  }, [key, cmdOrCtrl, shift, alt])

  useEffect(() => {
    if (!enabled) return

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown, enabled])
}

// Convenience hook for Cmd/Ctrl+K (common search shortcut)
export function useSearchShortcut(onTrigger: () => void, enabled = true): void {
  useKeyboardShortcut({
    key: 'k',
    cmdOrCtrl: true,
    onTrigger,
    enabled,
  })
}

// Convenience hook for Escape key
export function useEscapeShortcut(onTrigger: () => void, enabled = true): void {
  useKeyboardShortcut({
    key: 'Escape',
    onTrigger,
    enabled,
  })
}
