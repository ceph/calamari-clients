/*global require */
'use strict';

require.config({
    shim: {
        underscore: {
            exports: '_'
        },
        backbone: {
            deps: ['underscore', 'jquery'],
            exports: 'Backbone'
        },
        'backbone.wreqr': {
            deps: ['backbone']
        },
        'backbone.babysitter': {
            deps: ['backbone']
        },
        marionette: {
            deps: ['backbone', 'backbone.babysitter', 'backbone.wreqr']
        },
        bootstrap: {
            deps: ['jquery'],
            exports: 'jquery'
        },
        gauge: {
            deps: ['jquery'],
            exports: 'Gauge'
        },
        flotr2: {
            deps: ['bean', 'underscore']
        }
    },
    paths: {
        jquery: '../bower_components/jquery/jquery',
        backbone: '../bower_components/backbone-amd/backbone',
        underscore: '../bower_components/underscore-amd/underscore',
        bootstrap: 'vendor/bootstrap',
        gauge: 'vendor/gauge',
        bean: '../bower_components/bean/bean',
        'backbone.babysitter': '../bower_components/backbone.marionette/public/javascripts/backbone.babysitter',
        'backbone.wreqr': '../bower_components/backbone.wreqr/lib/amd/backbone.wreqr',
        flotr2: 'vendor/flotr2.amd',
        raphael: 'vendor/raphael',
        humanize: '../bower_components/humanize/humanize',
        marionette: '../bower_components/backbone.marionette/lib/core/amd/backbone.marionette'
    }
});

require(['./app'], function() {});
