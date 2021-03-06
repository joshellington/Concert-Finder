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

  $('.filter-venue').live('click', function() {
    filter($(this).attr('data-venue'), $(this));
    return false;
  });

  $('.clear-filter').live('click', function() {
    clearFilter();
    return false;
  });
});


function findEvents(lat, lng) {
  $.getJSON('http://ws.audioscrobbler.com/2.0/?method=geo.getevents&lat='+lat+'&long='+lng+'&api_key=bd5217f8dfd32dd746cdc01a703aafd2&limit=50&format=json', function(d) {
    log(d);

    parseEvents(d);
  });
}

function parseEvents(d) {
  var source   = $("#event-template").html(),
      template = Handlebars.compile(source),
      container = $('#events');

  $.each(d.events.event, function(i,item) {
    item.image_url = item.image[3]['#text'];
    item.startDate = Date.create(item.startDate).format('{Weekday}, {Month} {ord}, {yyyy}');

    log(item);

    var search = new models.Search(item.artists.headliner);
    search.localResults = models.LOCALSEARCHRESULTS.APPEND;
    search.searchAlbums = false;
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
            container.append(html);
          }
          // log(track.data.uri);
        });
      } else {
        var html = template(item);
        container.append(html);
      }
    });

    search.appendNext();

    if ( i == d.events.event.length - 1 ) {
      container.imagesLoaded(function() {
        container.masonry({
          itemSelector: '.event',
          isAnimated: false
        });
      });
    }
  });
}

function play(uri) {
  player.play(uri);
}

function pause(uri) {
  // player.pause();
}

function filter(filter, obj) {
  var out = $('.event[data-venue="'+filter+'"]');

  $('.event').hide();
  $(out).show(0, function() {
    // $('#events').masonry('reload');
  });

  $('.current-venue span').html(filter);
}

function clearFilter() {
  $('.current-venue span').html('All');
  $('.event').show(0, function() {
    // $('#events').masonry('reload');
  });
}