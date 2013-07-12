/*global define */
define(['jquery'], function($) {
    'use strict';
    // Loads the specified JSON config file and returns a promise
    // to tell you when it's done.
    return function(url) {
        var loaded = $.Deferred();
        // Uses a HEAD request to figure out if
        // the file exists so it doesn't load it
        // and trigger a fail
        var ajax = $.ajax(url, {
            type: 'HEAD',
            dataType: 'text'
        });
        ajax.then(function(result) {
            console.log(result);
            return $.ajax(url, {
                type: 'GET',
                dataType: 'json'
            });
        }, function(data, textStatus) {
            console.log('No config, empty file, or bad json. Error: ' + textStatus);
            // It's ok if there's no config file
            // just return an empty object.
            loaded.resolve({});
        }).done(function(result, textStatus) {
            console.log('Loaded Config File ' + textStatus);
            loaded.resolve(result);
        });
        return loaded.promise();
    };
});
