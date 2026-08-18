export const QUEUE_NAMES = {
    INVOICE_GENERATION: 'invoice-generation',
    ESTIMATE_GENERATION: 'estimate-generation',
    BILL_GENERATION: 'bill-generation',
    AUTH: 'auth',
    users: 'users',
    Email: 'email',
    INVOICE_UPDATE_NOTIFICATION: 'invoice-update-notification',
    USER_GEOLOCATION: 'user-geolocation'
};

export const EXCHANGE_NAMES = {
    INVOICE: 'invoice-exchange',
    BILL: 'bill-exchange',
    AUTH: 'auth-exchange',
    users: 'users-exchange',
    ChatOfAccount: 'chatofaccount-exchange',
    Email: 'email-exchange',
    estimate: 'estimate-exchange',
};

export const ROUTING_KEYS = {
    INVOICE: {
        GENERATED: 'invoice.generated',
        UPDATED: 'invoice.updated',
        UPDATE_NOTIFICATION: 'invoice.update.notification',
    },
    ESTIMATE: {
        GENERATED: 'estimate.generated',
    },
    Email: {
        SEND: 'email.send'
    },
    BILL: {
        GENERATED: 'bill.generated',
        UPDATED: 'bill.updated',
    },
    AUTH: {
        RESET_PASSWORD: 'auth.reset-password',
    },
    users: {
        CREATE: 'users.create',
        UPDATE: 'users.update',
        DELETE: 'users.delete',
        GEOLOCATION: 'users.geolocation',
    },
};