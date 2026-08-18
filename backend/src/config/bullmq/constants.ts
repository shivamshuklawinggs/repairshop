export const QUEUE_NAMES = {
    INVOICE_REMINDER: 'invoice-reminder',
    RATING: 'rating',
    NOTIFICATION: 'notification'
};

export const JOB_NAMES = {
    INVOICE: {
        sendReminder: 'invoice.sendReminder',
        sendManualReminder: 'invoice.sendManualReminder',
    },
    RATING: {
        CARRIER: 'CARRIER',
        CUSTOMER: 'CUSTOMER',
    },
    NOTIFICATION: {
        productServiceReminder: 'notification.productServiceReminder',
    },
};

export const JOB_PRIORITIES = {
    HIGH: 10,
    MEDIUM: 5,
    LOW: 1
};

export const JOB_DELAYS = {
    IMMEDIATE: 0,
    SECONDS_30: 30 * 1000,
    MINUTES_1: 60 * 1000,
    MINUTES_2: 2 * 60 * 1000,
    MINUTES_5: 5 * 60 * 1000,
    MINUTES_15: 15 * 60 * 1000,
    MINUTES_30: 30 * 60 * 1000,
    HOURS_1: 60 * 60 * 1000,
    HOURS_6: 6 * 60 * 60 * 1000,
    HOURS_24: 24 * 60 * 1000
} as const;
