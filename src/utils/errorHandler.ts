import { AxiosError } from 'axios';

type ApiErrorResponse = {
  message?: string;
  errors?: Record<string, string[]>;
};

/**
 * Extract error message from an API error response
 */
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    const responseData = error.response?.data as ApiErrorResponse | undefined;
    
    // If there's a specific error message from the API
    if (responseData?.message) {
      return responseData.message;
    }
    
    // If there are validation errors
    if (responseData?.errors) {
      const firstErrorKey = Object.keys(responseData.errors)[0];
      if (firstErrorKey && responseData.errors[firstErrorKey]?.length > 0) {
        return responseData.errors[firstErrorKey][0];
      }
    }
    
    // Default error based on status code
    if (error.response) {
      switch (error.response.status) {
        case 401:
          return 'You are not authorized to perform this action';
        case 403:
          return 'You do not have permission to access this resource';
        case 404:
          return 'The requested resource was not found';
        case 422:
          return 'Validation failed for the submitted data';
        case 500:
          return 'An internal server error occurred';
        default:
          return `Server error (${error.response.status})`;
      }
    }
    
    return error.message || 'An unknown error occurred';
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unknown error occurred';
}; 