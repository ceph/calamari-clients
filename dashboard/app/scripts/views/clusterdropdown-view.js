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
        rowTemplate: _.template('<li><a class="cluster" tabindex="-1" href="#" data-id="<%- id %>"><%- name %> [<%- id_short %>]</a></li>'),
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
            this.collection.comparator = 'name';
            this.listenTo(this.collection, 'sync', this.render);
            this.listenTo(this, 'render', this.postRender);
            _.bindAll(this, 'clusterHandler');
            this.App.ReqRes.setHandler('get:cluster', function() {
                return _.clone(this.cluster);
            }.bind(this));
        },
        clusterLabelTemplate: _.template('<i class="fa fa-tasks"></i> <%- text %> <span class="caret"></span>'),
        clusterHandler: function(evt) {
            var $target = $(evt.target);
            var id = $target.attr('data-id');
            // Remember the last cluster selection in localStorage
            if(typeof(Storage)!=="undefined") {
                localStorage.setItem('cluster', JSON.stringify(id));
            }
            this.ui.label.html(this.clusterLabelTemplate({
                text: $target.text()
            }));
            this.cluster = this.collection.get(id);
            this.App.vent.trigger('cluster:update', this.cluster);
        },
        postRender: function() {
            var t = this.rowTemplate;
            var markup = [];
            this.collection.each(function(m) {
                m.set('id_short', m.get('id').substring(0, 8));
                log.debug(m.toJSON());
                markup.push(t(m.toJSON()));
            });
            this.ui.menu.html(markup.join(''));

            var cluster = this.collection.first();
            if(typeof(Storage)!=="undefined") {
                var lastClusterId = JSON.parse(localStorage.getItem('cluster'));
                var lastCluster = undefined;
                if (!_.isUndefined(lastClusterId)) {
                    lastCluster = this.collection.get(lastClusterId);
                }
                if (!_.isUndefined(lastCluster)) {
                    cluster = lastCluster;
                }
                else {
                    localStorage.setItem('cluster', JSON.stringify(cluster.id));
                }
            }
            this.cluster = cluster;
            
            var text = this.cluster.get('name') + ' [' + this.cluster.get('id_short') + ']';
            this.ui.label.html(this.clusterLabelTemplate({
                text: text
            }));
            this.App.vent.trigger('cluster:update', this.cluster);
        },
        fetch: function(options) {
            return this.collection.fetch(options);
        }

    });
    return ClusterDropDown;
});
