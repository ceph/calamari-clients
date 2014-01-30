/* global define */
define(['react'], function(React) {
    'use strict';

    var DashboardRow = React.createClass({
        getInitialState: function() {
            return {
                one: '',
                two: '',
                three: '',
                four: ''
            };
        },
        render: function() {
            return React.DOM.div({
                className: 'row gauges'
            }, [
                React.DOM.div({
                    className: 'one'
                }, this.props.one),
                React.DOM.div({
                    className: 'two'
                }, this.props.two),
                React.DOM.div({
                    className: 'three'
                }, this.props.three),
                React.DOM.div({
                    className: 'four'
                }, this.props.four)
            ]);
        }
    });
    return DashboardRow;
});
