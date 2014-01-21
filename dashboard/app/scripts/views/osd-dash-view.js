/*global define*/

define(['jquery', 'underscore', 'backbone', 'templates', 'helpers/gauge-helper', 'marionette'], function($, _, Backbone, JST, gaugeHelper) {
    'use strict';

    var OsdDashView = Backbone.Marionette.ItemView.extend({
        className: 'col-lg-3 col-md-3 col-sm-6 col-xs-6 custom-gutter',
        template: JST['app/scripts/templates/osd-dash.ejs'],
        headlineTemplate: _.template('<%- ok %>/<%- total %>'),
        subtextTemplate: _.template('<%- down %> down'),
        ui: {
            'headline': '.headline',
            'subline': '.subline',
            'subtext': '.subtext'
        },
        modelEvents: {
            'change': 'modelChanged'
        },
        initialize: function() {
            _.bindAll(this, 'set', 'modelChanged');
            this.App = Backbone.Marionette.getOption(this, 'App');
            if (this.App) {
                this.listenTo(this.App.vent, 'status:update', this.set);
            }
            this.model = new Backbone.Model();
            gaugeHelper(this);
        },
        set: function(model) {
            var attr = model.attributes.osd;
            var down = 0;
            if (attr.warn.count && attr.warn.states['down/in']) {
                down += attr.warn.states['down/in'];
            }
            if (attr.critical.count && attr.critical.states['down/out']) {
                down += attr.critical.states['down/out'];
            }
            this.model.set({
                ok: attr.ok.count,
                warn: attr.warn.count,
                critical: attr.critical.count,
                down: down
            });
        },
        warningThresholdPercentage: 80,
        displayWarning: function(percentage) {
            if (Math.round(percentage) > this.warningThresholdPercentage) {
                this.trigger('status:warn');
            } else {
                this.trigger('status:ok');
            }
        },
        modelChanged: function(model) {
            var ok = model.get('ok');
            var warn = model.get('warn');
            var critical = model.get('critical');
            var down = model.get('down');
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
            this.ui.subline.text('In & Up');
            if (warn || critical) {
                this.ui.subtext.text(this.subtextTemplate({
                    down: down
                }));
                var percentage = Math.round((down / count) * 100);
                this.displayWarning(percentage);
            } else {
                this.ui.subtext.text('');
                this.displayWarning(0);
            }
            this.ui.headline.text(this.headlineTemplate({
                ok: ok,
                total: count
            }));
        }
    });

    return OsdDashView;
});
