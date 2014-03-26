var app = angular.module("Calendar.ConferenceServices", ["Calendar.Utils"]);

function Event(properties) {
  this.id = properties.id;
  this.name = properties.name;
  this.summary = properties.summary;
  this.fromTimeMillis = properties.fromTimeMillis;
  this.toTimeMillis = properties.toTimeMillis;
  this.room = properties.room;
}

app.run(function(ConferenceFactory, DevoxxFRFactory, DevoxxBEFactory) {
  ConferenceFactory.register("devoxxFR", DevoxxFRFactory);
  ConferenceFactory.register("devoxxBE", DevoxxBEFactory);
});

app.factory("DevoxxFRFactory", function($http, Utils) {
  function ConferenceDevoxxFR(options) {
    this.name = options.name;
    this.schedules = options.schedules;
    this.presentationsUrl = options.presentationsUrl;
    this.rooms = options.rooms;
  };

  ConferenceDevoxxFR.prototype.getEventsByRoomForDay = function(day) {

    function createEvent(slot) {
      var properties = {
        id: slot.slotId
      }

      if (slot.talk != null) {
        properties.name = slot.talk.title;
        properties.summary = slot.talk.summary;
      } else if (slot.break != null) {
        properties.name = slot.break.nameFR;
      } else {
        properties.name = "=== Unknown ===";
      }

      properties.room = slot.roomName;
      properties.fromTimeMillis = slot.fromTimeMillis;
      properties.toTimeMillis = slot.toTimeMillis;

      return new Event(properties);
    }

    function toEvents(schedule) {
      console.log(schedule.data.slots);
      return schedule.data.slots.map(createEvent);
    }

    var ajaxSchedule = $http.get(this.schedules[day-1].url);

    return ajaxSchedule.then(toEvents).then(function(events) {
      var rooms = Utils.groupBy("room", events, {});
      console.log(rooms);
      return rooms;
    });
  };

  return {
    createConference: function(properties) {
      return new ConferenceDevoxxFR(properties);
    }
  };
});

app.factory("DevoxxBEFactory", function($http, $q, Utils) {
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

      var rooms = Utils.groupBy("room", values[0].data, Utils.toHash(values[1].data));
      return rooms;
    });
  };

  return {
    createConference: function(properties) {
      return new ConferenceDevoxxBE(properties);
    }
  };
})

app.factory("ConferenceFactory", function() {
  var registry = {};

  return {
    register: function(name, utils) {
      registry[name] = utils;
    },

    createConference: function(properties) {
      return registry[properties.type].createConference(properties);
    }
  };
});

app.factory("ConferenceService", function($http, $q, ConferenceFactory) {

  var conferences = {
    "devoxx13": ConferenceFactory.createConference({
      name: "Devoxx 2013",
      rooms: [ "Hollywood Lounge", "Room 3", "Room 4", "Room 5", "Room 6", "Room 7", "Room 8", "Room 9", "BOF 1", "BOF 2"],
      schedules: [
        { number: 1, name: "mercredi", url: "data/devoxx-schedule-3.json" },
        { number: 2, name: "jeudi", url: "data/devoxx-schedule-4.json" },
        { number: 3, name: "vendredi", url: "data/devoxx-schedule-5.json"}
      ],
      presentationsUrl: "data/devoxx-presentations.json",
      type: "devoxxBE"
    }),
    "devoxxFR14": ConferenceFactory.createConference({
      name: "Devoxx France 2014",
      rooms: [ 'Espace d\'exposition', 'Other room', 'Seine A', 'Seine B', 'Seine C', 'Auditorium', 'Ella Fitzgerald AB',
        'Louis Armstrong AB', 'Louis Armstrong CD', 'Miles Davis A', 'Miles Davis B', 'Miles Davis C', 'Foyer bas', 'E.Fitzgerald AB',
        'L.Armstrong AB', 'L.Armstrong CD', 'M.Davis A', 'M.Davis B', 'M.Davis C', 'Duke Ellington-CodeStory', 'Ella Fitzgerald', 'M.Davis', 'Labo' ],
      schedules: [
        { number: 1, name: "mercredi", url: "data/devoxxfr/schedule-wednesday.json" },
        { number: 2, name: "jeudi", url: "data/devoxxfr/schedule-thursday.json" },
        { number: 3, name: "vendredi", url: "data/devoxxfr/schedule-friday.json" },
      ],
      type: "devoxxFR"
    })
  };

  return {
    find: function(name) {
      return conferences[name];
    }
  }
});