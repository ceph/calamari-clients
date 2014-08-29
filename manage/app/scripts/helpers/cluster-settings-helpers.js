/* global define */
(function() {
    'use strict';

    define(['lodash'], function(_) {

        function makeFunctions($log, $scope, $timeout, $q, breadcrumbs, OSDConfigService, $modal, osdConfigKeys, RequestTrackingService) {
            function getDirtyOSDConfigKeys($scope) {
                return _.reduce(osdConfigKeys, function(results, key) {
                    if ($scope.osdmapForm[key].$dirty) {
                        results[key] = $scope.osdconfigs[key];
                    }
                    return results;
                }, {});
            }

            var obj = {};
            obj.initialize = function() {
                var d = $q.defer();
                $timeout(function() {
                    $scope.$watch('button.radio', function() {
                        // reset help message when switching sub-view
                        $scope.helpDiv = undefined;
                        $scope.breadcrumbs = breadcrumbs[$scope.button.radio];
                    });
                    $scope.updateLabel = 'UPDATE';
                    $scope.updatePrimary = true;
                    $scope.updateSuccess = false;
                    $scope.button = {
                        radio: 'servers'
                    };
                    d.resolve(obj);
                }, 0);
                return d.promise;
            };

            obj.helpInfo = function($event) {
                var $el = angular.element($event.target);
                var id = $el.attr('data-target');
                if (id !== undefined) {
                    $log.debug('helpInfo ' + $el.attr('data-target'));
                    $scope.helpDiv = id;
                }
            };

            obj.reset = function() {
                $scope.osdconfigs = angular.copy($scope.osdconfigsdefaults);
                $scope.osdmapForm.$setPristine();
                $scope.helpDiv = undefined;
            };

            obj.updateSettings = function() {
                $scope.updateLabel = '<i class="fa fa-spinner fa-spin"></i>';
                var patchList = getDirtyOSDConfigKeys($scope);
                $log.debug(patchList);
                var startTime = Date.now();
                OSDConfigService.patch(patchList).then(function osdConfigPatchHandler(resp) {
                    /* jshint camelcase: false */
                    RequestTrackingService.add(resp.data.request_id);
                    var totalTime = Date.now() - startTime;
                    $log.debug('took ' + totalTime + 'ms');
                    var waitTimeout = totalTime > 1000 ? 0 : 1000 - totalTime;
                    $timeout(function() {
                        $scope.updatePrimary = false;
                        $scope.updateSuccess = true;
                        $scope.updateLabel = '<i class="fa fa-check-circle"></i>';
                        $timeout(function() {
                            $scope.updateLabel = 'UPDATE';
                            $scope.updatePrimary = true;
                            $scope.updateSuccess = false;
                            $scope.osdmapForm.$setPristine();
                            $scope.osdconfigsdefaults = angular.copy($scope.osdconfigs);
                        }, 1000);
                    }, waitTimeout);
                }, function osdConfigPatchErrorHandler(resp) {
                    var modal = $modal({
                        template: 'views/custom-modal.html',
                        html: true
                    });
                    modal.$scope.$hide = _.wrap(modal.$scope.$hide, function($hide) {
                        $hide();
                    });
                    if (resp.status === 403) {
                        modal.$scope.title = '<i class="text-danger fa fa-exclamation-circle fa-lg"></i> Unauthorized Access';
                        modal.$scope.content = 'Error ' + resp.status + '. Please try reloading the page and logging in again.</p>';
                    } else {
                        modal.$scope.title = '<i class="text-danger fa fa-exclamation-circle fa-lg"></i> Unexpected Error';
                        modal.$scope.content = '<i class="text-danger fa fa-exclamation-circle fa-lg"></i> Error ' + resp.status + '. Please try reloading the page and logging in again.</p><h4>Raw Response</h4><p><pre>' + resp.data + '</pre></p>';
                    }
                });
            };

            obj.makeBreadcrumbs = function(name) {
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
            };
            return obj;
        }
        return {
            makeFunctions: makeFunctions
        };
    });
})();
