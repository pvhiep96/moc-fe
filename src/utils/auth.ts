'use client';

import Cookies from 'js-cookie';

// Cookie options with secure settings
const cookieOptions = {
  expires: 7, // 7 days
  path: '/',
  secure: process.env.NODE_ENV === 'production',
};

/**
 * Set auth token in cookies
 */
export const setAuthCookie = (token: string) => {
  Cookies.set('accessToken', token, cookieOptions);
};

/**
 * Remove auth token from cookies
 */
export const removeAuthCookie = () => {
  Cookies.remove('accessToken', { path: '/' });
};

/**
 * Get auth token from cookies
 */
export const getAuthCookie = () => {
  return Cookies.get('accessToken');
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  return !!getAuthCookie();
}; 