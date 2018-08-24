$(function() {

  // cartoDB configuration
  var config = {
    user: 'devel',
    table: 'cultura',
    debug: true
  };

   // add an OpenStreetMap tile layer
  var tileLayer = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
  });

   // create a map in the "map" div, set the view to a given place and zoom
  var map = L.map('map', {
    center: [-34.624874, -58.427166],
    zoom: 12,
    layers: tileLayer,
    attributionControl: false
  });

  renderAddresses = function() {

    var filtro = $('#search').val() || '';

    var tipos = _.map($('.tipo_check.todo-done'), function(item) {
      return $(item).attr('data-tipo');
    });

    var subTipos = _.map($('.sub_tipo_check.todo-done'), function(item) {
      return $(item).attr('data-sub_tipo').split(',');
    });
    subTipos = _.flatten(subTipos);

    var cluster = $('li.clusterMarkers div.switch div').hasClass('switch-on');

    map.spin(true);
    fetchLocations(filtro, tipos, subTipos, map.getBounds(), function(data) {
      map.spin(false);

      map.renderAddresses(data.rows, filtro, cluster);

    }, config);
  }

  map.updateCluster = function() {
    var filtro = $('#search').val() || '';
    var cluster = $('li.clusterMarkers div.switch div').hasClass('switch-on');

    map.spin(true);
    // allow dom to repaint,
    // see http://stackoverflow.com/a/4005365, http://stackoverflow.com/a/12022571
    window.setTimeout(function() {
      map.renderAddresses(map.data, filtro, cluster);
      map.spin(false);
    }, 50);
  };

   // add a method to my map to render every address
  map.renderAddresses = function(addresses, filtro, cluster) {
    console.log('rendering ' + addresses.length + ' addresses');

    if (map.addresses) map.addresses.clearLayers();
    map.addresses = cluster ? new L.MarkerClusterGroup() : new L.LayerGroup();
    map.addLayer(map.addresses);

    // save a copy of the data
    // so that I can rerender without reading from the web service
    map.data = addresses;

    var formatUrl = function(url) {
      return url.substr(0, 7) === 'http://' ? url : 'http://' + url;
    };

    var formatUrlText = function(url) {
      return url.substr(0, 7) === 'http://' ? url.substr(7) : url;
    };

    var formatFiltro = function(value, filtro) {
      if (!filtro) return value;
      var regExp = new RegExp('(.*)(' + filtro + ')(.*)', 'ig');
      var matches = regExp.exec(value);
      if (!matches) return value;
      return matches[1] + '<span class="filtro">' + matches[2] + '</span>' + matches[3];
    };

    var color,
      defaultColor = 'yellow',
      colors = {
        'Industrias Culturales': 'blue',
        'Espacios Culturales': 'green',
        'Festivales': 'purple',
        'Patrimonio': 'orange',
      },
      icon,
      defaultIcon = 'tint',
      icons = {
        'Organizaciones de la Sociedad Civil': 'building',
        'Agencia de noticias': 'file',
        'Editoriales de libros': 'book',
        'Monumentos y lugares históricos': 'building',
        'Medios sociales de comunicación': 'bullhorn',
        'Librerías': 'book',
        'Patrimonio de la humaniad': 'male',
        'TV digital abierta': 'youtube-play',
        'Bibliotecas populares': 'book',
        'Periódicos digitales': 'comments-all',
        'Eventos feriales artesanales': 'wrench',
        'Bibliotecas especializadas': 'book',
        'Periódicos impresos': 'book',
        'Feria del libro': 'book',
        'Casas de la Historia y la Cultura del Bicentenario': 'building',
        'Canales de TV abierta': 'facetime-video',
        'Radios': 'microphone',
        'Fiestas y festivales': 'trophy',
        'Carreras culturales': 'lightbulbe',
        'Espacios INCAA': 'film',
        'Espacios de exhibición patrimonial': 'building',
        'Rutas y estancias jesuíticas': 'road',
        'Sellos musicales': 'music',
        'Salas teatrales': 'group',
        'Salas de cine': 'film'
      };

    // optimize loop -> http://stackoverflow.com/a/1340634/47633
    var location,
      counter = addresses.length;

    // map.spin(true);

    while (counter--) {
      location = addresses[counter];

      // blue, green, orange, yellow, purple, and violet
      color = colors[location.tipo] || defaultColor;
      icon = icons[location.subtipo] || defaultIcon;

      try {

        var message =
          (location.tipo ? '<b>' + location.tipo + ', ' + location.subtipo + '</b></br>' : '') +
          (location.nombre ? '<b>' +
          (filtro ? formatFiltro(location.nombre, filtro) : location.nombre) + '</b></br>' : '') +
          (location.direccion ? '<b>' +
          (filtro ? formatFiltro(location.direccion, filtro) : location.direccion) + '</b></br>' : '') +
          (location.telefono ? location.telefono + '</br>' : '') +
          (location.email ? '<b>' + location.email + '</b></br>' : '') +
          (location.web ?
          '<b><a href="' + formatUrl(location.web) + '" target="_blank">' +
          formatUrlText(location.web) + '</a></b></br>' : '');

        var marker = L.marker([location.lat, location.lon], {
          icon: L.AwesomeMarkers.icon({
            icon: icon,
            color: color
          })
        }).bindPopup(message);

        map.addresses.addLayer(marker);

      } catch (e) {
        console.log('could not create marker');
        console.log(location);
      }

    }
    return this;
  };

  $('#search').on('input', _.debounce(function(e) {
    renderAddresses();
  }, 800));

  // $('.clusterMarkers').on('click', function(e) {
  //   // give time for switch plugin to change the value of the checkbox
  //   window.setTimeout(function() {
  //     map.updateCluster();
  //   }, 100);
  // });

  $('.clusterMarkers label').on('click', function(e) {
    // give time for switch plugin to change the value of the checkbox
    window.setTimeout(function() {
      map.updateCluster();
    }, 100);
  });

  $('.tipo_check').on('click', function(e) {
    $(e.currentTarget).toggleClass('todo-done');
    renderAddresses();
  });

  $('.sub_tipo_check').on('click', function(e) {
    $(e.currentTarget).toggleClass('todo-done');
    renderAddresses();
  });

  $(function() {
    renderAddresses();
  });

  map.lastZoom = map.getZoom();
  map.on('moveend', function() {
    // me acerqué, no traigo nuevos puntos
    if (map.getZoom() > map.lastZoom) {
      map.lastZoom = map.getZoom();
      return;
    }
    renderAddresses();
    map.lastZoom = map.getZoom();
  });

});
