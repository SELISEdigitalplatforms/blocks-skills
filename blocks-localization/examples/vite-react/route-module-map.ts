/**
 * Route-to-Module Map
 *
 * Maps application routes to the translation modules that should be loaded
 * when the user navigates to that route. Each route maps to an array of
 * module names; 'common' is typically always included.
 *
 * Edit this map to match your application's routes and module structure.
 */

export const routeModuleMap: Record<string, string[]> = {
  '/dashboard': ['common', 'dashboard'],
  '/profile': ['common', 'profile'],
  '/settings': ['common', 'settings'],
  // Add more routes as needed:
  // '/users':    ['common', 'users'],
  // '/reports':  ['common', 'reports'],
};
