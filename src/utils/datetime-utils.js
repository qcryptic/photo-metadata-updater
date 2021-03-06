module.exports = {
  parseDatetime: function(datetime) {
    let res = { "date": "1970-01-01", "time": "00:00:00", "datetime": "1970-01-01 00:00:00" };
    if (datetime !== undefined) {
      let split = datetime.split(" ");
      let date = split[0].replaceAll(":", "-");
      let time = split[1];

      // Remove timezone offset and utc formatting
      time = time.includes('+') ? time.split('+')[0] : time;
      time = time.includes('-') ? time.split('-')[0] : time;
      time = time.replaceAll('Z', '');

      res.date = date;
      res.time = time;
      res.datetime = `${date} ${time}`;
    }
    return res;
  },

  getDateTimeUtcFormat: function(date, time) {
    return `${date}T${time}Z`
  },

  encodeOffset: function(offset) {
    return `${offset.sign}${pad(offset.hours)}${pad(offset.minutes)}`;
  },

  decodeOffset: function(offsetString) {
    return { 
      hours: Number(offsetString.substr(1, 2)), 
      minutes: Number(offsetString.substr(3)), 
      sign: offsetString.charAt(0)
    };
  },

  offsetDatetime: function(off, date, time) {
    let localOffset = off;
    if (typeof localOffset === 'string' || localOffset instanceof String) {
      localOffset = module.exports.decodeOffset(localOffset);
    }

    const offsetMinutes = Number(`${localOffset.sign}${localOffset.minutes}`);
    const offsetHours = Number(`${localOffset.sign}${localOffset.hours}`);
    const totalOffsetMills = (offsetHours * 60 + offsetMinutes) * 60 * 1000;

    const adjustedMillis = Date.parse(`${date} ${time}`) + (totalOffsetMills * -1);
    const adjusted = new Date(adjustedMillis);
    
    const adjustedDate = `${adjusted.getFullYear()}-${pad(adjusted.getMonth()+1)}-${pad(adjusted.getDate())}`;
    const adjustedTime = `${pad(adjusted.getHours())}:${pad(adjusted.getMinutes())}:${pad(adjusted.getSeconds())}`;
    return { date: adjustedDate, time: adjustedTime, datetime: `${adjustedDate} ${adjustedTime}` };
  },

  determineOffset: function(utcTime, locTime) {
    const utcMins = Date.parse(utcTime) / 60000;
    const locMins = Date.parse(locTime) / 60000;
    let diff = Math.trunc(locMins - utcMins);
    diff = Math.round(diff / 15) * 15; // round to nearest multiple of 15
    const diffHour = pad(Math.abs(Math.trunc(diff / 60)));
    const diffMins = pad(Math.abs(diff % 60));
    return `${diff <= 0 ? '-' : '+'}${diffHour}${diffMins}`
  },

  isValidOffset: function(offset) {
    return /^[+-]{1}[0-1]{1}[0-9]{1}[0-5]{1}[0-9]{1}$/.test(offset);
  },

  isValidDate: function(date) {
    return /^\d{4}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])$/.test(date);
  },

  isValidTime: function(time) {
    return /^(?:(?:([01]?\d|2[0-3]):)?([0-5]?\d):)?([0-5]?\d)$/.test(time);
  }
}

function pad(num, amount = 2) {
  return String(num).padStart(amount, '0');
}