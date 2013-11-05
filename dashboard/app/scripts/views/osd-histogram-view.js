/*global define*/

define(['jquery', 'underscore', 'backbone', 'templates', 'snapsvg', 'marionette'], function($, _, Backbone, JST, Snap) {
    'use strict';

    var OsdHistogramView = Backbone.Marionette.ItemView.extend({
        className: 'osd-histogram card gauge',
        template: JST['app/scripts/templates/osd-histogram.ejs'],
        modelEvents: {
            'change': 'modelChanged'
        },
        ui: {
            count: '.osd-histogram-count'
        },
        initialize: function() {
            _.bindAll(this, 'modelChanged', 'animateBar', 'initCanvas', 'set');
            this.App = Backbone.Marionette.getOption(this, 'App');
            if (this.App) {
                this.listenTo(this.App.vent, 'status:update', this.set);
            }
            this.listenToOnce(this, 'render', this.initCanvas);
            this.model = new Backbone.Model({
                'ok': 0,
                'warn': 0,
                'critical': 0
            });
        },
        svg: {},
        set: function(model) {
            var attr = model.attributes.osd;
            this.model.set({
                ok: attr.ok.count,
                warn: attr.warn.count,
                critical: attr.critical.count,
            });
        },
        animateBar: function(svgEl, svgText, percentage, text, offset) {
            var y = 10 + 100 - percentage;
            var height = percentage;
            svgEl.animate({
                y: y,
                height: height
            }, 250);
            svgText.attr({
                text: text
            });
            var x = offset + (24 / 2 - svgText.node.getBBox().width / 2);
            svgText.attr({
                x: x
            });
        },
        percentage: function(count, total) {
            return Math.round(count / total * 100);
        },
        modelChanged: function(model) {
            var ok = model.get('ok');
            var warn = model.get('warn');
            var critical = model.get('critical');
            var count = 0;
            if (_.isNumber(ok)) {
                count += ok;
            }
            if (_.isNumber(warn)) {
                count += warn;
            }
            if (_.isNumber(critical)) {
                count += critical;
            }
            this.ui.count.text(count);
            if (_.isNumber(ok)) {
                this.animateBar(this.svg.ok, this.svg.okcount, this.percentage(ok, count), ok.toString(), 12)
            }
            if (_.isNumber(warn)) {
                this.animateBar(this.svg.warn, this.svg.warncount, this.percentage(warn, count), warn.toString(), 47);
            }
            if (_.isNumber(critical)) {
                this.animateBar(this.svg.critical, this.svg.criticalcount, this.percentage(critical, count), critical.toString(), 82);
            }
        },
        initCanvas: function() {
            this.p = Snap(this.$('.osd-histogram-svg')[0]).attr({
                'height': 140,
                'width': 120
            });
            this.p.path('M5,5L5,111L110,111').attr({
                'class': 'osd-lines'
            });
            this.svg.ok = this.p.rect(15, 110, 20, 0).attr({
                'class': 'osd-histogram-ok'
            });
            this.svg.warn = this.p.rect(50, 110, 20, 0).attr({
                'class': 'osd-histogram-warn'
            });
            this.svg.critical = this.p.rect(85, 110, 20, 0).attr({
                'class': 'osd-histogram-critical'
            });
            this.svg.okcount = this.p.text(12, 130, '0').attr({
                'class': 'osd-count-text'
            });
            this.svg.warncount = this.p.text(47, 130, '0').attr({
                'class': 'osd-count-text'
            });
            this.svg.criticalcount = this.p.text(82, 130, '0').attr({
                'class': 'osd-count-text'
            });
        }
    });

    return OsdHistogramView;
});
