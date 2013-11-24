var module = angular.module("Calendar.services", []);

module.service("TimeService", function() {
  var config = {
    startHour: 8,
    pixelsPerHour: 100
  };
  
  return {
    minutesToPixelsTicks: function(minutes) {
      return (minutes - config.startHour*60) * (config.pixelsPerHour-1) / 60;
    },
    dateToMinutesSinceMidnight: function(date) {
      return date.getHours()*60+date.getMinutes();
    },
    minutesToPixels: function(minutes) {
      return minutes * config.pixelsPerHour / 60;
    }
  }
})