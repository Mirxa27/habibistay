module.exports = {
  // Lint and format TypeScript/JavaScript files
  '**/*.{js,jsx,ts,tsx}': [
    'eslint --fix',
    'prettier --write',
  ],
  
  // Format other files
  '**/*.{json,md,yml,yaml}': [
    'prettier --write',
  ],
  
  // Run type checking on TypeScript files
  '**/*.{ts,tsx}': [
    'tsc --noEmit',
  ],
  
  // Run tests related to changed files
  '**/*.{test,spec}.{js,jsx,ts,tsx}': [
    'jest --bail --findRelatedTests',
  ],
};