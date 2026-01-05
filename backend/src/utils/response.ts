import { APIGatewayProxyResultV2 } from 'aws-lambda';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

/**
 * Create a successful JSON response
 */
export function success<T>(data: T, statusCode = 200): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
    body: JSON.stringify(data),
  };
}

/**
 * Create an error JSON response
 */
export function error(
  message: string,
  statusCode = 400,
  details?: string
): APIGatewayProxyResultV2 {
  const body: { error: string; details?: string } = { error: message };
  if (details) {
    body.details = details;
  }
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
    body: JSON.stringify(body),
  };
}

/**
 * Create a validation error response from Zod errors
 */
export function validationError(zodError: {
  errors: Array<{ message: string; path: (string | number)[] }>;
}): APIGatewayProxyResultV2 {
  const firstError = zodError.errors[0];
  const path = firstError.path.join('.');
  const message = path
    ? `${path}: ${firstError.message}`
    : firstError.message;
  return error(`Validation error: ${message}`, 400);
}

