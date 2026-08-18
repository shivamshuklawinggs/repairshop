const todayDate = new Date()
todayDate.setHours(0, 0, 0, 0)
const todayEndDate = new Date()
todayEndDate.setHours(23, 59, 59, 999)
const TIME_FORMAT: string = 'MM/DD/YYYY'

const DATE_TIME_FORMAT: string = 'MM/DD/YYYY HH:mm'

const TIME_ZONE: string = import.meta.env.VITE_TIME_ZONE

const HOUR_MINUTE_FORMAT = 'HH:mm'

const REPORT_TIME_FORMAT = 'dddd, MMMM DD, YYYY hh:mm A [GMT]Z'

const DATE_PICKER_TIME_FORMAT: string = 'MM/dd/yyyy'
// Global default timezone
const DEFAULT_TIMEZONE = 'America/Los_Angeles'

export {
    todayDate, 
    DEFAULT_TIMEZONE,
    todayEndDate,
    TIME_FORMAT,
    TIME_ZONE,
    HOUR_MINUTE_FORMAT,
    REPORT_TIME_FORMAT,
    DATE_PICKER_TIME_FORMAT,
    DATE_TIME_FORMAT
}