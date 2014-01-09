/* global define */
define(['backbone', 'react', 'helpers/react-mixins'], function(Backbone, React, mixins) {
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
                title: 'Unconfigured',
                frequencyMs: 1000
            };
        },
        propTypes: {
            size: React.PropTypes.string,
            classId: React.PropTypes.string,
            icon: React.PropTypes.string,
            title: React.PropTypes.string,
            url: React.PropTypes.string.isRequired
        },
        componentDidMount: function() {
            if (this.props.vent) {
                this.listenTo(this.props.vent, 'gauges:disappear', this.disappear);
                this.listenTo(this.props.vent, 'gauges:reappear', this.reappear);
                this.listenTo(this, 'status:ok', this.ok);
                this.listenTo(this, 'status:warn', this.warn);
                this.listenTo(this, 'status:fail', this.fail);
            }
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
        disappear: function() {
            this.setState({
                style: {
                    display: 'none'
                }
            });
        },
        reappear: function() {
            this.setState({
                style: {
                    display: 'block'
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
                'fa-lg': true,
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
                            className: 'card-title',
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
