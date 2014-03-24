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

app.factory("ConferenceService", function() {

  var conferences = {
    "devoxx13": {
      name: "Devoxx 2013",
      rooms: [ "Hollywood Lounge", "Room 3", "Room 4", "Room 5", "Room 6", "Room 7", "Room 8", "Room 9", "BOF 1", "BOF 2"],
      schedules: [
        { number: 1, name: "mercredi", url: "data/devoxx-schedule-3.json" },
        { number: 2, name: "jeudi", url: "data/devoxx-schedule-4.json" },
        { number: 3, name: "vendredi", url: "data/devoxx-schedule-5.json"}
      ],
      presentationsUrl: "data/devoxx-presentations.json"
    }
  };

  return {
    find: function(name) {
      return conferences[name];
    }
  }
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
    console.log("Object with name '"+name+"' not found")
  }

  $scope.clearRoomEvents = function() {
    $scope.rooms.forEach(function(room) {
      room.events = [];
    });
  }

  $scope.setRoomEvents = function(roomName, events) {
    findByName(roomName, $scope.rooms).events = events;
  };

  $scope.days = $scope.conference.schedules;

  $scope.selectedDay = 1;

  $scope.selectDay = function(day) {
    $scope.selectedDay = day;
  }
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
  
  var ajaxSchedule = $http.get($scope.days[$scope.selectedDay-1].url);
  
  var ajaxPresentations = $http.get($scope.conference.presentationsUrl, { cache: true });
  
  $q.all([ajaxSchedule, ajaxPresentations]).then(function(values) {
    var rooms = groupByRoom(values[0].data, toHash(values[1].data));
    $scope.clearRoomEvents();
    for(roomName in rooms) {
      var room = rooms[roomName];
      $scope.setRoomEvents(roomName, room.events);
    }
  });
});