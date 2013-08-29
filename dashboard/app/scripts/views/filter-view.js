/*global define*/
define(['jquery', 'underscore', 'backbone', 'templates', 'collections/filter-collection', 'models/filter-model', 'views/filter-label-view', 'marionette'], function($, _, Backbone, JST, FilterCollection, FilterModel, FilterLabelView) {
    'use strict';

    function makePGStateTest(state) {
        return function(m) {
            return m.get('pg_states')[state] !== undefined;
        };
    }
    /*
     * FilterView
     */
    return Backbone.Marionette.CollectionView.extend({
        tagName: 'ul',
        template: JST['app/scripts/templates/filter.ejs'],
        itemView: FilterLabelView,
        collection: new FilterCollection(),
        clickHandlerDisabled: false,
        state: 'osd',
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
                category: 'pg',
                label: 'active',
                index: 'active',
                visible: false,
                match: makePGStateTest('active')
            }, {
                category: 'pg',
                label: 'clean',
                index: 'clean',
                visible: false,
                match: makePGStateTest('clean')
            }, {
                category: 'pg',
                labelState: 'warning',
                label: 'creating',
                index: 'creating',
                visible: false,
                match: makePGStateTest('creating')
            }, {
                category: 'pg',
                labelState: 'warning',
                label: 'replaying',
                index: 'replay',
                visible: false,
                match: makePGStateTest('replaying')
            }, {
                category: 'pg',
                labelState: 'warning',
                label: 'splitting',
                index: 'splitting',
                visible: false,
                match: makePGStateTest('splitting')
            }, {
                category: 'pg',
                labelState: 'warning',
                label: 'scrubbing',
                index: 'scrubbing',
                visible: false,
                match: makePGStateTest('scrubbing')
            }, {
                category: 'pg',
                labelState: 'warning',
                label: 'degraded',
                index: 'degraded',
                visible: false,
                match: makePGStateTest('degraded')
            }, {
                category: 'pg',
                labelState: 'warning',
                label: 'repair',
                index: 'repair',
                visible: false,
                match: makePGStateTest('repair')
            }, {
                category: 'pg',
                labelState: 'warning',
                label: 'recovering',
                index: 'recovering',
                visible: false,
                match: makePGStateTest('recovering')
            }, {
                category: 'pg',
                labelState: 'warning',
                label: 'backfill',
                index: 'backfill',
                visible: false
            }, {
                category: 'pg',
                labelState: 'warning',
                label: 'wait-backfill',
                index: 'wait-backfill',
                visible: false,
                match: makePGStateTest('wait-backfill')
            }, {
                category: 'pg',
                labelState: 'warning',
                label: 'remapped',
                index: 'remapped',
                visible: false,
                match: makePGStateTest('remapped')
            }, {
                category: 'pg',
                labelState: 'important',
                label: 'inconsistent',
                index: 'inconsistent',
                visible: false,
                match: makePGStateTest('inconsistent')
            }, {
                category: 'pg',
                labelState: 'important',
                label: 'down',
                index: 'down',
                visible: false,
                match: makePGStateTest('down')
            }, {
                category: 'pg',
                labelState: 'important',
                label: 'peering',
                index: 'peering',
                visible: false,
                match: makePGStateTest('peering')
            }, {
                category: 'pg',
                labelState: 'important',
                label: 'incomplete',
                index: 'incomplete',
                visible: false,
                match: makePGStateTest('incomplete')
            }, {
                category: 'pg',
                labelState: 'important',
                label: 'stale',
                index: 'stale',
                visible: false,
                match: makePGStateTest('stale')
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
            this.state = 'osd';
            var children = this.children;
            this.collection.each(function(m) {
                if (m.get('category') !== 'osd') {
                    m.set('visible', false, {});
                } else {
                    m.set('visible', true, {});
                }
                children.findByModel(m).render();
            });
        },
        pgFilter: function() {
            // TODO write a function to async load the counts and set them
            this.state = 'pg';
            var children = this.children;
            this.collection.each(function(m) {
                if (m.get('category') === 'osd') {
                    m.set('visible', false, {});
                } else {
                    m.set('visible', true, {});
                }
                children.findByModel(m).render();
            });
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
            var osdcounts = this.App.ReqRes.request('get:osdcounts');
            _.each(osdfilters, function(model) {
                var counts = _.filter(osdcounts, function(value, key) {
                    return model.get('index') === key;
                });
                var count = _.first(counts);
                if (count) {
                    model.set('count', count, {
                        silent: true
                    });
                } else {
                    model.set('count', 0, {
                        silent: true
                    });
                }
                children.findByModel(model).render();
            });
            var pgfilters = collection.reject(function(m) {
                return m.get('category') === 'osd';
            });
            var pgcounts = this.App.ReqRes.request('get:pgcounts');
            _.each(pgfilters, function(model) {
                var counts = _.filter(pgcounts, function(value, key) {
                    return model.get('index') === key;
                });
                var count = _.first(counts);
                if (count) {
                    model.set('count', count, {
                        silent: true
                    });
                } else {
                    model.set('count', 0, {
                        silent: true
                    });
                }
                children.findByModel(model).render();
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
                category: this.state,
                index: index
            }));
            model.set('enabled', !model.get('enabled'));
            this.children.findByModel(model).render();
        }
    });
});
