import type { FeedbackData, Metrics } from '../types';

/**
 * A more robust CSV parser that handles quoted fields.
 * This prevents errors when text fields in the sheet contain commas.
 * @param csvText The raw CSV string.
 * @returns A 2D array of strings representing the parsed data.
 */
function parseCsv(csvText: string): string[][] {
  const lines = csvText.trim().split(/\r?\n/);
  // This regex splits by comma but ignores commas inside double quotes.
  const regex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
  return lines.map(line => {
    // Edge case for empty lines
    if (line.trim() === '') return [];
    const parts = line.split(regex);
    return parts.map(field => field.trim().replace(/^"|"$/g, ''));
  });
}

function transformUrl(url: string): string {
    const sheetIdRegex = /spreadsheets\/d\/([a-zA-Z0-9-_]+)/;
    const gidRegex = /[#&]gid=([0-9]+)/;

    const sheetIdMatch = url.match(sheetIdRegex);
    if (!sheetIdMatch) {
        throw new Error("Invalid Google Sheet URL: Sheet ID not found.");
    }
    const sheetId = sheetIdMatch[1];

    let gid = '0';
    const gidMatch = url.match(gidRegex);
    if (gidMatch) {
        gid = gidMatch[1];
    }
    
    return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
}

export const fetchAndParseSheet = async (url: string): Promise<FeedbackData[]> => {
  try {
    const csvUrl = transformUrl(url);
    const response = await fetch(csvUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const csvText = await response.text();
    const rows = parseCsv(csvText);
    
    // Skip header row
    const dataRows = rows.slice(1);
    
    return dataRows
      .filter(row => row && row.length > 16) // Ensure row has enough columns
      .map(row => ({
        csatService: parseInt(row[0], 10) || 0,
        csatDelivery: parseInt(row[1], 10) || 0,
        csatPlatform: parseInt(row[2], 10) || 0,
        whyUs: row[3] || '',
        nps: parseInt(row[4], 10) || 0,
        whatBetter: row[5] || '',
        wowIdeas: row[6] || '',
        date: row[16] || '',
      }))
      .filter(row => row.date && !isNaN(row.nps)); // Filter out rows without a date or valid NPS score
  } catch (error) {
    console.error("Failed to fetch or parse sheet:", error);
    throw new Error("Could not fetch or parse the Google Sheet. Please check the URL and sharing settings.");
  }
};

export const calculateMetrics = (data: FeedbackData[]): Metrics => {
  // NPS Calculation
  let promoters = 0;
  let detractors = 0;
  let passives = 0;
  
  data.forEach(row => {
    if (row.nps >= 9) promoters++;
    else if (row.nps <= 6) detractors++;
    else passives++;
  });
  
  const totalNpsResponses = data.length;
  const npsScore = totalNpsResponses > 0 ? ((promoters - detractors) / totalNpsResponses) * 100 : 0;
  
  // CSAT Calculation
  const calculateCsat = (scores: number[]): number => {
    const satisfied = scores.filter(score => score >= 4).length;
    return scores.length > 0 ? (satisfied / scores.length) * 100 : 0;
  };

  const csatService = calculateCsat(data.map(d => d.csatService).filter(s => s > 0));
  const csatDelivery = calculateCsat(data.map(d => d.csatDelivery).filter(s => s > 0));
  const csatPlatform = calculateCsat(data.map(d => d.csatPlatform).filter(s => s > 0));

  return {
    nps: {
      score: Math.round(npsScore),
      promoters,
      passives,
      detractors,
      total: totalNpsResponses,
    },
    csat: {
      service: Math.round(csatService),
      delivery: Math.round(csatDelivery),
      platform: Math.round(csatPlatform),
    }
  };
};