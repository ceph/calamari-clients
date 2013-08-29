/*global define*/
define(['jquery', 'underscore', 'backbone', 'templates', 'collections/filter-collection', 'models/filter-model', 'views/filter-label-view', 'marionette'], function($, _, Backbone, JST, FilterCollection, FilterModel, FilterLabelView) {
    'use strict';

    /*
     * FilterView
     */
    return Backbone.Marionette.CollectionView.extend({
        tagName: 'ul',
        template: JST['app/scripts/templates/filter.ejs'],
        itemView: FilterLabelView,
        collection: new FilterCollection(),
        clickHandlerDisabled: false,
        events: {
            'click .label': 'clickHandler'
        },
        initialize: function() {
            this.App = Backbone.Marionette.getOption(this, 'App');
            this.collection.set([{
                label: 'up/in',
                index: 'inup',
                match: function(m) {
                    return m.get('up') && m.get('in');
                }
            }, {
                label: 'up/out',
                index: 'outup',
                labelState: 'warning',
                match: function(m) {
                    return m.get('up') && !m.get('in');
                }
            }, {
                label: 'down/in',
                index: 'indown',
                labelState: 'warning',
                match: function(m) {
                    return !m.get('up') && m.get('in');
                }
            }, {
                label: 'down',
                index: 'down',
                labelState: 'important',
                match: function(m) {
                    return !m.get('in') && !m.get('up');
                }
            }, {
                category: 'pg-ok',
                label: 'active',
                index: 'active',
                visible: false
            }, {
                category: 'pg-ok',
                label: 'clean',
                index: 'clean',
                visible: false
            }, {
                category: 'pg-warn',
                labelState: 'warning',
                label: 'creating',
                index: 'creating',
                visible: false
            }, {
                category: 'pg-warn',
                labelState: 'warning',
                label: 'replaying',
                index: 'replaying',
                visible: false
            }, {
                category: 'pg-warn',
                labelState: 'warning',
                label: 'splitting',
                index: 'splitting',
                visible: false
            }, {
                category: 'pg-warn',
                labelState: 'warning',
                label: 'scrubbing',
                index: 'scrubbing',
                visible: false
            }, {
                category: 'pg-warn',
                labelState: 'warning',
                label: 'degraded',
                index: 'degraded',
                visible: false
            }, {
                category: 'pg-warn',
                labelState: 'warning',
                label: 'repair',
                index: 'repair',
                visible: false
            }, {
                category: 'pg-warn',
                labelState: 'warning',
                label: 'recovery',
                index: 'recovery',
                visible: false
            }, {
                category: 'pg-warn',
                labelState: 'warning',
                label: 'backfill',
                index: 'backfill',
                visible: false
            }, {
                category: 'pg-warn',
                labelState: 'warning',
                label: 'wait-backfill',
                index: 'wait-backfill',
                visible: false
            }, {
                category: 'pg-warn',
                labelState: 'warning',
                label: 'remapped',
                index: 'remapped',
                visible: false
            }, {
                category: 'pg-crit',
                labelState: 'important',
                label: 'down',
                index: 'down',
                visible: false
            }, {
                category: 'pg-crit',
                labelState: 'important',
                label: 'peering',
                index: 'peering',
                visible: false
            }, {
                category: 'pg-crit',
                labelState: 'important',
                label: 'incomplete',
                index: 'incomplete',
                visible: false
            }, {
                category: 'pg-crit',
                labelState: 'important',
                label: 'stale',
                index: 'stale',
                visible: false
            }]);
            _.bindAll(this, 'vizUpdate', 'reset', 'updateOSDCounts');
            this.listenTo(this.collection, 'change:enabled', this.vizUpdate);
            this.listenTo(this.App.vent, 'viz:render', this.filterEnable);
            this.listenTo(this.App.vent, 'viz:dashboard', this.reset);
            this.listenTo(this.App.vent, 'filter:update', this.updateOSDCounts);
            this.listenTo(this.App.vent, 'switcher:one', this.osdFilter);
            this.listenTo(this.App.vent, 'switcher:two', this.pgFilter);
        },
        osdFilter: function() {
            var children = this.children;
            this.collection.each(function(m) {
                if (m.get('category') !== 'osd') {
                    m.set('visible', false, {});
                } else {
                    m.set('visible', true, {});
                }
                children.findByModel(m).render();
            });
            console.log('osd');
        },
        pgFilter: function() {
            // TODO write a function to async load the counts and set them
            var children = this.children;
            this.collection.each(function(m) {
                if (m.get('category') === 'osd') {
                    m.set('visible', false, {});
                } else {
                    m.set('visible', true, {});
                }
                children.findByModel(m).render();
            });
            console.log('pg');
        },
        reset: function() {
            this.$('.label-disabled').removeClass('label-disabled');
            _.each(this.collection.where({
                'visible': true,
                'enabled': false
            }), function(m) {
                m.set('enabled', true, {
                    silent: true
                });
            });
        },
        filterEnable: function() {
            this.$('.label').removeClass('busy');
            this.clickHandlerDisabled = false;
        },
        vizUpdate: function() {
            if (this.App && this.App.vent) {
                this.App.vent.trigger('viz:filter', this.collection);
            }
        },
        updateOSDCounts: function() {
            var collection = this.collection;
            var children = this.children;
            var osdfilters = collection.where({
                category: 'osd'
            });
            _.each(this.App.ReqRes.request('get:osdcounts'), function(value, key) {
                var models = _.filter(osdfilters, function(m) {
                    return m.get('index') === key;
                });
                var model = _.first(models);
                if (model) {
                    model.set('count', value, {
                        silent: true
                    });
                    children.findByModel(model).render();
                }
            });
            var pgfilters = collection.reject(function(m) {
                return m.get('category') === 'osd';
            });
            _.each(this.App.ReqRes.request('get:pgcounts'), function(value, key) {
                var models = _.filter(pgfilters, function(m) {
                    return m.get('index') === key;
                });
                var model = _.first(models);
                if (model) {
                    model.set('count', value, {
                        silent: true
                    });
                    children.findByModel(model).render();
                }
            });
        },
        serializeModel: function(model) {
            var data = model.toJSON();
            if (!data.enabled) {
                data.labelColor = 'label-disabled';
            }
            return data;
        },
        clickHandler: function(evt) {
            if (this.clickHandlerDisabled) {
                return;
            }
            this.$('.label').addClass('busy');
            this.clickHandlerDisabled = true;
            var $target = $(evt.target);
            var index = $target.attr('data-filter');
            var model = _.first(this.collection.where({
                category: 'osd',
                index: index
            }));
            model.set('enabled', !model.get('enabled'));
            this.children.findByModel(model).render();
        }
    });
});
