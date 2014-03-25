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

app.factory("ConferenceService", function($http, $q) {

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
    })
    return result;
  }

  function ConferenceDevoxxBE(options) {
    this.name = options.name;
    this.schedules = options.schedules;
    this.presentationsUrl = options.presentationsUrl;
    this.rooms = options.rooms;
  }

  ConferenceDevoxxBE.prototype.getEventsByRoomForDay = function(day) {
    var ajaxSchedule = $http.get(this.schedules[day-1].url);

    var ajaxPresentations = $http.get(this.presentationsUrl, { cache: true });

    return $q.all([ajaxSchedule, ajaxPresentations]).then(function(values) {
      values[0].data.forEach(function(event) {
        event.name = event.note || event.title || event.kind;
      });

      var rooms = groupBy("room", values[0].data, toHash(values[1].data));
      return rooms;
    });
  };


  function ConferenceDevoxxFR(options) {
    this.name = options.name;
    this.schedules = options.schedules;
    this.presentationsUrl = options.presentationsUrl;
    this.rooms = options.rooms;
  };

  ConferenceDevoxxFR.prototype.getEventsByRoomForDay = function(day) {
    var ajaxSchedule = $http.get(this.schedules[day-1].url);

    return ajaxSchedule.then(function(values) {
      console.log(values.data.slots);
      values.data.slots.forEach(function(item) {
        item.id = item.slotId;
        if (item.talk != null) {
          item.name = item.talk.title;
        } else if (item.break != null) {
          item.name = item.break.nameFR;
        } else {
          item.name = "=== Unknown ===";
        }
      });
      var rooms = groupBy("roomName", values.data.slots, {});
      return rooms;
    });
  };

  var conferences = {
    "devoxx13": new ConferenceDevoxxBE({
      name: "Devoxx 2013",
      rooms: [ "Hollywood Lounge", "Room 3", "Room 4", "Room 5", "Room 6", "Room 7", "Room 8", "Room 9", "BOF 1", "BOF 2"],
      schedules: [
        { number: 1, name: "mercredi", url: "data/devoxx-schedule-3.json" },
        { number: 2, name: "jeudi", url: "data/devoxx-schedule-4.json" },
        { number: 3, name: "vendredi", url: "data/devoxx-schedule-5.json"}
      ],
      presentationsUrl: "data/devoxx-presentations.json"
    }),
    "devoxxFR14": new ConferenceDevoxxFR({
      name: "Devoxx France 2014",
      rooms: [ 'Espace d\'exposition', 'Other room', 'Seine A', 'Seine B', 'Seine C', 'Auditorium', 'Ella Fitzgerald AB',
        'Louis Armstrong AB', 'Louis Armstrong CD', 'Miles Davis A', 'Miles Davis B', 'Miles Davis C', 'Foyer bas', 'E.Fitzgerald AB',
        'L.Armstrong AB', 'L.Armstrong CD', 'M.Davis A', 'M.Davis B', 'M.Davis C' ],
      schedules: [
        { number: 1, name: "mercredi", url: "data/devoxxfr/schedule-wednesday.json" },
        { number: 2, name: "jeudi", url: "data/devoxxfr/schedule-thursday.json" },
        { number: 3, name: "vendredi", url: "data/devoxxfr/schedule-friday.json" },
      ]
    })
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
      console.log("Object with name '"+name+"' not found")
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