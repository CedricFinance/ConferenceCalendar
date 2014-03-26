var app = angular.module("Calendar", ['ui.router.state', 'Calendar.directives', 'Calendar.ConferenceServices']);

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
      url: "/conferences/:name",
      abstract: true,
      templateUrl: "partials/abstractconference.html",
      controller: "Conference"
    })
    .state('conference.day', {
      url: "/:day",
      templateUrl: "partials/conference.html",
      controller: "Day"
    })

});

app.controller("Conference", function($stateParams, $scope, ConferenceService) {
  $scope.confName = $stateParams.name;

  $scope.hours = [ 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];

  $scope.conference = ConferenceService.find($stateParams.name);

  $scope.rooms = $scope.conference.rooms.map(function(roomName) {
    return { name: roomName, events: [] };
  });

  function findByName(name, collection) {
    for(var i=0; i<collection.length; i++) {
      var item = collection[i];
      if (item.name==name) {
        return item;
      }
    }
  }

  $scope.clearRoomEvents = function() {
    $scope.rooms.forEach(function(room) {
      room.events = [];
    });
  }

  $scope.setRoomEvents = function(roomName, events) {
    var room = findByName(roomName, $scope.rooms);
    if (room) {
      room.events = events;
    } else {
      console.log("Object with name '"+roomName+"' not found for events:")
      console.log(events);
    }
  };

  $scope.days = $scope.conference.schedules;

  $scope.selectedDay = 1;

  $scope.selectDay = function(day) {
    $scope.selectedDay = day;
  }
});

app.controller("Day", function($stateParams, $scope, $http, $q) {

  $scope.selectDay(parseInt($stateParams.day));
    
  $scope.selectedEvents = JSON.parse(window.localStorage.getItem("selectedEvents")) || {};
  
  $scope.isSelected = function(event) {
    return $scope.selectedEvents[event.id];
  }

  $scope.toggleEvent = function(event) {
    console.log("toggle")
    $scope.selectedEvents[event.id] = !$scope.selectedEvents[event.id];
    window.localStorage.setItem("selectedEvents", JSON.stringify($scope.selectedEvents));
  }
  
  $scope.conference.getEventsByRoomForDay($scope.selectedDay).then(
    function(rooms) {
      $scope.clearRoomEvents();
      for(roomName in rooms) {
        var room = rooms[roomName];
        $scope.setRoomEvents(roomName, room.events);
      }
    }
  );
});