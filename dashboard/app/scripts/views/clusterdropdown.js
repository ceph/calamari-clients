/* global define */
define(['jquery', 'underscore', 'templates', 'backbone', 'collections/cluster-collection', 'marionette'], function($, _, JST, Backbone, Clusters) {
    'use strict';
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
            'click .cluster': 'clusterHandler',
        },
        initialize: function() {
            this.App = Backbone.Marionette.getOption(this, 'App');
            this.collection = new Clusters();
            this.listenTo(this.collection, 'sync', this.render);
            this.listenTo(this, 'render', this.postRender);
            _.bindAll(this, 'clusterHandler');
        },
        clusterHandler: function(evt) {
            var $target = $(evt.target);
            var id = $target.attr('data-id');
            this.ui.label.text('Cluster ' + $target.text());
            this.App.vent.trigger('cluster:update', this.collection.get(id));
        },
        postRender: function() {
            var t = this.rowTemplate;
            var markup = [];
            this.collection.each(function(m) {
                console.log(m.toJSON());
                markup.push(t(m.toJSON()));
            });
            this.ui.menu.html(markup.join(''));
            var cluster = this.collection.at(0);
            this.ui.label.text('Cluster ' + cluster.get('name'));
            this.App.vent.trigger('cluster:update', cluster);
        },
        fetch: function(options) {
            return this.collection.fetch(options);
        }

    });
    return ClusterDropDown;
});
