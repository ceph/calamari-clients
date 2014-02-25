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
                            'title': 'Accept Request Sent',
                            'template': '/views/new-install-modal.html',
                            'content': '<p><i class="fa fa-spinner fa-spin"></i> Waiting for First Cluster to Join</p>',
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

                        }, function( /*resp*/ ) {
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