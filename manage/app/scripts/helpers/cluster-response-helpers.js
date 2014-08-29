/* global define */
(function() {
    'use strict';
    var __split = String.prototype.split;
    define(['lodash'], function(_) {
        function makeFunctions($q, $timeout, osdConfigKeys) {
            function bucketMinions(minions) {
                return _.reduce(_.sortBy(minions, function(m) {
                    return m.id;
                }), function(results, minion, index) {
                    var shortName = _.first(__split.call(minion.id, '.'));
                    minion.shortName = shortName;
                    results[index % 4].push({
                        id: minion.id,
                        status: minion.status,
                        shortName: shortName,
                        label: '<i class="fa fa-fw fa-lg fa-plus-circle"></i>'
                    });
                    return results;
                }, [
                    [],
                    [],
                    [],
                    []
                ]);
            }

            function configComparator(a, b) {
                if (a.key === b.key) {
                    return 0;
                }
                return (a.key < b.key) ? -1 : 1;
            }

            function processConfigs(configs) {
                var d = $q.defer();
                $timeout(function() {
                    d.resolve(_.map(configs.sort(configComparator), function(config) {
                        return {
                            key: config.key,
                            value: config.value
                        };
                    }));
                }, 500);
                return d.promise;
            }

            function osdConfigsInit(config) {
                var d = $q.defer();
                d.resolve(_.reduce(osdConfigKeys, function(result, key) {
                    result[key] = config[key];
                    return result;
                }, {}));
                return d.promise;
            }

            function makeBreadcrumbs(name) {
                return {
                    'servers': [{
                            text: '管理 (' + name + ')'
                        }, {
                            text: '集群',
                            active: true
                        }, {
                            text: '主机',
                            active: true
                        }
                    ],
                    'osdmap': [{
                            text: '管理 (' + name + ')'
                        }, {
                            text: '集群',
                            active: true
                        }, {
                            text: '集群设置',
                            active: true
                        }
                    ],
                    'viewer': [{
                            text: '管理 (' + name + ')'
                        }, {
                            text: '集群',
                            active: true
                        }, {
                            text: '配置浏览',
                            active: true
                        }
                    ]
                };
            }

            return {
                bucketMinions: bucketMinions,
                processConfigs: processConfigs,
                osdConfigsInit: osdConfigsInit,
                makeBreadcrumbs: makeBreadcrumbs
            };
        }
        return {
            makeFunctions: makeFunctions
        };
    });
})();
