/*global require, Gauge */
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
        bootstrap: {
            deps: ['jquery'],
            exports: 'jquery'
        },
        gauge: {
            deps: ['jquery'],
            exports: 'Gauge'
        }
    },
    paths: {
        jquery: '../bower_components/jquery/jquery',
        backbone: '../bower_components/backbone-amd/backbone',
        underscore: '../bower_components/underscore-amd/underscore',
        bootstrap: 'vendor/bootstrap',
        gauge: 'vendor/gauge'
    }
});

require(['jquery', 'backbone', 'gauge'], function($, Backbone, Gauge) {
    Backbone.history.start();
    var opts = {
        generateGradient: true,

    };
    var gauge = new Gauge($('.mycanvas')[0]).setOptions(opts);
    gauge.maxValue = 100;
    gauge.set(50);
    gauge.setTextField($('.number')[0]);
});
