var module = angular.module("Calendar.directives", ["Calendar.services"]);

module.directive("time", function(TimeService) {
  return {
    restrict: 'A',
    link: function(scope, elt, attrs) {      
      var topOffset = TimeService.minutesToPixelsTicks(parseInt(attrs.time)) - 1;
      elt.css({ "top": topOffset });
    }
  }
});

module.directive("event", function(TimeService) {
  return {
    restrict: 'E',
    transclude: true,
    replace: true,
    scope: {
      startTime: "@startTime",
      endTime: "@endTime"
    },
    templateUrl: "partials/directives/event.html",
    link: function(scope, elt, attrs) {
      
      var from = Date.parse(scope.startTime);
      var fromDate = new Date(from);
      var to = Date.parse(scope.endTime);
      var durationInMinutes = (to-from)/1000/60;
    
      var topOffset = TimeService.minutesToPixelsTicks(TimeService.dateToMinutesSinceMidnight(fromDate)) - 1;
      var height = TimeService.minutesToPixels(durationInMinutes);
      elt.css({
        "marginTop": topOffset+"px",
        "height": height+"px"
      });

    }    
  }
});