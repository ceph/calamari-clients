/*global define*/

define(['jquery',
        'underscore',
        'backbone',
        'templates',
        'helpers/gauge-helper',
        'collections/pool-collection',
        'marionette'
], function($, _, Backbone, JST, gaugeHelper, PoolCollection) {
    'use strict';

    var PoolsDashView = Backbone.Marionette.ItemView.extend({
        className: 'col-md-3 col-lg-3 col-sm-4 col-xs-6 custom-gutter',
        template: JST['app/scripts/templates/pools-dash.ejs'],
        headlineTemplate: _.template('<%- count %>'),
        quotaTemplate: _.template('<%- name %> Check Quotas'),
        ui: {
            headline: '.headline',
            subtext: '.subtext'
        },
        collectionEvents: {
            'change': 'checkModel',
            'sync': 'updateUI'
        },
        initialize: function() {
            _.bindAll(this);
            this.cluster = Backbone.Marionette.getOption(this, 'cluster');
            if (this.cluster === void 0) {
                this.cluster = 1;
            }
            this.collection = new PoolCollection({
                cluster: this.cluster
            });
            this.App = Backbone.Marionette.getOption(this, 'App');
            if (this.App) {
                this.listenTo(this.App.vent, 'pool:update', this.updateCollection);
                this.listenTo(this.App.vent, 'cluster:update', this.switchCluster);
                this.App.ReqRes.setHandler('get:pools', this.getPoolsHandler);
            }
            gaugeHelper(this);
        },
        getPoolsHandler: function() {
            return this.collection.reduce(function(memo, m) {
                var id = m.get('pool_id');
                var name = m.get('name') || 'unknown';
                memo[id] = name;
                return memo;
            }, {});
        },
        switchCluster: function(cluster) {
            if (cluster) {
                this.collection.cluster = cluster.get('id');
            }
        },
        updateCollection: function() {
            this.collection.fetch();
        },
        quotaWarningThreshold: 0.8,
        testQuota: function(model) {
            /*jshint camelcase: false */
            var attr = model.attributes;
            if (attr.quota_max_bytes > 0 && (attr.used_bytes / attr.quota_max_bytes) > this.quotaWarningThreshold) {
                return true;
            }
            if (attr.quota_max_objects > 0 && (attr.used_objects / attr.quota_max_objects) > this.quotaWarningThreshold) {
                return true;
            }
            return false;
        },
        checkModel: function() {
            this.updateUI(this.collection);
        },
        updateUI: function(collection) {
            var text = '';
            this.ui.headline.text(this.headlineTemplate({
                count: collection.length
            }));
            var model = collection.find(this.testQuota);
            var status = 'status:ok';
            if (model) {
                text = this.quotaTemplate({
                    name: model.get('name')
                });
                status = 'status:warn';
            }
            this.ui.subtext.text(text);
            this.trigger(status);
        }
    });

    return PoolsDashView;
});
