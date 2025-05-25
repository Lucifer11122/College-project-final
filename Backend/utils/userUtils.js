/**
 * Utility functions for user management
 */

/**
 * Generate a username based on first and last name
 * @param {string} firstName - User's first name
 * @param {string} lastName - User's last name
 * @returns {string} - Generated username
 */
export const generateUsername = (firstName, lastName) => {
  // Convert to lowercase and remove spaces/special characters
  const cleanFirstName = firstName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanLastName = lastName.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  // Create base username (first name + first letter of last name)
  let baseUsername = cleanFirstName + cleanLastName.charAt(0);
  
  // Add a random number to make it more unique
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  
  return baseUsername + randomNum;
};

/**
 * Generate a random temporary password
 * @returns {string} - Generated password
 */
export const generateTemporaryPassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  
  // Generate a 10-character password
  for (let i = 0; i < 10; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    password += chars[randomIndex];
  }
  
  return password;
};

export default {
  generateUsername,
  generateTemporaryPassword
};
