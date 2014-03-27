#!/usr/bin/env node

var http = require("http");
var fs = require("fs");
var url = require("url");

function saveToFile(fileUrl, file) {
  var options = url.parse(fileUrl);
  options.headers = { "User-Agent": "NodeJS" };

  http.get(options, function(response) {
    console.log("Saving " + fileUrl + " to "+file);
    var out = fs.createWriteStream(file);
    response.pipe(out);
    response.on('error', function(e) {
      console.log("Got error: " + e.message);
    }).on('end', function() {
      out.end();
    });
  });
}

var baseUrl = "http://cfp.devoxx.fr/api/conferences/devoxxFR2014/schedules/";
saveToFile(baseUrl+"wednesday", "src/data/devoxxfr/schedule-wednesday.json");
saveToFile(baseUrl+"thursday", "src/data/devoxxfr/schedule-thursday.json");
saveToFile(baseUrl+"friday/", "src/data/devoxxfr/schedule-friday.json");