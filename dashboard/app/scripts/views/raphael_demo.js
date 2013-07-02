/*global require*/
'use strict';
require(['underscore', 'backbone', './helpers/raphael_support', 'jquery', './helpers/generate-osds', './views/application-view', 'raphael'], function(_, Backbone, rs, $, generate, View) {
    var r = window.Raphael('viz', 720, 520);
    var originX = 0,
        originY = 0,
        step = 40,
        osds = 16 * 10,
        width = 17 * step,
        height = 11 * step;
    var path = rs.calcGrid(originX, originY, width, height, step);
    var path1 = r.path('M0,0').attr({
        'stroke-width': 1,
        'stroke': '#5e6a71',
        'opacity': 0.40
    });
    var animateCircle = function(originX, originY, radius, destX, destY, model) {
            var c = r.circle(originX, originY, 20 * model.getUsedPercentage()).attr({
                stroke: 'none',
                fill: model.getCapacityColor()
            });
            c.data('modelid', model.cid);
            var t;
            var aFn = window.Raphael.animation({
                cx: destX,
                cy: originY
            }, 250, 'easeOut', function() {
                c.animate({
                    cx: destX,
                    cy: destY
                }, 333, 'easeIn', function() {
                    t = r.text(destX, destY, model.get('index')).attr({
                        font: '9px ApexSansMedium',
                        stroke: 'none',
                        fill: '#000'
                    });
                    t.data('modelid', model.cid);
                });
            });
            model.view = c;
            return c.animate(aFn);
        };
    var anim = window.Raphael.animation({
        path: path,
        callback: function() {
            d.resolve();
        }
    }, 250);
    var d = $.Deferred();
    path1.animate(anim);

    var p = d.promise();

    var collection = generate.osds(osds);
    window.collection = collection;
    p.done(function() {
        collection.each(function(m) {
            //console.log(m.attributes);
            var pos = rs.calcPosition(m.get('index'), originX, originY, width, height, step);
            animateCircle(originX, originY, 8, pos.nx, pos.ny, m);
        });
    });
    var simulateUsedChanges = function() {
            collection.each(function(m) {
                var capacity = m.get('capacity');
                var change = Math.floor(capacity * Math.random());
                m.set('used', change);
            });
        };

    var resetChanges = function() {
            collection.each(function(m) {
                var capacity = m.get('capacity');
                var change = Math.floor(capacity * 0.33);
                m.set('used', change);
            });
        };
    window.simulateUsed = simulateUsedChanges;
    window.resetChanges = resetChanges;
    var timer = null;
    window.startSimulation = function() {
        timer = setTimeout(function() {
            simulateUsedChanges();
            timer = window.startSimulation();
        }, 3000);
        return timer;
    };
    window.stopSimulation = function() {
        clearTimeout(timer);
        timer = null;
    };
    var parentOffset = $('svg').offset();
    console.log('parentOffset ', parentOffset);
    var detailPanel = new View();
    detailPanel.setElement($('.detail tbody'));
    $('svg').on('click', function(evt) {
        if (evt.target.nodeName === 'tspan' || evt.target.nodeName === 'circle') {
            var x = evt.clientX;
            var y = evt.clientY;
            //console.log(x + ' / ' + y);
            var el = r.getElementByPoint(x, y);
            if (el) {
                var cid = el.data('modelid');
                //console.log(cid);
                detailPanel.model.set(collection.get(cid).attributes);
            }
        }
    });
    $('body').on('keyup', _.debounce(function(evt) {
        evt.preventDefault();
        if (!evt.keyCode) {
            return;
        }
        console.log('got ' + evt.keyCode);
        var keyCode = evt.keyCode;
        if (keyCode === 82) {
            window.resetChanges();
            return;
        }
        if (keyCode === 85) {
            window.simulateUsed();
            return;
        }
        if (keyCode === 32) {
            var $spinner = $('.icon-spinner');
            if (timer === null) {
                window.startSimulation();
                $spinner.closest('i').addClass('.icon-spin').show();
            } else {
                window.stopSimulation();
                $spinner.closest('i').removeClass('.icon-spin').hide();
            }
        }
    }, 250, true));
    return {
        collection: collection,
        simulateUsed: simulateUsedChanges
    };
});
