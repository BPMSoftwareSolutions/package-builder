// Cypress support file
// You can add global before/after hooks or commands here if needed.

import './commands';

// Preserve console logs for debugging harness <-> driver messaging
Cypress.on('window:before:load', () => {
  // no-op placeholder for future hooks
});
