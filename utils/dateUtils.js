import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

/**
 * Format a date for message timestamp display
 * @param {string|Date} dateStr - The date to format (ISO string or Date object)
 * @returns {string} Formatted date string
 */
export const formatMessageDate = (dateStr) => {
  if (!dateStr) return '';
  
  try {
    const date = new Date(dateStr);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return '';
    }
    
    const now = new Date();
    
    // If the message is from today, just show the time
    if (isToday(date)) {
      return format(date, 'HH:mm', { locale: vi });
    }
    
    // If the message is from yesterday, show "Yesterday" and time
    if (isYesterday(date)) {
      return `Hôm qua, ${format(date, 'HH:mm', { locale: vi })}`;
    }
    
    // If the message is from this year, show the day, month, and time
    if (date.getFullYear() === now.getFullYear()) {
      return format(date, 'd MMM, HH:mm', { locale: vi });
    }
    
    // If the message is from a different year, show the full date
    return format(date, 'd MMM yyyy, HH:mm', { locale: vi });
  } catch (error) {
    console.error('Error formatting message date:', error);
    return '';
  }
};

/**
 * Format a date for conversation list display
 * @param {string|Date} dateStr - The date to format (ISO string or Date object)
 * @returns {string} Formatted date string
 */
export const formatConversationDate = (dateStr) => {
  if (!dateStr) return '';
  
  try {
    const date = new Date(dateStr);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return '';
    }
    
    // If the conversation is from today, just show the time
    if (isToday(date)) {
      return format(date, 'HH:mm', { locale: vi });
    }
    
    // If the conversation is from yesterday, show "Yesterday"
    if (isYesterday(date)) {
      return 'Hôm qua';
    }
    
    // If the conversation is from this week, show the day name
    const daysDiff = Math.floor((new Date() - date) / (1000 * 60 * 60 * 24));
    if (daysDiff < 7) {
      return format(date, 'EEEE', { locale: vi });
    }
    
    // Otherwise, show the date in a more concise format
    const now = new Date();
    if (date.getFullYear() === now.getFullYear()) {
      return format(date, 'd MMM', { locale: vi });
    }
    
    return format(date, 'd MMM yyyy', { locale: vi });
  } catch (error) {
    console.error('Error formatting conversation date:', error);
    return '';
  }
};

/**
 * Format a time-only string (for messages)
 * @param {string|Date} dateStr - The date to format (ISO string or Date object)
 * @returns {string} Formatted time string (HH:mm)
 */
export const formatMessageTime = (dateStr) => {
  if (!dateStr) return '';
  
  try {
    const date = new Date(dateStr);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return '';
    }
    
    return format(date, 'HH:mm', { locale: vi });
  } catch (error) {
    console.error('Error formatting message time:', error);
    return '';
  }
};

/**
 * Format a date in "ago" format (e.g., "2 minutes ago")
 * @param {string|Date} dateStr - The date to format (ISO string or Date object)
 * @returns {string} Formatted relative time string
 */
export const formatTimeAgo = (dateStr) => {
  if (!dateStr) return '';
  
  try {
    const date = new Date(dateStr);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return '';
    }
    
    return formatDistanceToNow(date, { addSuffix: true, locale: vi });
  } catch (error) {
    console.error('Error formatting time ago:', error);
    return '';
  }
};

/**
 * Format a date for displaying in user profile
 * @param {string|Date} dateStr - The date to format (ISO string or Date object)
 * @returns {string} Formatted date string (DD/MM/YYYY)
 */
export const formatProfileDate = (dateStr) => {
  if (!dateStr) return '';
  
  try {
    const date = new Date(dateStr);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return '';
    }
    
    return format(date, 'dd/MM/yyyy', { locale: vi });
  } catch (error) {
    console.error('Error formatting profile date:', error);
    return '';
  }
};

/**
 * Get a date object from a profile date string (DD/MM/YYYY)
 * @param {string} dateStr - The date string in DD/MM/YYYY format
 * @returns {Date|null} Date object or null if invalid
 */
export const parseProfileDate = (dateStr) => {
  if (!dateStr) return null;
  
  try {
    const [day, month, year] = dateStr.split('/');
    const date = new Date(year, month - 1, day);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return null;
    }
    
    return date;
  } catch (error) {
    console.error('Error parsing profile date:', error);
    return null;
  }
};

export default {
  formatMessageDate,
  formatConversationDate,
  formatMessageTime,
  formatTimeAgo,
  formatProfileDate,
  parseProfileDate
};
