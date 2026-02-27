/**
 * Service for managing driver profile data
 */

const API_BASE_URL = 'http://127.0.0.1:8000/api';

class DriverProfileService {
  /**
   * Get driver profile by ID
   * @param {number} driverId - The driver ID
   * @returns {Promise<Object>} Driver profile data
   */
  static async getDriverProfile(driverId) {
    try {
      const response = await fetch(`${API_BASE_URL}/driver/profile/${driverId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching driver profile:', error);
      throw error;
    }
  }

  /**
   * Update driver profile
   * @param {number} driverId - The driver ID
   * @param {Object} profileData - Profile data to update
   * @returns {Promise<Object>} Update response
   */
  static async updateDriverProfile(driverId, profileData) {
    try {
      const response = await fetch(`${API_BASE_URL}/driver/profile/${driverId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating driver profile:', error);
      throw error;
    }
  }

  /**
   * Get driver statistics
   * @param {number} driverId - The driver ID
   * @returns {Promise<Object>} Driver statistics
   */
  static async getDriverStats(driverId) {
    try {
      const response = await fetch(`${API_BASE_URL}/driver/stats/${driverId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching driver stats:', error);
      throw error;
    }
  }

  /**
   * Add driver certification
   * @param {number} driverId - The driver ID
   * @param {Object} certData - Certification data
   * @returns {Promise<Object>} Add certification response
   */
  static async addDriverCertification(driverId, certData) {
    try {
      const response = await fetch(`${API_BASE_URL}/driver/certifications/${driverId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(certData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error adding driver certification:', error);
      throw error;
    }
  }

  /**
   * Delete driver certification
   * @param {number} certId - The certification ID
   * @returns {Promise<Object>} Delete certification response
   */
  static async deleteDriverCertification(certId) {
    try {
      const response = await fetch(`${API_BASE_URL}/driver/certifications/${certId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error deleting driver certification:', error);
      throw error;
    }
  }
}

export default DriverProfileService;
