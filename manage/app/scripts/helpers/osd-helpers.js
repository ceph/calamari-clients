/*global define */
(function() {
    'use strict';
    define(['lodash'], function(_) {
        function formatOSDData(osd, pools) {
            var pairs = _.reduce(['id', 'uuid', 'up', 'in', 'reweight', 'server', 'pools', 'public_addr', 'cluster_addr'], function(result, key) {
                var value = osd[key];
                if (_.isObject(value) || _.isNumber(value) || _.isBoolean(value) || (_.isString(value) && value !== '')) {
                    if (key === 'up' || key === 'in') {
                        result.state = result.state || [];
                        var markup = '<div class="label label-danger">DOWN</div>';
                        if (key === 'up') {
                            if (value) {
                                markup = '<div class="label label-success">UP</div>';
                            }
                        } else {
                            if (value) {
                                markup = '<div class="label label-success">IN</div>';
                            } else {
                                markup = '<div class="label label-danger">OUT</div>';
                            }
                        }
                        result.state.push(markup);
                    } else {
                        result[key] = value;
                    }
                }
                return result;
            }, {});
            if (pairs.state) {
                pairs.state = pairs.state.join(' &nbsp; ');
            }
            pairs.reweight = Math.round(Math.min(pairs.reweight * 100, 100)) + '%';
            pairs.id = '' + pairs.id;
            pairs.pools = _.reduce(pairs.pools, function(result, poolid) {
                var pool = _.find(pools, function(pool) {
                    return pool.id === poolid;
                });
                result.push(pool === undefined ? poolid : pool.name);
                return result;
            }, []).join(', ');
            return pairs;
        }
        return {
            formatOSDData: formatOSDData
        };
    });
})();
