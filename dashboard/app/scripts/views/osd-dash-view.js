/*global define*/

define(['jquery', 'underscore', 'backbone', 'templates', 'helpers/gauge-helper', 'marionette'], function($, _, Backbone, JST, gaugeHelper) {
    'use strict';

    var OsdDashView = Backbone.Marionette.ItemView.extend({
        className: 'col-lg-3 col-md-3 col-sm-6 col-xs-6 custom-gutter',
        template: JST['app/scripts/templates/osd-dash.ejs'],
        headlineTemplate: _.template('<%- ok %>/<%- total %>'),
        subtextTemplate: _.template('<%- percentage %>% out'),
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
            console.log(model.attributes);
            this.model.set({
                ok: attr.ok.count,
                warn: attr.warn.count,
                critical: attr.critical.count
            });
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
            this.ui.subline.text('In and Up');
            if (warn || critical) {
                var percentage = Math.floor(((warn + critical) / count) * 100);
                this.ui.subtext.text(this.subtextTemplate({
                    percentage: percentage
                }));
            }
            this.ui.headline.text(this.headlineTemplate({
                ok: ok,
                total: count
            }));
        }
    });

    return OsdDashView;
});
