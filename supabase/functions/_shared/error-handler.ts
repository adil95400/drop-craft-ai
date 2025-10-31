/**
 * Secure Error Handler for Edge Functions
 * Prevents information leakage while maintaining debuggability
 */

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RateLimitError';
  }
}

/**
 * Returns a safe error message for the client while logging full details server-side
 */
export function handleError(error: unknown, corsHeaders: Record<string, string>) {
  // Log full error details for debugging (server-side only)
  console.error('Edge Function Error:', {
    name: error instanceof Error ? error.name : 'Unknown',
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString()
  });

  // Return safe error message to client
  let statusCode = 500;
  let clientMessage = 'An error occurred processing your request';

  if (error instanceof ValidationError) {
    statusCode = 400;
    clientMessage = error.message; // Validation errors are safe to expose
  } else if (error instanceof AuthenticationError) {
    statusCode = 401;
    clientMessage = 'Authentication required';
  } else if (error instanceof RateLimitError) {
    statusCode = 429;
    clientMessage = 'Rate limit exceeded. Please try again later.';
  } else if (error instanceof Error) {
    // For other errors, check if they contain sensitive information
    const sensitivePatterns = [
      /password/i,
      /token/i,
      /secret/i,
      /api[_-]?key/i,
      /database/i,
      /table/i,
      /column/i,
      /pg_/i,
      /supabase/i
    ];

    const isSensitive = sensitivePatterns.some(pattern => 
      pattern.test(error.message)
    );

    if (!isSensitive && error.message.length < 100) {
      // Short, non-sensitive error messages can be shown
      clientMessage = error.message;
    }
  }

  return new Response(
    JSON.stringify({ 
      error: clientMessage,
      timestamp: new Date().toISOString()
    }),
    { 
      status: statusCode, 
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      } 
    }
  );
}

/**
 * Wraps an async handler function with standardized error handling
 */
export function withErrorHandler(
  handler: (req: Request) => Promise<Response>,
  corsHeaders: Record<string, string>
) {
  return async (req: Request): Promise<Response> => {
    try {
      return await handler(req);
    } catch (error) {
      return handleError(error, corsHeaders);
    }
  };
}
