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
    let start, end;
    
    switch(period) {
      case 'day':
        start = startOfDay(now);
        end = endOfDay(now);
        break;
      case 'week':
        start = startOfWeek(now, { locale: fr });
        end = endOfWeek(now, { locale: fr });
        break;
      case 'month':
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      default:
        start = startOfDay(now);
        end = endOfDay(now);
    }
    
    return {
      start: format(start, 'yyyy-MM-dd'),
      end: format(end, 'yyyy-MM-dd')
    };
  }

  static formatDate(date, formatStr = 'dd/MM/yyyy') {
    return format(new Date(date), formatStr, { locale: fr });
  }
}

module.exports = DateUtils;