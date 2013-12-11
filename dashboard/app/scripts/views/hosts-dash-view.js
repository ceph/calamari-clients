/*global define*/

define(['jquery',
        'underscore',
        'backbone',
        'templates',
        'helpers/gauge-helper',
        'collections/server-collection',
        'marionette'
], function($, _, Backbone, JST, gaugeHelper, ServerCollection) {
    'use strict';

    var HostsDashView = Backbone.Marionette.ItemView.extend({
        className: 'col-lg-3 col-md-3 col-sm-4 col-xs-6 custom-gutter',
        template: JST['app/scripts/templates/hosts-dash.ejs'],
        headlineTemplate: _.template('<%- count %>'),
        subtextTemplate: _.template('<%- mon %> MON/<%- osd %> OSD'),
        collectionEvents: {
            'change': 'checkModel',
            'sync': 'updateUI'
        },
        ui: {
            'headline': '.headline',
            'subtext': '.subtext'
        },
        initialize: function() {
            _.bindAll(this);
            this.App = Backbone.Marionette.getOption(this, 'App');
            if (this.App) {
                this.listenTo(this.App.vent, 'host:update', this.fetchHosts);
            }
            this.collection = new ServerCollection();
            gaugeHelper(this);
        },
        checkModel: function() {
            this.updateUI(this.collection);
        },
        fetchHosts: function() {
            this.collection.fetch();
        },
        countServices: function(memo, model) {
            var services = model.get('services');
            _.each(services, function(obj) {
                memo[obj.type] += 1;
            });
            return memo;
        },
        updateUI: function(collection) {
            this.ui.headline.text(this.headlineTemplate({
                count: collection.length
            }));
            var counts = collection.reduce(this.countServices, {
                osd: 0,
                mon: 0
            });
            this.ui.subtext.text(this.subtextTemplate({
                osd: counts.osd,
                mon: counts.mon
            }));
        }
    });

    return HostsDashView;
});
