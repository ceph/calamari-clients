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
        flotr2: 'vendor/flotr2.amd',
        raphael: 'vendor/raphael'
    }
});

require(['jquery', 'backbone', 'gauge', './views/raphael_demo', 'raphael'], function($, Backbone, Gauge) {
    Backbone.history.start();
    var opts = {
        lines: 10,
        colorStart: '#80d2dc',
        colorStop: '#55aeba',
        generateGradient: true

    };
    var gauge = new Gauge($('.mycanvas')[0]).setOptions(opts);
    gauge.maxValue = 100;
    var r = Math.random() * 100;
    r = Math.floor(r);
    gauge.set(r);
    gauge.setTextField($('.number')[0]);

});
