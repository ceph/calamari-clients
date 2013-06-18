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
        flotr2: 'vendor/flotr2.amd'
    }
});

require(['jquery', 'backbone', 'gauge', 'flotr2'], function($, Backbone, Gauge, Flotr) {
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

    var data1 = [];
    var data2 = [];
    var data3 = [];
    for (var i = 0; i < 96; i += 1) {
        data1.push([i * 15, Math.floor(100 * Math.random())]);
        data2.push([i * 15, Math.floor(100 * Math.random())]);
        data3.push([i * 15, Math.floor(100 * Math.random())]);
    }
    Flotr.draw($('.graph-one')[0], [data1, data2, data3], {
        title: 'MON CPU',
        colors: ['#f05c56', '#9c4850', '#55aeba', '#80d2dc', '#37424a'],
        xaxis: {
            mode: 'time',
            minorTickFreq: 10,
            title: 'Time',
            timeUnit: 'minute'
        },
        yaxis: {
            titleAngle: 45,
        },
        grid: {
            minorVerticalLines: true
        }
    });
});
