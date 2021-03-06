var app = angular.module("Calendar.ConferenceServices", ["Calendar.Utils"]);

function Event(properties) {
  this.id = properties.id;
  this.name = properties.name;
  this.summary = properties.summary;
  this.fromTimeMillis = properties.fromTimeMillis;
  this.toTimeMillis = properties.toTimeMillis;
  this.room = properties.room;
  this.talkType = properties.talkType;
  this.track = properties.track;
  this.recorded = properties.recorded;
}

app.run(function(ConferenceFactory, DevoxxFRFactory, DevoxxBEFactory) {
  ConferenceFactory.register("devoxxFR", DevoxxFRFactory);
  ConferenceFactory.register("devoxxBE", DevoxxBEFactory);
});

app.factory("DevoxxFRFactory", function($http, $q, Utils) {
  function ConferenceDevoxxFR(options) {
    this.name = options.name;
    this.schedules = options.schedules;
    this.presentationsUrl = options.presentationsUrl;
    this.rooms = options.rooms;
    this.patchEvent = options.patchEvent || angular.noop;

    this.eventsByRoom = [];
  }

  var toolsInActionRecordedRooms = [ "Seine A", "Seine B", "Seine C", "Auditorium" ];

  function isRecordedRoom(roomName) {
    return toolsInActionRecordedRooms.indexOf(roomName) !== -1;
  };

  ConferenceDevoxxFR.prototype._createEvent = function(slot) {
    var properties = {
      id: slot.slotId
    };

    if (slot.talk != null) {
      properties.name = slot.talk.title;
      properties.summary = slot.talk.summary;
      properties.track = slot.talk.track;
      properties.talkType = slot.talk.talkType;
      properties.recorded = slot.talk.talkType === "Conference" || slot.talk.talkType === "University"
        || (slot.talk.talkType === "Tools-in-Action" && isRecordedRoom(slot.roomName));
    } else if (slot.break != null) {
      properties.name = slot.break.nameFR;
    } else {
      properties.name = "=== Unknown ===";
      console.log(slot);
    }

    properties.room = slot.roomName;
    properties.fromTimeMillis = slot.fromTimeMillis;
    properties.toTimeMillis = slot.toTimeMillis;
    this.patchEvent(properties, slot);

    return new Event(properties);
  };

  ConferenceDevoxxFR.prototype.getEventsByRoomForDay = function(day) {
    if (this.eventsByRoom[day]) {
      return $q.when(this.eventsByRoom[day]);
    }
    var that = this;

    function toEvents(schedule) {
      console.log(schedule.data.slots);
      return schedule.data.slots.map(that._createEvent, that);
    }

    var ajaxSchedule = $http.get(this.schedules[day-1].url);

    return ajaxSchedule.then(toEvents).then(function(events) {
      var rooms = Utils.groupBy("room", events, {});
      console.log(rooms);
      that.eventsByRoom[day] = rooms;
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
});

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

  var devoxxFrRoomOverride = {
    "E.Fitzgerald AB": "Ella Fitzgerald AB",
    "L.Armstrong AB": "Louis Armstrong AB",
    "L.Armstrong CD": "Louis Armstrong CD",
    "M.Davis A": "Miles Davis A",
    "M.Davis B": "Miles Davis B",
    "M.Davis C": "Miles Davis C"
  };

  var conferences = {
    "devoxx13": ConferenceFactory.createConference({
      name: "Devoxx 2013",
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
      schedules: [
        { number: 1, name: "mercredi", url: "data/devoxxfr/schedule-wednesday.json" },
        { number: 2, name: "jeudi", url: "data/devoxxfr/schedule-thursday.json" },
        { number: 3, name: "vendredi", url: "data/devoxxfr/schedule-friday.json" },
      ],
      patchEvent: function(event, slot) {
        event.room = devoxxFrRoomOverride[event.room] || event.room;
        if (slot.talk && slot.talk.id === "USM-170") {
          event.room = event.room+" 1";
        }
      },
      type: "devoxxFR"
    })
  };

  return {
    find: function(name) {
      return conferences[name];
    },
    getAllConferenceNames: function() {
      return Object.getOwnPropertyNames(conferences).map(function(conferenceCode) {
        return { code: conferenceCode, name: conferences[conferenceCode].name };
      });
    }
  };
});
