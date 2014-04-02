var app = angular.module("Calendar", ['ui.router.state', 'Calendar.directives', 'Calendar.ConferenceServices']);

app.config(function($stateProvider, $urlRouterProvider){
  //

  $urlRouterProvider
  .when('/conferences/:name', '/conferences/:name/1')
  .otherwise("/conferences/devoxxFR14") ;
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
    });

});

app.controller("Conference", function($stateParams, $scope, ConferenceService) {
  $scope.hours = [ 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];

  $scope.conferences = ConferenceService.getAllConferenceNames();
  $scope.conference = ConferenceService.find($stateParams.name);
  $scope.confName = $scope.conference.name;

  $scope.setRooms = function(rooms) {
    $scope.rooms = rooms.map(function(roomName) {
      return { name: roomName, events: [] };
    });
  };

  $scope.setRooms([]);

  function findByName(name, collection) {
    for(var i=0; i<collection.length; i++) {
      var item = collection[i];
      if (item.name === name) {
        return item;
      }
    }
  }

  $scope.clearRoomEvents = function() {
    $scope.rooms.forEach(function(room) {
      room.events = [];
    });
  };

  $scope.setRoomEvents = function(roomName, events) {
    var room = findByName(roomName, $scope.rooms);
    if (room) {
      room.events = events;
    } else {
      console.log("Object with name '"+roomName+"' not found for events:");
      console.log(events);
    }
  };

  $scope.days = $scope.conference.schedules;

  $scope.selectedDay = 1;

  $scope.selectDay = function(day) {
    $scope.selectedDay = day;
  };
});

app.controller("Day", function($stateParams, $scope, $http, $q, Utils) {

  $scope.selectDay(parseInt($stateParams.day));

  var eventsFlags = JSON.parse(window.localStorage.getItem("eventsFlags")) || {};

  function migration(flags) {
    var data = window.localStorage.getItem("selectedEvents");
    if (data === null) {
      return;
    }
    var selectedEvents = JSON.parse(data);
    Object.keys(selectedEvents).forEach(function(key) {
      flags[key] = { favorite: selectedEvents[key], notInterested: false, watchLater: false};
    });
    window.localStorage.removeItem("selectedEvents");
  }
  migration(eventsFlags);

  $scope.flagsForEvent = function(event) {
    if (typeof eventsFlags[event.id] !== "object") {
      eventsFlags[event.id] = { favorite: false, notInterested: false, watchLater: false };
    }
    return eventsFlags[event.id];
  };

  $scope.flagsChanged = function(event, flags) {
    eventsFlags[event.id] = flags;
    window.localStorage.setItem("eventsFlags", JSON.stringify(eventsFlags));
  };
  
  $scope.conference.getEventsByRoomForDay($scope.selectedDay).then(
    function(rooms) {
      $scope.setRooms(Utils.getObjectProperties(rooms));
      $scope.clearRoomEvents();
      for(var roomName in rooms) {
        var room = rooms[roomName];
        $scope.setRoomEvents(roomName, room.events);
      }
    }
  );
});