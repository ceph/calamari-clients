/* global define */
define(['backbone', 'react'], function(Backbone, React) {
    'use strict';
    var TypeOneView = React.createClass({
        mixins: [Backbone.Events],
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
                size: 'col-lg-3 col-md-3 col-sm-3 col-xs-3',
                classId: 'typeOne',
                icon: 'fa-heart',
                title: 'Unconfigured'
            };
        },
        propTypes: {
            size: React.PropTypes.string,
            classId: React.PropTypes.string,
            icon: React.PropTypes.string,
            title: React.PropTypes.string
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
            var stateIcon = 'fa-check';
            var stateColor = 'ok';
            if (this.state.status === 'warn') {
                stateIcon = 'fa-warning';
                stateColor = 'warn';
            } else if (this.state.status === 'fail') {
                stateIcon = 'fa-exclamation-circle';
                stateColor = 'fail';
            }
            return React.DOM.div({
                style: this.state.style
            }, [
                React.DOM.div({
                    className: this.props.size + ' custom-gutter '
                }, [
                    React.DOM.div({
                        className: 'gauge card ' + this.props.classId
                    }, [
                        React.DOM.span({
                            className: 'card-title',
                        }, [
                            React.DOM.i({
                                className: 'fa ' + this.props.icon + ' fa-lg'
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
                            className: 'card-icon ' + stateColor
                        }, [
                            React.DOM.span({
                                className: 'fa-stack fa-lg fa-2x'
                            }, [
                                React.DOM.i({
                                    className: 'fa fa-square-o fa-stack-2x'
                                }),
                                React.DOM.i({
                                    className: 'fa ' + stateIcon + ' fa-stack-1x'
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
