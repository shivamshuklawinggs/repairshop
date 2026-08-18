
import { invoiceProducers } from './invoice.producer';
import { ratingProducers } from './rating.producer';
import { notificationProducers } from './notification.producer';

// Export all producers
export const producers = {
  rating: ratingProducers,
  invoice: invoiceProducers,
  notification: notificationProducers,
};
