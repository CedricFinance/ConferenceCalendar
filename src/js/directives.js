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
    replace: true,
    scope: {
      event: "=value",
      selected: "=selected",
      clickHandler: "&click"
    },
    templateUrl: "partials/directives/event.html",
    link: function(scope, elt, attrs) {
      
      function convertToMillis(millis, date) {
        if (millis) {
          return millis;
        } else {
          return Date.parse(date);
        }
      }

      var fromMillis = convertToMillis(scope.event.fromTimeMillis, scope.event.fromTime);
      var from = new Date(fromMillis);
      var toMillis = convertToMillis(scope.event.toTimeMillis, scope.event.toTime);
      var durationInMinutes = (toMillis-fromMillis)/1000/60;
    
      var topOffset = TimeService.minutesToPixelsTicks(TimeService.dateToMinutesSinceMidnight(from)) - 1;
      var height = TimeService.minutesToPixels(durationInMinutes);
      elt.css({
        "marginTop": topOffset+"px",
        "height": height+"px"
      });

      elt.bind("click", function(event) {
        console.log("click")
        scope.$apply(function() {
          scope.selected = !scope.selected;
          scope.clickHandler({event: scope.event})
        });
      });

    }    
  }
});