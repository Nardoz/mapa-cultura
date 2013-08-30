var fetchLocations = function(filter, tipos, subTipos, bounds, callback, config) {

  'use strict';

  var filterByBounds = function(bounds) {
    if (!bounds) return '';

    var margin = (bounds.getNorthEast().lat - bounds.getSouthWest().lat) / 5;

    var topLeft = (bounds.getNorthWest().lng - margin) + ' ' + (bounds.getNorthWest().lat + margin);
    var bottomRight = (bounds.getSouthEast().lng + margin) + ' ' + (bounds.getSouthEast().lat - margin);

    var condition = "ST_Within(the_geom, " +
      "ST_Envelope(ST_GeomFromText('LINESTRING( #topLeft#, #bottomRight# )', 4326)))";

    condition = condition
      .replace('#topLeft#', topLeft)
      .replace('#bottomRight#', bottomRight);

    return condition;
  };

  if (!config) throw new Error('cartoDB config not specified');

  var debug = config.debug || false

  filter = (filter || '').toLowerCase();

  tipos = tipos || [];

  var fields = 'tipo, subtipo, nombre, direccion, telefono, email, web, lat, lon';
  // var fields = 'lat, lon';
  var query = 'select ' + fields + ' from ' + config.table;

  var conditions = [];

  var boundQuery = filterByBounds(bounds);
  if (boundQuery) conditions.push(boundQuery);

  if (filter) {
    var filterQuery = 
      "lower(nombre) like '%" + filter + "%' or " +
      "lower(direccion) like '%" + filter + "%'";
    conditions.push(filterQuery);
  };

  var tiposQuery, subTiposQuery, tiposConditions = [];
  if (tipos.length > 0) {
    tiposQuery = "'" + tipos.join("', '") + "'";
    tiposQuery = 'lower(tipo) in (' + tiposQuery.toLowerCase() + ')';
    tiposConditions.push(tiposQuery);
  }

  if (subTipos.length > 0) {
    subTiposQuery = "'" + _.map(subTipos, function(subTipo) {
      return subTipo.replace(/^\s+|\s+$/g, '');   // trim
    }).join("', '") + "'";

    subTiposQuery = 'lower(subtipo) in (' + subTiposQuery.toLowerCase() + ')';
    tiposConditions.push(subTiposQuery);
  }

  if (tiposConditions.length > 0) {
    conditions.push( '(' + tiposConditions.join(' or ') + ')');    
  }

  if (conditions.length > 0) {
    query += ' where (' + conditions.join(') and (') + ')';
  }

  //http://devel.cartodb.com/api/v2/sql?q=select%20*%20from%20cultura%20limit%2020
  if (debug) console.log(query);

  var url = 'http://' + config.user + '.cartodb.com/api/v2/sql?' +
    'q=' + encodeURIComponent(query) +
    (config.apikey ? '&api_key=' + config.apikey : '');

  if (debug) console.log(url);

  $.get(url, function(data) {
    if (debug) console.log('fetched: ' + data.total_rows);
    callback(data);
  });

  return;

};


