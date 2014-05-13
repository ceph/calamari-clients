/* global define */
define(['jquery', 'underscore', 'templates', 'backbone', 'loglevel', 'collections/cluster-collection', 'marionette'], function($, _, JST, Backbone, log, Clusters) {
    'use strict';
    // This component is currently *not* rendered. We use it to manage the
    // current list of Clusters collection being advertised by the Calamari backend
    // and broadcast updates when the currently selected cluster changes
    // in the UI.
    //
    // At some future point, this will be restored to the UI so we can manage
    // multiple ceph clusters.
    var ClusterDropDown = Backbone.Marionette.ItemView.extend({
        template: JST['app/scripts/templates/clusterdropdown.ejs'],
        tagName: 'ul',
        className: 'nav pull-right',
        rowTemplate: _.template('<li><a class="cluster" tabindex="-1" href="#" data-id="<%- id %>"><%- name %></a></li>'),
        ui: {
            'label': '.dropdown-toggle',
            'menu': '.dropdown-menu'
        },
        events: {
            'click .cluster': 'clusterHandler'
        },
        initialize: function() {
            this.App = Backbone.Marionette.getOption(this, 'App');
            this.collection = new Clusters();
            this.listenTo(this.collection, 'sync', this.render);
            this.listenTo(this, 'render', this.postRender);
            _.bindAll(this, 'clusterHandler');
            this.App.ReqRes.setHandler('get:cluster', function() {
                return _.clone(this.cluster);
            }.bind(this));
        },
        clusterHandler: function(evt) {
            var $target = $(evt.target);
            var id = $target.attr('data-id');
            this.ui.label.text('Cluster ' + $target.text());
            this.cluster = this.collection.get(id);
            this.App.vent.trigger('cluster:update', this.cluster);
        },
        postRender: function() {
            var t = this.rowTemplate;
            var markup = [];
            this.collection.each(function(m) {
                log.debug(m.toJSON());
                markup.push(t(m.toJSON()));
            });
            this.ui.menu.html(markup.join(''));
            this.cluster = this.collection.first();
            this.ui.label.text('Cluster ' + this.cluster.get('name'));
            this.App.vent.trigger('cluster:update', this.cluster);
        },
        fetch: function(options) {
            return this.collection.fetch(options);
        }

    });
    return ClusterDropDown;
});
