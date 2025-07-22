// Country mapping for coordinates to ISO country codes
export const COUNTRY_MAPPING = {
  // North America
  'United States': 'USA',
  'USA': 'USA', 
  'US': 'USA',
  'Canada': 'CAN',
  'Mexico': 'MEX',
  
  // Europe
  'United Kingdom': 'GBR',
  'UK': 'GBR',
  'Germany': 'DEU',
  'France': 'FRA',
  'Italy': 'ITA',
  'Spain': 'ESP',
  'Netherlands': 'NLD',
  'Sweden': 'SWE',
  'Norway': 'NOR',
  'Ireland': 'IRL',
  'Poland': 'POL',
  'Belgium': 'BEL',
  'Switzerland': 'CHE',
  'Austria': 'AUT',
  'Denmark': 'DNK',
  'Finland': 'FIN',
  'Portugal': 'PRT',
  'Czech Republic': 'CZE',
  'Hungary': 'HUN',
  'Romania': 'ROU',
  'Bulgaria': 'BGR',
  'Greece': 'GRC',
  'Croatia': 'HRV',
  'Slovenia': 'SVN',
  'Slovakia': 'SVK',
  'Estonia': 'EST',
  'Latvia': 'LVA',
  'Lithuania': 'LTU',
  'Turkey': 'TUR',
  
  // Asia Pacific
  'Japan': 'JPN',
  'South Korea': 'KOR',
  'China': 'CHN',
  'India': 'IND',
  'Singapore': 'SGP',
  'Hong Kong': 'HKG',
  'Australia': 'AUS',
  'New Zealand': 'NZL',
  'Thailand': 'THA',
  'Malaysia': 'MYS',
  'Indonesia': 'IDN',
  'Philippines': 'PHL',
  'Vietnam': 'VNM',
  'Taiwan': 'TWN',
  
  // Middle East & Africa
  'United Arab Emirates': 'ARE',
  'UAE': 'ARE',
  'Saudi Arabia': 'SAU',
  'Israel': 'ISR',
  'South Africa': 'ZAF',
  'Egypt': 'EGY',
  'Nigeria': 'NGA',
  'Kenya': 'KEN',
  'Ethiopia': 'ETH',
  
  // South America
  'Brazil': 'BRA',
  'Argentina': 'ARG',
  'Chile': 'CHL',
  'Peru': 'PER',
  'Colombia': 'COL',
  'Venezuela': 'VEN',
  'Ecuador': 'ECU',
  'Uruguay': 'URY',
  'Paraguay': 'PRY',
  'Bolivia': 'BOL',
  
  // Oceania
  'Fiji': 'FJI',
  'Papua New Guinea': 'PNG',
  
  // Additional regions based on cloud regions
  'N. Virginia': 'USA',
  'Virginia': 'USA',
  'Ohio': 'USA',
  'N. California': 'USA',
  'California': 'USA',
  'Oregon': 'USA',
  'London': 'GBR',
  'Paris': 'FRA',
  'Frankfurt': 'DEU',
  'Stockholm': 'SWE',
  'Mumbai': 'IND',
  'Tokyo': 'JPN',
  'Seoul': 'KOR',
  'Sydney': 'AUS',
  'São Paulo': 'BRA',
  'Cape Town': 'ZAF',
  'Bahrain': 'BHR'
};

// Coordinate to country mapping based on lat/lng bounds
export const getCountryFromCoordinates = (lat, lng) => {
  // Simple coordinate-based country detection
  // This is a basic implementation - in production you'd use a proper geocoding service
  
  // North America
  if (lat >= 25 && lat <= 83 && lng >= -168 && lng <= -52) {
    if (lat >= 49 || (lat >= 25 && lng <= -95)) {
      return lng >= -141 && lat >= 60 ? 'CAN' : 'USA';
    }
    if (lat >= 14 && lat <= 33 && lng >= -118 && lng <= -86) {
      return 'MEX';
    }
    return 'USA'; // Default for North America
  }
  
  // Europe
  if (lat >= 35 && lat <= 71 && lng >= -25 && lng <= 45) {
    if (lng >= -10 && lng <= 2 && lat >= 50 && lat <= 61) return 'GBR';
    if (lng >= -5 && lng <= 9 && lat >= 42 && lat <= 51) return 'FRA';
    if (lng >= 6 && lng <= 15 && lat >= 47 && lat <= 55) return 'DEU';
    if (lng >= 6 && lng <= 19 && lat >= 36 && lat <= 47) return 'ITA';
    if (lng >= -10 && lng <= 5 && lat >= 35 && lat <= 44) return 'ESP';
    if (lng >= 3 && lng <= 7 && lat >= 50 && lat <= 54) return 'NLD';
    if (lng >= 11 && lng <= 24 && lat >= 55 && lat <= 69) return 'SWE';
    if (lng >= 4 && lng <= 31 && lat >= 58 && lat <= 71) return 'NOR';
    if (lng >= -11 && lng <= -5 && lat >= 51 && lat <= 56) return 'IRL';
    if (lng >= 26 && lng <= 45 && lat >= 35 && lat <= 42) return 'TUR';
    return 'DEU'; // Default for Europe
  }
  
  // Asia Pacific
  if (lat >= -50 && lat <= 82 && lng >= 60 && lng <= 180) {
    if (lng >= 129 && lng <= 146 && lat >= 30 && lat <= 46) return 'JPN';
    if (lng >= 124 && lng <= 132 && lat >= 33 && lat <= 39) return 'KOR';
    if (lng >= 68 && lng <= 97 && lat >= 6 && lat <= 37) return 'IND'; // India first, more specific range
    if (lng >= 103 && lng <= 104 && lat >= 1 && lat <= 2) return 'SGP';
    if (lng >= 95 && lng <= 135 && lat >= 15 && lat <= 54) return 'CHN'; // China adjusted to not overlap with India
    if (lng >= 113 && lng <= 180 && lat >= -45 && lat <= -10) return 'AUS';
    return 'CHN'; // Default for Asia
  }
  
  // Middle East & Africa
  if (lat >= -35 && lat <= 38 && lng >= -20 && lng <= 60) {
    if (lat >= -35 && lat <= -22 && lng >= 16 && lng <= 33) return 'ZAF';
    if (lat >= 22 && lat <= 32 && lng >= 24 && lng <= 37) return 'EGY';
    if (lat >= 4 && lat <= 14 && lng >= 2 && lng <= 15) return 'NGA';
    if (lat >= -5 && lat <= 5 && lng >= 33 && lng <= 42) return 'KEN';
    if (lat >= 3 && lat <= 15 && lng >= 33 && lng <= 48) return 'ETH';
    if (lat >= 22 && lat <= 27 && lng >= 51 && lng <= 57) return 'ARE';
    return 'EGY'; // Default for Middle East/Africa
  }
  
  // South America
  if (lat >= -56 && lat <= 13 && lng >= -82 && lng <= -34) {
    if (lat >= -34 && lat <= 6 && lng >= -74 && lng <= -34) return 'BRA';
    if (lat >= -55 && lat <= -21 && lng >= -74 && lng <= -53) return 'ARG';
    if (lat >= -56 && lat <= -17 && lng >= -76 && lng <= -66) return 'CHL';
    if (lat >= -19 && lat <= 0 && lng >= -82 && lng <= -68) return 'PER';
    if (lat >= -5 && lat <= 13 && lng >= -79 && lng <= -66) return 'COL';
    return 'BRA'; // Default for South America
  }
  
  // Default fallback
  return 'USA';
};

// Get country code from region text
export const getCountryFromRegion = (regionText) => {
  const text = regionText.toLowerCase();
  
  // Check direct mappings first
  for (const [region, code] of Object.entries(COUNTRY_MAPPING)) {
    if (text.includes(region.toLowerCase())) {
      return code;
    }
  }
  
  // Fallback patterns
  if (text.includes('us-') || text.includes('virginia') || text.includes('ohio') || text.includes('california') || text.includes('oregon')) {
    return 'USA';
  }
  if (text.includes('eu-') || text.includes('europe')) {
    if (text.includes('ireland') || text.includes('dublin')) return 'IRL';
    if (text.includes('london') || text.includes('uk')) return 'GBR';
    if (text.includes('paris') || text.includes('france')) return 'FRA';
    if (text.includes('frankfurt') || text.includes('germany')) return 'DEU';
    if (text.includes('stockholm') || text.includes('sweden')) return 'SWE';
    return 'DEU'; // Default EU
  }
  if (text.includes('ap-') || text.includes('asia')) {
    if (text.includes('singapore')) return 'SGP';
    if (text.includes('tokyo') || text.includes('japan')) return 'JPN';
    if (text.includes('seoul') || text.includes('korea')) return 'KOR';
    if (text.includes('mumbai') || text.includes('india')) return 'IND';
    if (text.includes('sydney') || text.includes('australia')) return 'AUS';
    return 'SGP'; // Default Asia Pacific
  }
  if (text.includes('sa-') || text.includes('south america')) {
    return 'BRA';
  }
  if (text.includes('ca-') || text.includes('canada')) {
    return 'CAN';
  }
  if (text.includes('af-') || text.includes('africa')) {
    return 'ZAF';
  }
  if (text.includes('me-') || text.includes('middle east')) {
    return 'BHR';
  }
  
  return 'USA'; // Ultimate fallback
};
