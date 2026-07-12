/**
 * Shared Helper Utilities
 */

function sanitizeInput(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[<>'"&]/g, (m) => {
    const map = {
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;',
      '&': '&amp;'
    };
    return map[m];
  }).trim();
}

function parseNumber(val, defaultVal = 0) {
  const parsed = parseInt(val, 10);
  return isNaN(parsed) ? defaultVal : parsed;
}

module.exports = {
  sanitizeInput,
  parseNumber
};
