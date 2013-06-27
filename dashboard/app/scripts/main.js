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

require(['jquery', 'backbone', 'gauge', 'flotr2', 'raphael'], function($, Backbone, Gauge, Flotr) {
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
    var $el = $('.raphael-one');
    var ra = window.Raphael($el[0], 600, 600);
    ra.customAttributes.arc = function(value, total, R, mycolor) {
        var xorigin = 300;
        var yorigin = 300;
        var alpha = 360 / total * value,
            a = (90 - alpha) * Math.PI / 180,
            x = xorigin + R * Math.cos(a),
            y = yorigin - R * Math.sin(a),
            color = 'hsb('.concat(Math.round(R) / 200, ',', value / total, ', 0.75)'),
            path;
        if (mycolor !== undefined) {
            color = mycolor;
        }
        if (total === value) {
            path = [
                ['M', xorigin, yorigin - R],
                ['A', R, R, 0, 1, 1, 299.99, 300 - R]
            ];
        } else {
            path = [
                ['M', xorigin, yorigin - R],
                ['A', R, R, 0, +(alpha > 180), 1, x, y]
            ];
        }
        return {
            path: path,
            stroke: color
        };
    };
    var $itred = '#f05c56',
        $itdarkred = '#9c4850',
        $itgray = '#5e6a71',
        $itdarkgray = '#37424a',
        $itlightgray = '#e6e8e8',
        $itaqua = '#55aeba',
        $itlightaqua = '#80d2dc';

    (function() {
        var radius = 200;
        var param1 = {
            'stroke-width': 50
        };
        ra.path().attr(param1).attr({
            arc: [100, 100, radius, $itdarkred]
        });
        var param2 = {
            'stroke-width': 30
        };
        ra.path().attr(param2).attr({
            arc: [10, 100, radius]
        });
        param2 = {
            'stroke-width': 20
        };
        ra.path().attr(param2).attr({
            arc: [5, 100, radius, $itred]
        });
        ra.text(300, 100, 'OSDs').attr({
            'font-family': 'ApexSansMedium',
            'font-size': '20px'
        });
    }());

    (function() {
        var radius = 130;
        var param1 = {
            'stroke-width': 50
        };
        ra.path().attr(param1).attr({
            arc: [100, 100, radius, $itaqua]
        });
        var param2 = {
            'stroke-width': 30
        };
        ra.path().attr(param2).attr({
            arc: [5, 100, radius]
        });
        param2 = {
            'stroke-width': 20
        };
        ra.path().attr(param2).attr({
            arc: [2, 100, radius, $itlightaqua]
        });
        ra.text(300, 425, 'Hosts').attr({
            'font-family': 'ApexSansMedium',
            'font-size': '20px',
        });
    }());

    (function() {
        var radius = 60;
        var param1 = {
            'stroke-width': 50
        };
        ra.path().attr(param1).attr({
            arc: [100, 100, radius, $itgray]
        });
        var param2 = {
            'stroke-width': 30
        };
        ra.path().attr(param2).attr({
            arc: [10, 100, radius, $itlightgray]
        });
        param2 = {
            'stroke-width': 20
        };
        ra.path().attr(param2).attr({
            arc: [3, 100, radius, $itdarkgray]
        });
        ra.text(300, 294, 'Racks').attr({
            'font-family': 'ApexSansMedium',
            'font-size': '20px'
        });
    }());

    ra.text(300, 20, 'Cluster Availability').attr({
        'font-family': 'ApexSansMedium',
        'font-size': '40px'
    });

});
