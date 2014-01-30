/* global define, alert */
/* jshint camelcase: false, curly: false */
/**
 * l20n
 * The l20n module.
 * @author @fernandogmar
 */
define(['require', 'module'], function(require, module) {
    'use strict';
    var config = module.config ? module.config() : {};

    var defaults = {
        name: 'l20nCtx',
        extension: 'l20n',
        prefix: '{{',
        suffix: '}}',
        locale: 'en'
    };

    var l20nPlugin = {};

    l20nPlugin.version = '0.0.3';

    l20nPlugin.load = function(resourceName, parentRequire, onload, masterConfig) {
        config = helper.extend(config, defaults, helper.getConfig(masterConfig));
        if (masterConfig.isBuild) {
            return onload();
        }
        require(['l20n'], function(L20n) {
            var full_name = helper.getFullName(resourceName, config.extension);
            var resource_id = parentRequire.toUrl(full_name);

            var ctx = L20n.getContext(resource_id);
            ctx.linkResource(helper.parseName(resource_id, config));
            ctx.requestLocales();

            var addEventListeners = function() {
                ctx.addEventListener('ready', onReady);
                ctx.addEventListener('error', onError);
            };

            var removeEventListeners = function() {
                ctx.removeEventListener('ready', onReady);
                ctx.removeEventListener('error', onError);
            };

            var onReady = function() {
                removeEventListeners();
                onload(ctx);
            };

            var onError = function(error) {
                removeEventListeners();
                if (config.debug) { //XXX it is very quiet :(
                    alert(error);
                }
                onload.error(error);
            };
            addEventListeners();
        });

    };

    var helper = {
        extend: function() {
            for (var i = 1; i < arguments.length; i++)
                for (var key in arguments[i])
                    if (arguments[i].hasOwnProperty(key))
                        arguments[0][key] = arguments[i][key];
            return arguments[0];
        },
        getConfig: function(obj) {
            var config = {};
            var l20nCtx = defaults.name;

            if (obj.config) {
                config = obj.config[l20nCtx] || config;
            } else {
                config = obj[l20nCtx] || config;
            }

            return config;
        },
        getFullName: function(file_name, default_extension) {
            //it doesn't have an extesion
            if (file_name && !file_name.match(/\.[0-9a-z]+$/i)) {
                return [file_name, default_extension].join('.');
            } else {
                return file_name;
            }
        },
        parseName: function(file_name, config) {
            var to_replace = config.prefix + 'locale' + config.suffix;
            return file_name.replace(to_replace, config.locale);
        }
    };

    return l20nPlugin;
});
