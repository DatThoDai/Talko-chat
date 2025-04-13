/**
 * Utility functions for common operations throughout the app
 */

const commonFuc = {
  /**
   * Get a summary string of reactions for display
   * @param {Array} reacts - Array of reaction objects
   * @returns {String} A string representation of the reactions
   */
  getReactionVisibleInfo: (reacts) => {
    if (!reacts || reacts.length === 0) return '';

    const types = {};
    
    reacts.forEach(react => {
      const type = react.type || react;
      if (types[type]) {
        types[type]++;
      } else {
        types[type] = 1;
      }
    });

    // Emoji mapping for reaction types
    const emojiMap = {
      like: '👍',
      love: '❤️',
      laugh: '😂',
      wow: '😮',
      sad: '😢',
      angry: '😡',
    };

    return Object.entries(types)
      .map(([type, count]) => {
        const emoji = emojiMap[type] || '👍';
        return `${emoji}${count > 1 ? ' ' + count : ''}`;
      })
      .join(' ');
  },

  /**
   * Format a file size in bytes to a human readable string
   * @param {Number} bytes - The file size in bytes
   * @returns {String} Formatted file size (e.g., "2.5 MB")
   */
  formatFileSize: (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let i = 0;
    
    while (bytes >= 1024 && i < units.length - 1) {
      bytes /= 1024;
      i++;
    }
    
    return `${bytes.toFixed(1)} ${units[i]}`;
  },

  /**
   * Generate avatar color based on a name
   * @param {String} name - The name to generate color from
   * @returns {String} A hex color code
   */
  generateColorFromName: (name) => {
    if (!name) return '#007AFF';
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const colors = [
      '#F44336', '#E91E63', '#9C27B0', '#673AB7', 
      '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4', 
      '#009688', '#4CAF50', '#8BC34A', '#CDDC39', 
      '#FFC107', '#FF9800', '#FF5722', '#795548'
    ];
    
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  },

  /**
   * Get initials from a name (up to 2 characters)
   * @param {String} name - The full name
   * @returns {String} The initials (e.g., "JD" for "John Doe")
   */
  getInitialsFromName: (name) => {
    if (!name) return '?';
    
    return name
      .split(' ')
      .map(part => part && part[0])
      .filter(Boolean)
      .join('')
      .toUpperCase()
      .slice(0, 2);
  },

  /**
   * Truncate text to a specified length with ellipsis
   * @param {String} text - The text to truncate
   * @param {Number} maxLength - The maximum length
   * @returns {String} Truncated text with ellipsis if needed
   */
  truncateText: (text, maxLength = 50) => {
    if (!text || text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  }
};

export default commonFuc;
