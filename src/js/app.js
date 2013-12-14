var app = angular.module("Calendar", ['ui.router.state', 'Calendar.directives']);

app.config(function($stateProvider, $urlRouterProvider){
  //
  
  $urlRouterProvider
  .when('/conferences/:name', '/conferences/:name/1')
  .otherwise("/conferences/devoxx13") 
  //
  // Now set up the states
  $stateProvider
    .state('conferences', {
      url: "/conferences",
      templateUrl: "partials/conferences.html"
    })
    .state('conference', {
      url: "/conferences/:name/:day",
      templateUrl: "partials/conference.html",
      controller: "Day"
    })

});

app.controller("Day", function($stateParams, $scope, $http, $q) {
  
  function groupByRoom(schedule, presentations) {
    var result = {};
    for(var i=0; i<schedule.length; i++) {
      var event = schedule[i];
      if (!result[event.room]) {
        result[event.room] = { name: event.room, events: []};
      }
      event.presentation = presentations[event.presentationId];
      result[event.room].events.push(event);
    }
    return result;
  }
  
  function toHash(array) {
    var result = {};
    array.forEach(function(item) {
      result[item.id] = item;
    })
    return result;
  }
  
  $scope.days = [
    { number: 1, name: "mercredi", url: "data/devoxx-schedule-3.json" },
    { number: 2, name: "jeudi", url: "data/devoxx-schedule-4.json" },
    { number: 3, name: "vendredi", url: "data/devoxx-schedule-5.json"}
  ]
  $scope.selectedDay = parseInt($stateParams.day);

  $scope.confName = $stateParams.name;
  
  $scope.hours = [ 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
    
  $scope.selectedEvents = JSON.parse(window.localStorage.getItem("selectedEvents")) || {};
  
  $scope.isSelected = function(event) {
    return $scope.selectedEvents[event.id];
  }

  $scope.toggleEvent = function(event) {
    console.log("toggle")
    $scope.selectedEvents[event.id] = !$scope.selectedEvents[event.id];
    window.localStorage.setItem("selectedEvents", JSON.stringify($scope.selectedEvents));
  }
  
  var ajaxSchedule = $http.get($scope.days[$scope.selectedDay-1].url);
  
  var ajaxPresentations = $http.get("data/devoxx-presentations.json", { cache: true });
  
  $q.all([ajaxSchedule, ajaxPresentations]).then(function(values) {
    $scope.rooms = groupByRoom(values[0].data, toHash(values[1].data));
  });
});