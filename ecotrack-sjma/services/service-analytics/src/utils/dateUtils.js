const { 
  startOfDay, endOfDay, 
  startOfWeek, endOfWeek,
  startOfMonth, endOfMonth,
  format
} = require('date-fns');
const { fr } = require('date-fns/locale');

class DateUtils {
  static getPeriodDates(period) {
    const now = new Date();
    
    switch(period) {
      case 'day':
        return { start: startOfDay(now), end: endOfDay(now) };
      case 'week':
        return { start: startOfWeek(now, { locale: fr }), end: endOfWeek(now, { locale: fr }) };
      case 'month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      default:
        return { start: startOfDay(now), end: endOfDay(now) };
    }
  }

  static formatDate(date, formatStr = 'dd/MM/yyyy') {
    return format(new Date(date), formatStr, { locale: fr });
  }
}

module.exports = DateUtils;