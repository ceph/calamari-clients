/* global define */
(function() {
    'use strict';
    define(['lodash', 'helpers/modal-helpers'], function(_) {

        var FirstTimeController = function($q, $log, $timeout, $location, $scope, KeyService, ClusterService, $modal) {
            var promises = [KeyService.getList()];
            $scope.addDisabled = true;
            $scope.debug = false;
            $q.all(promises).then(function(results) {

                $scope.up = true;
                if (ClusterService.clusterId !== null) {
                    $location.path('/');
                    return;
                }

                (function(keys) {
                    $scope.keys = keys;
                    $scope.acceptAll = function() {
                        var ids = _.map(keys, function(key) {
                            if (key.status === 'pre') {
                                return key.id;
                            }
                            return;
                        });
                        $log.debug(ids);
                        $scope.addDisabled = true;
                        var modal = $modal({
                            'title': '<i class="text-success fa fa-check-circle fa-lg"></i> Accept Request Sent',
                            'template': 'views/new-install-modal.html',
                            'content': '<p><i class="fa fa-spinner fa-spin"></i> Waiting for First Cluster to Join</p>',
                            'backdrop': 'static',
                            'html': true
                        });
                        modal.$scope.closeDisabled = true;
                        modal.$scope._hide = function() {
                            modal.$scope.$hide();
                            ClusterService.initialize().then(function() {
                                $location.path('/');
                            });
                        };

                        function checkClusterUp() {
                            ClusterService.getList().then(function(clusters) {
                                if (clusters.length) {
                                    modal.$scope.closeDisabled = false;
                                    modal.$scope.content = 'Cluster Initialized.';
                                    return;
                                }
                                $timeout(checkClusterUp, 1000);
                            });
                        }
                        KeyService.accept(ids).then(function(resp) {
                            $log.debug(resp);
                            if (resp.status === 204) {
                                $timeout(checkClusterUp, 1000);
                            }
                            $scope.addDisabled = false;

                        }, function(resp) {
                            modal.$scope.content = '<i class="text-danger fa fa-exclamation-circle fa-lg"></i> Error ' + resp.status + '. Please try reloading the page and logging in again.</p><h4>Raw Response</h4><p><pre>' + resp.data + '</pre></p>';
                            $scope.addDisabled = false;
                        });
                        return;
                    };
                    $scope.addDisabled = false;
                })(results[0]);


            });
        };
        return ['$q', '$log', '$timeout', '$location', '$scope', 'KeyService', 'ClusterService', '$modal', FirstTimeController];
    });
})();
