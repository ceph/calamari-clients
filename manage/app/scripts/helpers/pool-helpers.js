/*global define */
(function() {
    'use strict';
    define(['lodash'], function(_) {

        // Helper functions for the pool forms views to calculate and recommend
        // things like how many pg groups do I need for the given number of OSDs
        // and the ruleset being applied to this pool.

        // **roundUpToNextPowerOfTwo**
        // Rounds the given value up to the next power of 2.
        // Warning - JavaScript bitwise operations are capped at
        // 32bits.
        //
        // @param **num** - number value to start from.
        //
        // @see [mdn about bitwise ops](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Bitwise_Operators)
        function roundUpToNextPowerOfTwo(num) {
            // @see [reference implementation](http://bits.stephan-brumme.com/roundUpToNextPowerOfTwo.html)
            /* jshint bitwise: false */
            num--;
            num |= num >> 1;
            num |= num >> 2;
            num |= num >> 4;
            num |= num >> 8;
            num |= num >> 16;
            num++;
            return num;
        }

        // **calculatePGNum**
        // Calculate the recommended number of PGs for a given pool
        // based on it's osd count and replication factor.
        //
        // @param **osdcount** - number of osds in this cluster.
        //
        // @param **size** - number of replicas for this crush rule set.
        //
        // @param **pgmax** - the max number of pgs for this cluster.
        //
        // @see [placement groups](http://ceph.com/docs/master/rados/operations/placement-groups/)

        function calculatePGNum(osdcount, size, pgmax) {
            var pgnum = roundUpToNextPowerOfTwo(osdcount * 100 / size);
            if (pgnum > pgmax) {
                pgnum = pgmax;
            }
            return pgnum;
        }

        // **validateMaxMin**
        // Validate a value is within the min, max.

        function validateMaxMin(fieldName, newValue, min, max) {
            /* jshint validthis:true, camelcase: false*/
            if (newValue < min) {
                this[fieldName] = 1;
                return false;
            }
            if (newValue > max) {
                this[fieldName] = max;
                return false;
            }
            return true;
        }

        // **getActiveRule**
        // Match the requested replication size against the
        // crush ruleset and return the most appropriate
        // match.
        //
        // @param **ruleset** - resultset to use
        //
        // @param **maxPoolPgNum** - max numbers of pg for a pool
        //
        // @param **size** - requested replica size

        function getActiveRule(ruleset, maxPoolPgNum, size) {
            /* jshint camelcase: false */
            return _.reduce(ruleset.rules, function(result, rule) {
                var active_rule = result.active_rule;
                var osd_count = result.osd_count;
                // We match rules based on the size min/max.
                if (size >= rule.min_size && size <= rule.max_size) {
                    active_rule = rule.id;
                    osd_count = rule.osd_count;
                }
                return {
                    min_size: Math.min(rule.min_size, result.min_size),
                    max_size: Math.max(rule.max_size, result.max_size),
                    active_rule: active_rule,
                    osd_count: osd_count
                };
            }, {
                min_size: maxPoolPgNum,
                max_size: 1,
                active_rule: 0,
                osd_count: 0
            });
        }

        // **makeReset**
        // Returns a reset function for the pool-new/pool-modify forms.
        //
        // @param **$scope** - current angular $scope we are operating on.
        //
        // @param **options**
        //   pgnumReset: used to control whether to use recommend pg value or reset back to default.
        //   Use case is *modify* pool wants the old value back and *create* pool wants the recommend value.
        function makeReset($scope, options) {
            /* jshint camelcase: false */
            options = options || {
                pgnumReset: true
            };
            // Creates a reset function with the correct behavior.
            return function() {
                var defaults = $scope.defaults;
                $scope.pool.name = defaults.name;
                $scope.pool.size = defaults.size;
                $scope.pool.crush_ruleset = defaults.crush_ruleset;
                if (options.pgnumReset) {
                    var ruleset = $scope.crushrulesets[defaults.crush_ruleset];
                    var limits = getActiveRule(ruleset, defaults.mon_max_pool_pg_num, $scope.pool.size);
                    var pgnum = calculatePGNum(limits.osd_count, $scope.pool.size, defaults.mon_max_pool_pg_num);
                    if ($scope.pool.pg_num !== pgnum) {
                        // Only reset pg num if it's different from calculated default
                        // This catches where size hasn't changed but the pg_num has
                        $scope.pool.pg_num = pgnum;
                    }
                } else {
                    $scope.pool.pg_num = defaults.pg_num;
                }
            };
        }

        // **addWatches**
        //
        // Custom Business Logic for crush rule sets pool replicas and placement groups.
        // $watch installs an observer, that looks for changes in the scope variables
        // you specify. This allows you to return custom validation routines or
        // change the behavior of the UI in reaction to those changes.
        //
        // @param **$scope** - scope we are instrumenting.
        //
        function addWatches($scope) {
            // Ensure pool names are unique for the pool names we know about.
            // It's still possible for a duplicate named pool to be created
            // by another user which will cause this pool creation to fail,
            // just highly unlikely.
            $scope.$watch('pool.name', function(newValue) {
                if (_.find($scope.poolNames, function(name) {
                    return name === newValue;
                })) {
                    $scope.poolForm.name.$setValidity('duplicate', false);
                    return;
                }
                $scope.poolForm.name.$setValidity('duplicate', true);

                //Clear the server error if user changes the name
                $scope.poolForm.name.$setValidity('server', true);
            });
            /* jshint camelcase: false */
            // Validate the pool size is a number and re-calculate the pgnum
            // if the replication size changes.
            $scope.$watch('pool.size', function(newValue /*, oldValue*/ ) {
                if (!_.isNumber(newValue)) {
                    $scope.poolForm.size.$error.number = true;
                    return;
                }

                if (!$scope.isEdit) {
                    var ruleset = $scope.crushrulesets[$scope.pool.crush_ruleset];
                    var limits = getActiveRule(ruleset, $scope.defaults.mon_max_pool_pg_num, newValue);
                    $scope.limits = limits;
                    if (validateMaxMin.call($scope.pool, 'size', newValue, limits.min_size, limits.max_size)) {
                        $scope.pool.pg_num = calculatePGNum(limits.osd_count, newValue, $scope.defaults.mon_max_pool_pg_num);
                        $scope.crushrulesets[$scope.pool.crush_ruleset].active_sub_rule = limits.active_rule;
                    }
                }

                //Clear the server error if user changes the name
                $scope.poolForm.size.$setValidity('server', true);
            });
            // Validate the pg_num is a number and that it is within the
            // min/max for this cluster.
            $scope.$watch('pool.pg_num', function(newValue /*, oldValue*/ ) {
                if (!_.isNumber(newValue)) {
                    $scope.poolForm.pg_num.$error.number = true;
                    return;
                }
                $scope.poolForm.pg_num.$error.number = false;
                $scope.poolForm.pg_num.$pristine = true;
                validateMaxMin.call($scope.pool, 'pg_num', newValue, 1, $scope.defaults.mon_max_pool_pg_num);

                //Clear the server error if user changes the name
                $scope.poolForm.pg_num.$setValidity('server', true);
            });
            // If the crushset changes reset the pool size and the active crush rule sub rule
            // value to default.
            $scope.$watch('pool.crush_ruleset', function(newValue, oldValue) {
                $scope.pool.size = $scope.defaults.size;
                $scope.crushrulesets[newValue].active_sub_rule = 0;
                $scope.crushrulesets[oldValue].active_sub_rule = 0;

                //Clear the server error if user changes the name
                $scope.poolForm.crush_ruleset.$setValidity('server', true);
            });
        }

        // **normalizeCrushRulesets**
        // Take the crush ruleset metadata and normalize it for the UI
        // so it can be used to calculate the pg_num for a given
        // replica size.
        function normalizeCrushRulesets(crushrulesets) {
            /* jshint camelcase: false */
            return _.map(crushrulesets, function(set) {
                var rules = _.map(set.rules, function(rule, index) {
                    return {
                        id: index,
                        name: rule.name,
                        min_size: rule.min_size,
                        max_size: rule.max_size,
                        osd_count: rule.osd_count
                    };
                });
                return {
                    id: set.id,
                    rules: rules,
                    active_sub_rule: 0
                };
            });
        }

        // ** errorOnPoolSave **
        // While creating/updating a pool, validation errors can be thrown from the server
        // This will map the error to repective fields in the form
        // If there is no field errors then an error popup will be shown
        function errorOnPoolSave($scope, $model) {
            return function(resp) {
                var errorInField = false;
                var fields  = ['name', 'size', 'pg_num', 'crush_ruleset'];
                _.each(fields, function(field) {
                    if (_.has(resp.data, field)) {
                        $scope.poolForm[field].$setValidity("server", false);
                        $scope.poolForm[field].$error.server = resp.data[field].join(', ');
                        errorInField = true;
                    }
                });

                // If the reponse doesn't have field specified error
                // then show the response in a popup
                if (!errorInField) {
                    ModalHelpers.makeOnError($modal({
                        show: false
                    }))();
                }
            }
        }

        // **poolDefaults**
        // Default pool values.
        function poolDefaults() {
            return {
                /* jshint camelcase:false */
                name: '',
                size: 2,
                crush_ruleset: 0,
                pg_num: 100
            };
        }
        // Exported functions.
        return {
            calculatePGNum: calculatePGNum,
            validateMaxMin: validateMaxMin,
            roundUpToNextPowerOfTwo: roundUpToNextPowerOfTwo,
            getActiveRule: getActiveRule,
            makeReset: makeReset,
            addWatches: addWatches,
            defaults: poolDefaults,
            normalizeCrushRulesets: normalizeCrushRulesets,
            errorOnPoolSave: errorOnPoolSave
        };
    });
})();
