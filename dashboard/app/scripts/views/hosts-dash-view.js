/*global define*/

define(['jquery',
        'underscore',
        'backbone',
        'templates',
        'marionette'
], function($, _, Backbone, JST) {
    'use strict';

    var HostsDashView = Backbone.Marionette.ItemView.extend({
        className: 'col-lg-3 col-md-3 col-sm-6 col-xs-6 custom-gutter',
        template: JST['app/scripts/templates/hosts-dash.ejs'],
        headlineTemplate: _.template('<%- count %>'),
        subtextTemplate: _.template('<%- mon %> MON/<%- host %> OSD'),
        ui: {
            'headline': '.headline',
            'subtext': '.subtext'
        },
        initialize: function() {
            _.bindAll(this);
            this.App = Backbone.Marionette.getOption(this, 'App');
            if (this.App) {
                this.listenTo(this.App.vent, 'filter:update', this.fetchHosts);
            }
        },
        fetchHosts: function() {
            var hosts = this.App.ReqRes.request('get:hosts');
            this.ui.headline.text(this.headlineTemplate({
                count: hosts.length
            }));
            this.ui.subtext.text(this.subtextTemplate({
                host: hosts.length,
                mon: '?' 
            }));
        }
    });

    return HostsDashView;
});
