import fs from 'fs';
import moment from 'moment';


const createRegex = (value: string) => {
  return new RegExp(value.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi",)
}

const parseJSON = (value: string | undefined, IsReturnValue?: boolean) => {
  if (!value) return undefined;
  try {
    return JSON.parse(value);
  } catch (error) {
    console.warn('Error parsing JSON:', error);
    return !IsReturnValue ? undefined : value;
  }
}

// Ensure all required directories exist
const ensureDirectoryExists = (directory: string) => {
  if (!fs.existsSync(directory)) {
    try {
      fs.mkdirSync(directory, { recursive: true });
      console.info(`Created directory: ${directory}`);
    } catch (error) {
      console.warn(`Error creating directory ${directory}:`, error);
      throw new Error(`Failed to create upload directory: ${directory}`);
    }
  }
};

/**
 * Combines a Date object and a time string (HH:mm) into a full Date in IST timezone.
 * @param date Date-only (no time)
 * @param time Time string in HH:mm format
 * @returns Date object representing IST datetime
 */

function combineDateAndTime(date: Date, time: string): Date | null {
  try {
    if (!date || !time) return null;

    const timeMatch = time.match(/^(\d{1,2}):(\d{2})$/);
    if (!timeMatch) return null;

    const hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);

    return moment(date)
      .hours(hours)
      .minutes(minutes)
      .seconds(0)
      .milliseconds(0)
      .toDate();

  } catch (error) {
    console.warn('Error combining date and time:', error);
    return null;
  }
}
// capitalize first letter and after space first letter also
const capitalizeFirstLetter = (str: string) => {
  return str ? str.replace(/\b\w/g, (char) => char.toUpperCase()) : "";
}

export { createRegex, parseJSON, ensureDirectoryExists, combineDateAndTime, capitalizeFirstLetter }