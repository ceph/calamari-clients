/*global define*/
define(['underscore', 'backbone', 'loglevel', 'react', 'helpers/config-loader', 'views/dashboard-row', 'views/type-one-view'], function(_, Backbone, log, React, loader, dashboardRow, typeOneView) {
    'use strict';
    var PluginLoader = function() {
        this.initialize.apply(this, arguments);
    };
    _.extend(PluginLoader.prototype, Backbone.Events, {
        initialize: function(options) {
            if (!options) {
                options = {};
            }
            if (options.vent) {
                this.vent = options.vent;
            }
            if (options.url) {
                this.url = options.url;
            }
            if (options.el) {
                this.el = options.el;
            }
        },
        slots: ['one', 'two', 'three', 'four'],
        render: function() {
            var self = this;
            if (!this.url) {
                return;
            }
            var configPromise = loader(this.url).then(function(result) {
                log.info('loaded plugin file');
                return result;
            }, function(jqXHR, textStatus, errorThrown) {
                if (_.isString(jqXHR)) {
                    // probably JSON parsing error
                    log.error(jqXHR);
                } else if (_.isObject(jqXHR) && jqXHR.readyState) {
                    // looks like an xhr error
                    log.error(errorThrown + ' loading ' + this.url);
                } else {
                    // assume file not found
                    log.info('No plugins detected.');
                }
                return jqXHR;
            });
            configPromise.done(function(result) {
                log.debug(result);
                log.debug('detected ' + result.length + ' plugins');
                var plugins = {};
                _.each(result, function(plugin, index) {
                    try {
                        if (_.isString(plugin.headlineTemplate)) {
                            plugin.headlineTemplate = _.template(plugin.headlineTemplate);
                        }
                        self[self.slots[index]] = typeOneView(
                            _.extend(plugin, {
                            vent: self.vent
                        }));
                        plugins[self.slots[index]] = self[self.slots[index]];
                    } catch (e) {
                        log.error('Unable to start plugin ' + plugin.title, e);
                    }
                });

                self.row = dashboardRow(plugins);
                React.renderComponent(self.row, self.el);
            });
        }
    });
    return PluginLoader;
});
