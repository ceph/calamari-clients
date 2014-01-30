/* global define */
define(['underscore', 'backbone', 'loglevel', 'react', 'helpers/react-mixins', 'helpers/animation', 'l20nCtx!locales/{{locale}}/strings'], function(_, Backbone, log, React, mixins, animation, l10n) {
    'use strict';
    var TypeOneView = React.createClass({
        mixins: [
            Backbone.Events,
            mixins.SetIntervalMixin,
            mixins.PollerMixin
        ],
        getInitialState: function() {
            return {
                status: 'ok',
                headline: '',
                subline: '',
                subtext: '',
                style: {
                    display: 'block'
                }
            };
        },
        getDefaultProps: function() {
            return {
                size: 'col-lg-3 col-md-3 col-sm-6 col-xs-6',
                classId: 'typeOne',
                icon: 'fa-heart',
                title: l10n.getSync('unconfigured'),
                fields: ['primary', 'secondary'],
                frequencyMs: 30000,
                headlineTemplate: _.template('<%- primary %> / <%- secondary %>')
            };
        },
        disappearAnimation: animation.single('fadeOutUpAnim'),
        reappearAnimation: animation.single('fadeInDownAnim'),
        propTypes: {
            size: React.PropTypes.string,
            classId: React.PropTypes.string,
            icon: React.PropTypes.string,
            title: React.PropTypes.string,
            url: React.PropTypes.string.isRequired,
            fields: React.PropTypes.array,
            frequencyMs: React.PropTypes.number,
            headlineTemplate: React.PropTypes.func
        },
        componentDidMount: function() {
            if (this.props.vent) {
                this.listenTo(this.props.vent, 'gauges:collapse', this.collapse);
                this.listenTo(this.props.vent, 'gauges:expand', this.expand);
                this.listenTo(this.props.vent, 'gauges:disappear', this.disappear);
                this.listenTo(this.props.vent, 'gauges:reappear', this.reappear);
                this.listenTo(this, 'status:ok', this.ok);
                this.listenTo(this, 'status:warn', this.warn);
                this.listenTo(this, 'status:fail', this.fail);
            }
            if (this.model) {
                this.listenTo(this.model, 'change', this.modelChangeHandler);
                this.props.vent.trigger('poll');
            }
        },
        modelChangeHandler: function(model) {
            log.info('model changed!');
            var obj = _.reduce(this.props.fields, function(memo, field) {
                memo[field] = model.get(field);
                return memo;
            }, {});
            if (_.isString(this.props.headlineTemplate)) {
                this.setProps({
                    'headlineTemplate': _.template(this.props.headlineTemplate)
                });
            }

            var status = model.get('status');
            var statusObj = {};
            if (status && _.isObject(status)) {
                if (status.state) {
                    var state = status.state;
                    if (state === 'ok' || state === 'warn' || state === 'fail') {
                        this.trigger('status:' + status.state);
                        statusObj = {
                            subtext: status.message
                        };
                    }
                }
            }
            this.setState(_.extend({
                'headline': this.props.headlineTemplate(obj)
            }, statusObj));
        },
        ok: function() {
            this.setState({
                status: 'ok'
            });
        },
        warn: function() {
            this.setState({
                status: 'warn'
            });
        },
        fail: function() {
            this.setState({
                status: 'fail'
            });
        },
        collapse: function(callback) {
            this.setState({
                style: {
                    display: 'none'
                }
            });
            if (_.isFunction(callback)) {
                callback.apply(this);
            }
        },
        expand: function(callback) {
            this.setState({
                style: {
                    display: 'block'
                }
            });
            if (_.isFunction(callback)) {
                callback.apply(this);
            }
        },
        disappear: function() {
            this.disappearAnimation(this.getDOMNode(), function(callback) {
                this.setState({
                    style: {
                        visibility: 'hidden'
                    }
                });
                if (_.isFunction(callback)) {
                    callback.apply(this);
                }
            });
        },
        reappear: function() {
            this.reappearAnimation(this.getDOMNode(), function(callback) {
                this.setState({
                    style: {
                        visibility: 'visible'
                    }
                });
                if (_.isFunction(callback)) {
                    callback.apply(this);
                }
            });
        },
        componentWillUnmount: function() {
            this.stopListening();
        },
        render: function() {
            var cardIconStateClasses = {
                fa: true,
                'fa-stack-1x': true,
                'fa-check': this.state.status === 'ok',
                'fa-warning': this.state.status === 'warn',
                'fa-exclamation-circle': this.state.status === 'fail'
            };
            var cardIconClasses = {
                'card-icon': true,
                'ok': this.state.status === 'ok',
                'warn': this.state.status === 'warn',
                'fail': this.state.status === 'fail'
            };
            var iconClasses = {
                fa: true,
                'fa-lg': true
            };
            iconClasses[this.props.icon] = true;
            var cx = React.addons.classSet;

            var sizeClasses = {
                'custom-gutter': true
            };
            sizeClasses[this.props.size] = true;

            var cardClasses = {
                gauge: true,
                card: true
            };
            cardClasses[this.props.classId] = true;

            return React.DOM.div({
                style: this.state.style
            }, [
                React.DOM.div({
                    className: cx(sizeClasses)
                }, [
                    React.DOM.div({
                        className: cx(cardClasses)
                    }, [
                        React.DOM.span({
                            className: 'card-title'
                        }, [
                            React.DOM.i({
                                className: cx(iconClasses)
                            }),
                                ' ' + this.props.title
                        ]),
                        React.DOM.div({
                            className: 'content'
                        }, [
                            React.DOM.div({
                                className: 'headline',
                                ref: 'headline'
                            },
                                this.state.headline),
                            React.DOM.div({
                                className: 'subline',
                                ref: 'subline'
                            },
                                this.state.subline),
                            React.DOM.div({
                                className: 'subtext',
                                ref: 'subtext'
                            },
                                this.state.subtext)
                        ]),
                        React.DOM.div({
                            className: cx(cardIconClasses)
                        }, [
                            React.DOM.span({
                                className: 'fa-stack fa-lg fa-2x'
                            }, [
                                React.DOM.i({
                                    className: 'fa fa-square-o fa-stack-2x'
                                }),
                                React.DOM.i({
                                    className: cx(cardIconStateClasses)
                                })
                            ])
                        ])
                    ])
                ])
            ]);

        }
    });
    return TypeOneView;
});
