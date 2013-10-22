/*global define*/
define(['jquery', 'underscore', 'backbone', 'templates', 'collections/filter-collection', 'models/filter-model', 'views/filter-label-view', 'marionette'], function($, _, Backbone, JST, FilterCollection, FilterModel, FilterLabelView) {
    'use strict';

    function makePGStateTest(state) {
        return function(m) {
            var pgs = m.get('pg_states');
            if (pgs) {
                return pgs[state] !== undefined;
            }
            return true;
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
            'mouseenter .make-switch': 'osdPulse',
            'mouseleave .make-switch': 'osdStopPulse'
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
                labelState: 'warn',
                match: function(m) {
                    return m.get('up') && !m.get('in');
                }
            }, {
                label: 'down/in',
                index: 'indown',
                labelState: 'warn',
                match: function(m) {
                    return !m.get('up') && m.get('in');
                }
            }, {
                label: 'down',
                index: 'down',
                labelState: 'crit',
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
                labelState: 'warn',
                label: 'creating',
                index: 'creating',
                visible: false,
                match: makePGStateTest('creating')
            }, {
                category: 'pg',
                labelState: 'warn',
                label: 'replaying',
                index: 'replay',
                visible: false,
                match: makePGStateTest('replaying')
            }, {
                category: 'pg',
                labelState: 'warn',
                label: 'splitting',
                index: 'splitting',
                visible: false,
                match: makePGStateTest('splitting')
            }, {
                category: 'pg',
                labelState: 'warn',
                label: 'scrubbing',
                index: 'scrubbing',
                visible: false,
                match: makePGStateTest('scrubbing')
            }, {
                category: 'pg',
                labelState: 'warn',
                label: 'degraded',
                index: 'degraded',
                visible: false,
                match: makePGStateTest('degraded')
            }, {
                category: 'pg',
                labelState: 'warn',
                label: 'repair',
                index: 'repair',
                visible: false,
                match: makePGStateTest('repair')
            }, {
                category: 'pg',
                labelState: 'warn',
                label: 'recovering',
                index: 'recovering',
                visible: false,
                match: makePGStateTest('recovering')
            }, {
                category: 'pg',
                labelState: 'warn',
                label: 'backfill',
                index: 'backfill',
                visible: false
            }, {
                category: 'pg',
                labelState: 'warn',
                label: 'wait-backfill',
                index: 'wait-backfill',
                visible: false,
                match: makePGStateTest('wait-backfill')
            }, {
                category: 'pg',
                labelState: 'warn',
                label: 'remapped',
                index: 'remapped',
                visible: false,
                match: makePGStateTest('remapped')
            }, {
                category: 'pg',
                labelState: 'crit',
                label: 'inconsistent',
                index: 'inconsistent',
                visible: false,
                match: makePGStateTest('inconsistent')
            }, {
                category: 'pg',
                labelState: 'crit',
                label: 'down',
                index: 'down',
                visible: false,
                match: makePGStateTest('down')
            }, {
                category: 'pg',
                labelState: 'crit',
                label: 'peering',
                index: 'peering',
                visible: false,
                match: makePGStateTest('peering')
            }, {
                category: 'pg',
                labelState: 'crit',
                label: 'incomplete',
                index: 'incomplete',
                visible: false,
                match: makePGStateTest('incomplete')
            }, {
                category: 'pg',
                labelState: 'crit',
                label: 'stale',
                index: 'stale',
                visible: false,
                match: makePGStateTest('stale')
            }]);
            _.bindAll(this, 'vizUpdate', 'reset', 'updateOSDCounts');
            this.vent = new Backbone.Wreqr.EventAggregator();
            this.itemViewOptions = {
                vent: this.vent
            };
            //this.listenTo(this.collection, 'change:enabled', this.vizUpdate);
            this.listenTo(this.vent, 'filter', this.vizUpdate);
            this.listenTo(this.collection, 'change:pulse', this.vizPulse);
            this.listenTo(this.App.vent, 'viz:dashboard', this.reset);
            this.listenTo(this.App.vent, 'filter:update', this.updateOSDCounts);
            this.listenTo(this.App.vent, 'switcher:one', this.osdFilter);
            this.listenTo(this.App.vent, 'switcher:two', this.pgFilter);
        },
        osdFilter: function(deferred) {
            this.state = 'osd';
            this.collection.each(function(m) {
                if (m.get('category') !== 'osd') {
                    m.set('visible', false, {});
                } else {
                    m.set('visible', true, {});
                }
            });
            this.render();
            if (deferred) {
                deferred.resolve();
            }
        },
        pgFilter: function(deferred) {
            // TODO write a function to async load the counts and set them
            this.state = 'pg';
            this.collection.each(function(m) {
                if (m.get('category') === 'osd') {
                    m.set('visible', false, {});
                } else {
                    m.set('visible', true, {});
                }
            });
            this.render();
            if (deferred) {
                deferred.resolve();
            }
        },
        reset: function() {
            this.$('.btn-disabled').removeClass('btn-disabled');
            _.each(this.collection.where({
                'visible': true,
                'enabled': false
            }), function(m) {
                m.set('enabled', true, {
                    silent: true
                });
            });
        },
        vizUpdate: function(deferred) {
            if (this.App && this.App.vent) {
                this.App.vent.trigger('viz:filter', this.collection, deferred);
            }
        },
        vizPulse: function() {
            if (this.App && this.App.vent) {
                this.App.vent.trigger('viz:pulse', this.collection);
            }
        },
        updateOSDCounts: function() {
            var collection = this.collection;
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
                    model.set('count', count, {});
                } else {
                    model.set('count', '0', {});
                }
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
                    model.set('count', count, {});
                } else {
                    model.set('count', 0, {});
                }
            });
        },
        serializeModel: function(model) {
            var data = model.toJSON();
            return data;
        },
        osdPulse: function(evt) {
            evt.stopPropagation();
            evt.preventDefault();
            var $target = $(evt.target);
            var index = $target.closest('.make-switch').attr('data-filter');
            var model = _.first(this.collection.where({
                category: this.state,
                index: index
            }));
            model.set('pulse', true);
        },
        osdStopPulse: function(evt) {
            evt.stopPropagation();
            evt.preventDefault();
            var $target = $(evt.target);
            var index = $target.closest('.make-switch').attr('data-filter');
            var model = _.first(this.collection.where({
                category: this.state,
                index: index
            }));
            model.set('pulse', false);
        }
    });
});
