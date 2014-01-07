/* global define */
define(['react', 'underscore'], function(React) {
    'use strict';
    var TypeOneView = React.createClass({
        getInitialState: function() {
            return {
                status: 'ok',
                headline: '',
                subline: '',
                subtext: ''
            };
        },
        render: function() {
            var icon = 'fa-check';
            var color = 'ok';
            if (this.state.status === 'warn') {
                icon = 'fa-warning';
                color = 'warn';
            } else if (this.state.status === 'fail') {
                icon =  'fa-exclamation-circle';
                color = 'fail';
            }
            return React.DOM.div({}, [
                React.DOM.div({
                    className: 'gauge card ' + this.props.size + ' ' + this.props.classId
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
                            this.state.headline
                        ),
                        React.DOM.div({
                            className: 'subline',
                            ref: 'subline'
                        },
                            this.state.subline
                        ),
                        React.DOM.div({
                            className: 'subtext',
                            ref: 'subtext'
                        },
                            this.state.subtext
                        )
                    ]),
                    React.DOM.div({
                        className: 'card-icon ' + color
                    }, [
                        React.DOM.span({
                            className: 'fa-stack fa-lg fa-2x'
                        }, [
                            React.DOM.i({
                                className: 'fa fa-square-o fa-stack-2x'
                            }),
                            React.DOM.i({
                                className: 'fa ' + icon + ' fa-stack-1x'
                            })
                        ])
                    ])
                ])
            ]);

        }
    });
    return TypeOneView;
});
