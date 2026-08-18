import axios from 'axios';
import User from 'models/user.model';

interface GeolocationData {
  country?: string;
  countryCode?: string;
  city?: string;
  region?: string;
}

/**
 * Get country from IP address using ip-api.com (free service)
 * Alternative services: ipapi.co, ipgeolocation.io, etc.
 */
export const getCountryFromIP = async (ipAddress: string): Promise<GeolocationData> => {
  try {
    // Skip localhost/private IPs
    if (
      !ipAddress ||
      ipAddress === '::1' ||
      ipAddress === '127.0.0.1' ||
      ipAddress.startsWith('192.168.') ||
      ipAddress.startsWith('10.') ||
      ipAddress.startsWith('172.')
    ) {
      return { country: 'Unknown', countryCode: 'XX' };
    }

    // Use ip-api.com free service (no API key required, 45 requests/minute limit)
    const response = await axios.get(`http://ip-api.com/json/${ipAddress}`, {
      timeout: 5000,
    });

    if (response.data && response.data.status === 'success') {
      return {
        country: response.data.country || 'Unknown',
        countryCode: response.data.countryCode || 'XX',
        city: response.data.city,
        region: response.data.regionName,
      };
    }

    return { country: 'Unknown', countryCode: 'XX' };
  } catch (error) {
    console.error('Error fetching geolocation:', error);
    return { country: 'Unknown', countryCode: 'XX' };
  }
};

/**
 * Update user's country based on IP address
 */
export const updateUserCountry = async (userId: string, ipAddress: string): Promise<void> => {
  try {
    const geoData = await getCountryFromIP(ipAddress);
    
    await User.findByIdAndUpdate(userId, {
      country: geoData.country,
      ipAddress: ipAddress,
    });

    console.log(`Updated user ${userId} country to ${geoData.country} from IP ${ipAddress}`);
  } catch (error) {
    console.error('Error updating user country:', error);
  }
};
