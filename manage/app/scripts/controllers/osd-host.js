/* global define */
(function() {
    'use strict';
    define(['lodash', 'helpers/modal-helpers', 'helpers/osd-helpers', 'helpers/error-helpers'], function(_, modalHelpers, osdHelpers, errorHelpers) {

        var disableRepairCommand = true;
        // Store re-usable markup snippets in an object.
        var text = {
            'down': '<i class="fa fa-arrow-circle-down fa-fw fa-lg"></i>&nbsp;DOWN',
            'in': '<i class="fa fa-sign-in fa-fw fa-lg"></i>&nbsp;IN',
            'out': '<i class="fa fa-sign-out fa-fw fa-lg"></i>&nbsp;OUT',
            'scrub': '<i class="fa fa-medkit fa-fw fa-lg"></i>&nbsp;SCRUB',
            'deep_scrub': '<i class="fa fa-stethoscope fa-fw fa-lg"></i>&nbsp;DEEP SCRUB',
            'repair': '<i class="fa fa-ambulance fa-fw fa-lg"></i>&nbsp;REPAIR',
            'repairText': '<i class="fa fa-medkit fa-fw fa-lg"></i>',
            'configText': '<i class="fa fa-gear fa-fw fa-lg"></i>',
            'spinner': '<i class="fa fa-spinner fa-spin fa-fw fa-lg"></i>',
            'success': '<i class="fa fa-check-circle-o fa-fw fa-lg"></i>'
        };

        var maxReweight = 100;

        // **OSDHostController** is a single host view of the OSDs running on that system in
        // a tabular view. We also allow issuing of commands to single devices via drop downs
        // within a single row. Most of these commands are not someone one would use in a bulk
        // manner, so multi-select is not much an issue at this time.
        //
        // Most of the complexity in this controller is in dealing with polling Calamari API
        // and merging the results with the current view.
        //
        var OSDHostController = function($q, $log, $scope, $routeParams, ClusterService, ServerService, $location, OSDService, $modal, $timeout, RequestTrackingService, PoolService, config, $rootScope) {

            // Inject dependencies into Error Helpers.
            var errHelpers = errorHelpers.makeFunctions($q, $log);

            // **formatOSDForUI**
            // UI Helper to reformat the raw osd reweight float into a 
            // percentage.

            function formatOSDForUI(osd) {
                osd.reweight = Math.min(osd.reweight * maxReweight, maxReweight);
                osd.reweight = Math.max(osd.reweight, 0);
                osd.reweight = Math.round(osd.reweight);
                osd._reweight = angular.copy(osd.reweight);
            }

            // Breadcrumb initialization.
            $scope.fqdn = $routeParams.fqdn;
            $scope.clusterName = ClusterService.clusterModel.name;
            $scope.breadcrumbs = [{
                    text: 'Manage (' + $scope.clusterName + ')',
                }, {
                    text: 'OSD',
                    href: '#/osd'
                }, {
                    text: 'Host (' + $scope.fqdn + ')',
                    active: true
                }
            ];

            // **displayFn** Click handler for the ui info icon.
            // Pop a modal with detail about the OSD being viewed.
            $scope.displayFn = function(id) {
                OSDService.get(id).then(function(_osd) {
                    var modal = $modal({
                        title: 'OSD ' + _osd.id + ' Info',
                        template: 'views/osd-info-modal.html'
                    });
                    PoolService.getList().then(function(pools) {
                        modal.$scope.pairs = osdHelpers.formatOSDData(_osd, pools);
                    });
                });
            };

            // **changedFn**
            // Handle editing the re-weight value.
            // When someone edits the re-weight input field, we do a little custom validation
            // and assuming it all passes we create a timer to debounced save handler.
            //
            // The save handler runs a custom UI sequence
            //
            //  1. disable editing on field during save
            //  2. add a spinner to UI on save
            //  3. display a check mark if save request was successful
            //  4. add the returned request id to request tracker
            // 
            $scope.changedFn = function(osd) {
                $log.debug('changed ' + osd.id);
                if (osd.timeout) {
                    // Cancel any existing save handler if it exists.
                    $timeout.cancel(osd.timeout);
                    osd.timeout = undefined;
                }
                if ($rootScope.keyTimer) {
                    // Reset polling timeout when editing reweight otherwise an update
                    // can overwrite your changes before they are saved
                    $timeout.cancel($rootScope.keyTimer);
                    $rootScope.keyTimer = $timeout(refreshOSDModels, config.getPollTimeoutMs());
                }
                $log.debug('reweight: ' + osd.reweight);
                // validate inputs
                // **_reweight** is a shadow copy of reweight so we have
                // the original value to compare against after an edit.
                if (osd.reweight === '' || osd.reweight === void 0) {
                    osd.hasError = true;
                    return;
                }
                if (_.isNumber(osd.reweight) && (osd.reweight > maxReweight || osd.reweight < 0)) {
                    osd.reweight = angular.copy(osd._reweight);
                    return;
                }
                if (_.isNaN(osd.reweight)) {
                    osd.hasError = true;
                    return;
                }
                osd.hasError = false;
                if (osd.reweight === osd._reweight) {
                    // Nothing changed.
                    return;
                }
                // Debounced save function. Contains the save UI sequence.
                osd.timeout = $timeout(function() {
                    // start spinner.
                    osd.editing = true;
                    var start = Date.now();
                    // Init Error modal
                    var modal = $modal({
                        html: true,
                        title: '',
                        backdrop: 'static',
                        template: 'views/osd-cmd-modal.html',
                        show: false
                    });
                    // Save value to Calamari API.
                    errHelpers.intercept304Error(OSDService.patch(osd.id, {
                        reweight: osd.reweight / maxReweight
                    })).then(function(resp) {
                        /* jshint camelcase: false */
                        // Re-weight save was successful sent.
                        var promise = RequestTrackingService.add(resp.data.request_id);
                        var elapsed = Date.now() - start;
                        var remaining = elapsed < config.getAnimationTimeoutMs() ? config.getAnimationTimeoutMs() - elapsed : 0;
                        $timeout(function() {
                            // Remove spinner and display check mark.
                            osd.editing = false;
                            osd.saved = true;
                            $timeout(function() {
                                // Remove check mark.
                                osd.saved = false;
                            }, config.getAnimationTimeoutMs());
                            promise.then(function() {
                                // Request has been completed. Save reweight value to shadow
                                osd._reweight = angular.copy(osd.reweight);
                            });
                        }, remaining);
                    }, modalHelpers.makeOnError(modal));

                }, config.getEditDebounceMs());
            };

            // Helper to generate the OSD config down/in/out dropdown menu for angular strap.
            function generateConfigDropdown(result, handler) {
                result.configDropdown = [];
                if (result.up) {
                    // One can only set an OSD down. The Cluster automatically promotes the OSD
                    // to Up unless the noup flag is set on the cluster
                    result.configDropdown.push({
                        'text': text.down,
                        'id': result.id,
                        'cmd': 'down',
                        'index': result.index,
                        'handler': handler
                    });
                }
                if (result['in']) {
                    result.configDropdown.push({
                        'text': text.out,
                        'id': result.id,
                        'cmd': 'out',
                        'index': result.index,
                        'handler': handler
                    });
                } else {
                    result.configDropdown.push({
                        'text': text['in'],
                        'id': result.id,
                        'cmd': 'in',
                        'index': result.index,
                        'handler': handler
                    });
                }
            }

            // Enhance OSD data from server with UI specific tracking fields.
            function addUIMetadataToOSDData(osd, index) {
                /* jshint camelcase:false */
                _.extend(osd, {
                    index: index,
                    repairText: text.repairText,
                    configText: text.configText,
                    hasError: false,
                    editing: false,
                    saved: false,
                    editDisabled: false
                });
                // valid_commands will be empty for OSDs which are down.
                if (osd.valid_commands.length) {
                    if (disableRepairCommand) {
                        // If the global disable repair flag is set, filter out OSDs which offer
                        // **repair**. This command is dangerous to use without other safeguards
                        // so we have chosen to disable it in the UI at this time to prevent
                        // data loss.
                        osd.valid_commands = _.filter(osd.valid_commands, function(command) {
                            return command !== 'repair';
                        });
                    }
                    // Populate the repair dropdown. e.g. scrub and deep scrub
                    osd.repairDropdown = _.reduce(osd.valid_commands, function(newdropdown, cmd) {
                        newdropdown.push({
                            'text': text[cmd],
                            'id': osd.id,
                            'cmd': cmd,
                            'index': index,
                            'handler': repairClickHandler
                        });
                        return newdropdown;
                    }, []);
                } else {
                    // Repair dropdown is disabled because valid commands is empty for down OSDs
                    osd.repairDisabled = true;
                }
                generateConfigDropdown(osd, configClickHandler);
                formatOSDForUI(osd);
            }

            // **requestRepairPermission**
            // A modal explaining how dangerous repairing an OSD can be. Currently unused because
            // the repair command has been disabled in the UI. This decorates the repair option
            // and displays a more informative modal with a cancel button.
            function requestRepairPermission(repairFn) {
                return function($event, id, cmd, index) {
                    $event.preventDefault();
                    $event.stopPropagation();
                    if (cmd === 'repair') {
                        var modal = $modal({
                            html: true,
                            title: '<i class="fa fa-fw fa-lg text-danger fa-exclamation-triangle"></i> Repair OSD ' + id + '?',
                            backdrop: 'static',
                            template: 'views/osd-repair-warn-modal.html',
                            content: 'Please ensure you have checked the cluster logs for scrub output marked <strong class="text-info">Error</strong> to determine if this is the correct OSD to run the repair on. Failure to do so may result in the <span class="text-danger">permanent loss of data</span>.',
                            show: true
                        });
                        modal.$scope.acceptFn = function() {
                            modal.$scope.$hide();
                            repairFn($event, id, cmd, index);
                        };
                    } else {
                        repairFn($event, id, cmd, index);
                    }
                };
            }


            // **makeCommandHandler**
            // Creates callback handlers for the dropdown menus.
            // Returns a function which processes the click events for
            // each type of dropdown option.
            function makeCommandHandler(buttonLabel) {
                return function($event, id, cmd, index) {
                    $event.preventDefault();
                    $log.debug('CLICKED osd ' + id + ' command ' + cmd);
                    // Look up the correct OSD, based on it's UI index id.
                    // This is not the same as the OSD's ID.
                    var osd = $scope.osds[index];
                    // disable the UI entry
                    osd.disabled = true;
                    // change the button label to a spinner so we know it's
                    // doing something.
                    osd[buttonLabel] = text.spinner;
                    var start = Date.now();
                    var modal = $modal({
                        html: true,
                        title: '',
                        backdrop: 'static',
                        template: 'views/osd-cmd-modal.html',
                        show: false
                    });
                    // intercept304Error is a special handler for unmodified responses. This indicates
                    // the server is already in this state. We ignore this response and treat it as
                    // a successfully completed task as it is not a true error. We are simply out
                    // of sync with the current state of the server.
                    errHelpers.intercept304Error(OSDService[cmd].call(OSDService, id)).then(function success(resp) {
                        /* jshint camelcase: false */
                        var promise = RequestTrackingService.add(resp.data.request_id);
                        var elapsed = Date.now() - start;
                        var remaining = (elapsed < config.getAnimationTimeoutMs()) ? config.getAnimationTimeoutMs() - elapsed : 0;
                        modal.$scope.disableClose = true;
                        modal.$scope.$hide = _.wrap(modal.$scope.$hide, function($hide) {
                            $hide();
                        });
                        // Run the custom UI animation sequence.
                        $timeout(function() {
                            // Display a check mark.
                            osd[buttonLabel] = text.success;
                            $timeout(function() {
                                // Restore original label.
                                osd[buttonLabel] = text[buttonLabel];
                                // Re-enable row.
                                osd.disabled = false;
                                promise.then(function() {
                                    // Force an update of this specific OSD to refresh
                                    // the config dropdowns.
                                    OSDService.get(id).then(function(_osd) {
                                        // refresh osd state
                                        formatOSDForUI(_osd);
                                        _.extend(osd, _osd);
                                        osd.repairDisabled = !osd.up;
                                        osd.editDisabled = !osd.up || !osd['in'];
                                        generateConfigDropdown(osd, configClickHandler);
                                    });
                                });
                            }, config.getAnimationTimeoutMs());
                        }, remaining);
                    }, modalHelpers.makeOnError(modal, function cleanup() {
                        osd[buttonLabel] = text[buttonLabel];
                        osd.disabled = false;
                    }));
                    return false;
                };
            }

            var configClickHandler = makeCommandHandler('configText');
            var repairClickHandler = requestRepairPermission(makeCommandHandler('repairText'));

            // **refreshOSDModels**
            // Poll the server for OSD changes for this host.
            function refreshOSDModels() {
                $log.debug('polling host ' + $scope.fqdn);
                ServerService.get($scope.fqdn).then(function(server) {
                    var r = _.reduce(server.services, function(results, service) {
                        if (service.type === 'osd') {
                            var osd = {
                                id: service.id,
                                running: service.running
                            };
                            results.osds[osd.id] = osd;
                            results.ids.push(osd.id);
                        }
                        return results;
                    }, {
                        osds: {},
                        ids: []
                    });
                    var osds = $scope.osds;
                    OSDService.getSet(r.ids).then(function(newOsds) {
                        osds = _.filter(osds, function(osd) {
                            // Delete OSDs that have been removed from host.
                            return newOsds[osd.id] !== undefined;
                        });
                        _.each(newOsds, function(nOsd, index) {
                            if (osds[nOsd.id] === undefined) {
                                // Add new OSDs.
                                addUIMetadataToOSDData(nOsd, index);
                                osds[nOsd.id] = {};
                            }
                            nOsd.repairDisabled = !nOsd.up;
                            nOsd.editDisabled = !nOsd.up || !nOsd['in'];
                            nOsd.index = index;
                            formatOSDForUI(nOsd);
                            generateConfigDropdown(nOsd, configClickHandler);
                            _.extend(osds[nOsd.id], nOsd);
                        });
                    });
                    $rootScope.keyTimer = $timeout(refreshOSDModels, config.getPollTimeoutMs());
                });
            }

            // Get the initial set of OSDs for this host and display them on the UI.
            // This promise initially sets up the osd-host view.
            ServerService.get($scope.fqdn).then(function(server) {
                $scope.server = server;
                var r = _.reduce(server.services, function(results, service) {
                    if (service.type === 'osd') {
                        var osd = {
                            id: service.id,
                            running: service.running
                        };
                        results.osds[osd.id] = osd;
                        results.ids.push(osd.id);
                    }
                    return results;
                }, {
                    osds: {},
                    ids: []
                });
                OSDService.getSet(r.ids).then(function(osds) {
                    _.each(osds, function(osd, index) {
                        addUIMetadataToOSDData(osd, index);
                        osd.repairDisabled = !osd.up;
                        osd.editDisabled = !osd.up || !osd['in'];
                        _.extend(r.osds[osd.id], osd);
                    });
                    $scope.osds = _.sortBy(_.values(r.osds), function(osd) {
                        return osd.id;
                    });
                    $scope.up = true;
                    $rootScope.keyTimer = $timeout(refreshOSDModels, config.getPollTimeoutMs());
                });
            });

        };
        return ['$q', '$log', '$scope', '$routeParams', 'ClusterService', 'ServerService', '$location', 'OSDService', '$modal', '$timeout', 'RequestTrackingService', 'PoolService', 'ConfigurationService', '$rootScope', OSDHostController];
    });
})();
