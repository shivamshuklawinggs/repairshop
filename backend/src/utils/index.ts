
import { TIME_FORMAT, TIME_FORMAT_HOURS } from 'config';
import moment from 'moment';
function formatDate(d: Date) {
    if(!d) return undefined
  return moment(d).format(TIME_FORMAT)
}
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
function formatDateTime(date: Date) {
  if (date) {
    const baseDate = moment(date);
    return baseDate.format(TIME_FORMAT_HOURS);
  }
   return undefined
}

function formatCurrency(val:any) {
  if (val == null || isNaN(val)) return '-';
  return '$' + Number(val).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
function cleanNullFields(doc: any, seen = new WeakSet()) {
  if (doc && typeof doc === "object") {
    if (seen.has(doc)) return; // prevent infinite loop on circular refs
    seen.add(doc);

    for (const key of Object.keys(doc)) {
      const value = doc[key];

      if (value === null || value === "") {
        doc[key] = undefined;
      } else if (typeof value === "object" && !Array.isArray(value)) {
        // Only recurse into plain objects, not mongoose internals
        if (!(value instanceof Date) && !(value instanceof Buffer) && !(value?._bsontype)) {
          cleanNullFields(value, seen);
        }
      }
    }
  }
}
const validPhoneNumber = (value:any) => {
  try {
    // const parsedNumber = phoneUtil.parse(value); // You can pass a second arg like 'US' as default region
    // return phoneUtil.isValidNumber(parsedNumber);
    // check phone number is valid or not
    let check = new RegExp(/^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/g).test(value);
    return !value ?true:check;
  } catch (error) {
    console.warn("error",error)
    return false;
  }
};
const validateTimeFormat = (value: string) => {
  if (!value) return true;

  // Accepts: 4:00, 04:00, 4:00 PM, 04:00 AM
  return moment(value, ['H:mm', 'HH:mm', 'h:mm A', 'hh:mm A'], true).isValid();
};





const parseSaferAddress = (address: string) => {
  const match = address.match(
    /^(.*)\s+([^,]+),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/
  );

  if (!match) {
    return {
      address:address,
      city: "",
      state: "",
      zipCode: "",
      country: "US",
    };
  }

  return {
    city: match[2].trim(),
    state: match[3].trim(),
    zipCode: match[4].trim(),
    country: "US",
    address:address
  };
};
export {parseSaferAddress ,validateTimeFormat, formatDate, formatCurrency,cleanNullFields,validPhoneNumber ,formatDateTime};