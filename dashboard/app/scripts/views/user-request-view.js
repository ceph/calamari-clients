/* global define */
define(['jquery', 'underscore', 'templates', 'backbone', 'collections/user-request-collection', 'l20nCtx!locales/{{locale}}/strings', 'moment', 'marionette'], function($, _, JST, Backbone, UserRequestCollection, l10n, moment) {
    'use strict';
    var UserRequestView = Backbone.Marionette.ItemView.extend({
        template: JST['app/scripts/templates/user-request.ejs'],
        request: JST['app/scripts/templates/request.ejs'],
        norequest: JST['app/scripts/templates/no-request.ejs'],
        tagName: 'div',
        className: '',
        events: {
            'click .closer': 'hide'
        },
        ui: {
            'tbody': 'tbody'
        },
        initialize: function() {
            this.App = Backbone.Marionette.getOption(this, 'App');
            this.clusterId = Backbone.Marionette.getOption(this, 'cluster');
            this.collection = new UserRequestCollection([], {
                cluster: this.clusterId
            });
            this.listenTo(this.App.vent, 'UserRequestView:toggle', this.show);
            _.bindAll(this, 'show', 'hide');
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
        show: function() {
            this.$el.show();
            var self = this;
            this.collection.fetch().then(function(resp) {
                if (resp.results.length === 0) {
                    self.ui.tbody.html(self.norequest());
                } else {
                    var markup = _.reduce(resp.results, function(result, task) {
                        var clazz;
                        switch (task.state) {
                            case 'submitted':
                                clazz = 'text-info fa fa-spinner fa-spin';
                                break;
                            case 'error':
                                clazz = 'text-warning fa fa-exclamation-circle';
                                break;
                            default:
                                clazz = 'text-success fa fa-check-circle';
                                break;
                        }
                        /* jshint camelcase: false */
                        var time = moment(task.state === 'complete' ? task.completed_at : task.requested_at).fromNow();
                        result.push(self.request({
                            clazz: clazz,
                            headline: task.headline,
                            state: task.state,
                            time: time
                        }));
                        return result;
                    }, []);
                    self.ui.tbody.html(markup.join(''));
                }
            });
        },
        hide: function() {
            this.$el.hide();
        }
    });
    return UserRequestView;
});
