var app = angular.module("Calendar.Utils", []);

app.factory("Utils", function() {
  function groupBy(attribute, schedule, presentations) {
    var result = {};
    for(var i=0; i<schedule.length; i++) {
      var event = schedule[i];
      if (!result[event[attribute]]) {
        result[event[attribute]] = { name: event[attribute], events: []};
      }
      event.presentation = presentations[event.presentationId];
      result[event[attribute]].events.push(event);
    }
    return result;
  }

  function toHash(array) {
    var result = {};
    array.forEach(function(item) {
      result[item.id] = item;
    });
    return result;
  }

  return {
    groupBy: groupBy,
    toHash: toHash
  };
});