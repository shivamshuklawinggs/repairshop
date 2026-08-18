import moment, { Moment } from 'moment';
import { DATE_TIME_FORMAT, TIME_FORMAT } from '@/config/constant';
export const combineDateAndTime = (
  date: Date | string,
  time: string
) => {
  if (!date || !time) return null;

  const baseDate = moment(date);

  const parsedTime = moment(
    time,
    ['H:mm', 'HH:mm', 'h:mm A', 'hh:mm A'],
    true
  )
    .year(baseDate.year())
    .month(baseDate.month())
    .date(baseDate.date());

  return parsedTime.isValid() ? parsedTime.toDate() : null;
};

/**
 * Format a date safely using Moment.js and your TIME_FORMAT constant.
 */
export const formatDate = (date?: Date): string => {
  try {
    if (!date) return '';
    return moment(date).format(TIME_FORMAT);
  } catch (error) {
    console.warn('Error formatting date:', error);
    return '';
  }
};
export const formatDateTime = (date?: Date): string => {
  try {
    if (!date) return '';
    return moment(date).format(DATE_TIME_FORMAT)
  } catch (error) {
    console.warn('Error formatting date:', error);
    return '';
  }
};

/**
 * Add or subtract days from a given date.
 * @param date Base date (Date | string | Moment)
 * @param days Number of days to add (negative to subtract)
 * @returns A new JavaScript Date
 */
export const addDays = (date: Date | string | Moment, days: number): Date => {
  return moment(date).add(days, 'days').toDate();
};



