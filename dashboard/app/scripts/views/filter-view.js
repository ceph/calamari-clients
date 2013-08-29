/*global define*/
define(['jquery', 'underscore', 'backbone', 'templates', 'collections/filter-collection', 'models/filter-model', 'views/switcher-view', 'views/filter-label-view', 'marionette'], function($, _, Backbone, JST, FilterCollection, FilterModel, SwitcherView, FilterLabelView) {
    'use strict';

    /*
     * FilterView
     */
    return Backbone.Marionette.CollectionView.extend({
        className: 'filter span2',
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
                label: 'creating',
                index: 'creating',
                visible: false
            }, {
                category: 'pg-warn',
                label: 'replaying',
                index: 'replaying',
                visible: false
            }, {
                category: 'pg-warn',
                label: 'splitting',
                index: 'splitting',
                visible: false
            }, {
                category: 'pg-warn',
                label: 'scrubbing',
                index: 'scrubbing',
                visible: false
            }, {
                category: 'pg-warn',
                label: 'degraded',
                index: 'degraded',
                visible: false
            }, {
                category: 'pg-warn',
                label: 'repair',
                index: 'repair',
                visible: false
            }, {
                category: 'pg-warn',
                label: 'recovery',
                index: 'recovery',
                visible: false
            }, {
                category: 'pg-warn',
                label: 'backfill',
                index: 'backfill',
                visible: false
            }, {
                category: 'pg-warn',
                label: 'wait-backfill',
                index: 'wait-backfill',
                visible: false
            }, {
                category: 'pg-warn',
                label: 'remapped',
                index: 'remapped',
                visible: false
            }, {
                category: 'pg-crit',
                label: 'down',
                index: 'down',
                visible: false
            }, {
                category: 'pg-crit',
                label: 'peering',
                index: 'peering',
                visible: false
            }, {
                category: 'pg-crit',
                label: 'incomplete',
                index: 'incomplete',
                visible: false
            }, {
                category: 'pg-crit',
                label: 'stale',
                index: 'stale',
                visible: false
            }]);
            _.bindAll(this, 'postRender', 'vizUpdate', 'reset', 'updateCounts');
            this.listenTo(this, 'render', this.postRender);
            this.listenTo(this.collection, 'change', this.vizUpdate);
            this.listenTo(this.App.vent, 'viz:render', this.filterEnable);
            this.listenTo(this.App.vent, 'viz:dashboard', this.reset);
            this.listenTo(this.App.vent, 'filter:update', this.updateCounts);
        },
        reset: function() {
            this.$('.label-disabled').removeClass('label-disabled');
            _.each(this.collection.where({
                'visible': true,
                'enabled': false
            }), function(m) {
                m.set('enabled', true);
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
        updateCounts: function() {
            var counts = this.App.ReqRes.request('get:osdcounts');
            var collection = this.collection;
            var children = this.children;
            _.each(counts, function(value, key) {
                var models = collection.where({
                    category: 'osd',
                    'index': key
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
        postRender: function() {
            this.switcher = new SwitcherView({
                el: this.$('.switcher')
            });
            this.switcher.render();
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
