/*global define*/
define(['underscore', 'backbone', 'react', 'helpers/config-loader', 'views/dashboard-row', 'views/type-one-view'], function(_, Backbone, React, loader, dashboardRow, typeOneView) {
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
        names: ['one', 'two', 'three', 'four'],
        render: function() {
            var self = this;
            if (!this.url) {
                return;
            }
            var configPromise = loader(this.url).then(function(result) {
                console.log('loaded plugin file');
                return result;
            }, function(jqXHR, textStatus, errorThrown) {
                if (jqXHR.readyState === undefined) {
                    // assume if it's not an real jqXHR it's missing readyState
                    // and it just returns an empty object
                    console.log('no plugins detected');
                } else {
                    console.log(errorThrown + ' loading ' + this.url);
                }
                return jqXHR;
            });
            configPromise.done(function(result) {
                console.log(result);
                console.log('detected ' + result.length + ' plugins');
                var plugins = {};
                _.each(result, function(plugin, index) {
                    self[self.names[index]] = typeOneView({
                        vent: self.vent,
                        title: plugin.title,
                        classId: plugin.classId,
                        url: plugin.url
                    });
                    plugins[self.names[index]] = self[self.names[index]];
                });

                self.row = dashboardRow(plugins);
                React.renderComponent(self.row, self.el);
            });
        }
    });
    return PluginLoader;
});
