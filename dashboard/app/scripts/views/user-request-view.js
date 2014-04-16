/* global define */
define(['jquery', 'underscore', 'templates', 'backbone', 'collections/user-request-collection', 'l20nCtx!locales/{{locale}}/strings', 'moment', 'helpers/animation', 'marionette'], function($, _, JST, Backbone, UserRequestCollection, l10n, moment) {
    'use strict';
    var UserRequestView = Backbone.Marionette.ItemView.extend({
        template: JST['app/scripts/templates/user-request.ejs'],
        requestTemplate: JST['app/scripts/templates/request.ejs'],
        requestErrorTemplate: JST['app/scripts/templates/request-error.ejs'],
        norequestTemplate: JST['app/scripts/templates/no-request.ejs'],
        tagName: 'div',
        className: '',
        events: {
            'click .closer': 'hide'
        },
        ui: {
            'tbody': 'tbody'
        },
        initialize: function() {
            _.bindAll(this, 'show', 'hide', 'updateCollection', 'buildCollectionView');
            this.App = Backbone.Marionette.getOption(this, 'App');
            this.clusterId = Backbone.Marionette.getOption(this, 'cluster');
            this.collection = new UserRequestCollection([], {
                cluster: this.clusterId
            });
            this.listenToOnce(this, 'render', function() {
                // animate first render
                this.collection.fetch().then(this.updateCollection);
                var $el = this.$('.am-fade-and-slide-right').addClass('ng-enter');
                setTimeout(function() {
                    $el.addClass('ng-enter-active');
                }.bind(this), 10);
            }.bind(this));
        },
        serializeData: function() {
            return {
                title: l10n.getSync('UserRequestViewTitle'),
                colTask: l10n.getSync('UserRequestViewColTask'),
                colStatus: l10n.getSync('UserRequestViewColStatus'),
                colUpdated: l10n.getSync('UserRequestViewColUpdated'),
                closeBtn: l10n.getSync('UserRequestViewCloseBtn')
            };
        },
        buildCollectionView: function(results) {
            return _.reduce(results, function(result, task) {
                var state = task.state;
                var clazz = 'text-success fa fa-check-circle';
                var template = this.requestTemplate;
                if (task.state === 'submitted') {
                    clazz = 'text-info fa fa-spinner fa-spin';
                } else if (task.error) {
                    clazz = 'text-warning fa fa-exclamation-circle';
                    state = l10n.getSync('UserRequestViewError');
                    template = this.requestErrorTemplate;
                }
                /* jshint camelcase: false */
                var time = moment(task.state === 'complete' ? task.completed_at : task.requested_at).fromNow();
                result.push(template({
                    clazz: clazz,
                    headline: task.headline,
                    state: state,
                    time: time,
                    error_message: task.error_message
                }));
                return result;
            }.bind(this), []);
        },
        updateCollection: function(resp) {
            if (resp.results.length === 0) {
                this.ui.tbody.html(this.norequestTemplate());
                return;
            }
            this.ui.tbody.html(this.buildCollectionView(resp.results).join(''));
        },
        show: function() {
            this.$el.show();
            this.$('.am-fade-and-slide-right').addClass('ng-enter');
            setTimeout(function() {
                this.$('.ng-enter').addClass('ng-enter-active');
                this.collection.fetch().then(this.updateCollection);
            }.bind(this), 10);
        },
        hide: function() {
            var $el = this.$('.am-fade-and-slide-right');
            $el.removeClass('ng-enter ng-enter-active').addClass('ng-leave');
            setTimeout(function() {
                this.$el.hide();
                $el.removeClass('ng-leave');
            }.bind(this), 300);
        }
    });
    return UserRequestView;
});
