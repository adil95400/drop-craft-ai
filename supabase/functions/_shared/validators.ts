import { z } from 'https://esm.sh/zod@3.22.4'
import { ValidationError } from './error-handler.ts'

/**
 * Parse JSON body and validate with a Zod schema.
 * Throws ValidationError with safe, user-readable messages.
 */
export async function parseJsonValidated<T>(req: Request, schema: z.ZodType<T>): Promise<T> {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    throw new ValidationError('Corps de requête JSON invalide')
  }

  const result = schema.safeParse(body)
  if (!result.success) {
    const message = result.error.issues
      .slice(0, 3)
      .map((i) => (i.path.length ? `${i.path.join('.')}: ${i.message}` : i.message))
      .join(' | ')

    throw new ValidationError(message || 'Paramètres invalides')
  }

  return result.data
}

export { z }
