sp = getSpotifyApi(1);
var models = sp.require('sp://import/scripts/api/models'),
    views = sp.require('sp://import/scripts/api/views'),
    ui = sp.require("sp://import/scripts/ui");
    player = models.player,
    library = models.library,
    application = models.application,
    session = models.session,
    playerImage = new views.Player(),
    lat = geoip_latitude(),
    lng = geoip_longitude();


$(function() {
  findEvents(lat, lng);

  $('#location').html(geoip_city()+', '+geoip_region_name());

  $('a.play').live('click', function() {
    play($(this).attr('href'));

    $('a.pause').attr('class', 'play');
    $(this).addClass('pause');
    return false;
  });

  $('a.pause').live('click', function() {
    pause($(this).attr('href'));

    $(this).removeClass('pause');
    $(this).addClass('play');
    return false;
  });
});


function findEvents(lat, lng) {
  $.getJSON('http://ws.audioscrobbler.com/2.0/?method=geo.getevents&lat='+lat+'&long='+lng+'&api_key=b25b959554ed76058ac220b7b2e0a026&limit=102&format=json', function(d) {
    log(d);

    parseEvents(d);
  });
}

function parseEvents(d) {
  var source   = $("#event-template").html(),
      template = Handlebars.compile(source);

  $.each(d.events.event, function(i,item) {
    item.image_url = item.image[3]['#text'];
    item.startDate = Date.create(item.startDate).format('{Weekday}, {Month} {ord}, {yyyy}');

    var search = new models.Search(item.artists.headliner);
    search.localResults = models.LOCALSEARCHRESULTS.APPEND;
    // search.searchAlbums = false;
    // search.searchTracks = false;
    search.pageSize = 5;

    search.observe(models.EVENT.CHANGE, function() {
      var i = 0;
      
      if ( search.tracks.length > 0 ) {
        search.tracks.forEach(function(track) {
          item.uri = track.data.artists[0].uri;
          i++;

          if ( i == search.tracks.length ) {
            var html = template(item);
            $('#events').append(html);
          }
          // log(track.data.uri);
        });
      } else {
        var html = template(item);
        $('#events').append(html);
      }
    });

    search.appendNext();

    if ( i == d.events.event.length - 1 ) {
      setTimeout(function() {
        setHeights($('.event'));
      }, 500);
    }
  });
}

function play(uri) {
  player.play(uri);
}

function pause(uri) {
  // player.pause();
}