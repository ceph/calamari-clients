/*global define */
'use strict';

define(['underscore', 'raphael'], function() {
    var vdashes = function(x1, y1, y2, step) {
            var path = [];
            for (y1 += step; y1 <= y2 - step; y1 += step * 2) {
                path.push('M');
                path.push(x1);
                path.push(',');
                path.push(y1);
                path.push('V');
                path.push(y1 + step);
            }
            return path.join('');
        };

    var hdashes = function(x1, y1, x2, step) {
            var path = [];
            for (x1 += step; x1 <= x2 - step; x1 += step * 2) {
                path.push('M');
                path.push(x1);
                path.push(',');
                path.push(y1);
                path.push('H');
                path.push(x1 + step);
            }
            return path.join('');
        };
    //
    // Construct a grid path
    //
    // @param ox - origin x px (topleft corner)
    // @param oy - origin y px (topleft corner)
    // @param w - width px
    // @param h - height px
    // @param step - grid width px
    var calcGrid = function(ox, oy, ow, oh, step) {
            var fix = 0.5,
                x = ox + fix,
                y = oy + fix,
                w = ow + fix,
                h = oh + fix,
                end, path = [],
                xp = ox + w,
                yp = oy + h;

            path.push(vdashes(x, y, yp, step));
            x += step;
            for (end = xp - step; x <= end; x += step) {
                path.push('M');
                path.push(x);
                path.push(',');
                path.push(y);
                path.push('V');
                path.push(yp);
            }

            path.push(vdashes(x, y, yp, step));
            path.push(hdashes(ox, y, xp, step));
            y += step;
            for (end = yp - step, x = ox; y <= end; y += step) {
                path.push('M');
                path.push(x);
                path.push(',');
                path.push(y);
                path.push('H');
                path.push(xp);
            }
            path.push(hdashes(ox, y, xp, step));
            return path.join('');
        };
    var calculatePosition = function(index, ox, oy, w, h, step) {
            var cols = (w / step) - 1;
            //console.log(cols + ' / ' + rows);
            var startX = ox + step;
            var startY = oy + step;
            //console.log('sx: ' + startX + ', ' + 'sy: ' + startY);
            var offsetX = Math.floor((index % cols)) * step;
            var offsetY = Math.floor((index / cols)) * step;
            //console.log('ox: ' + offsetX + ', ' + 'oy: ' + offsetY);
            var nX = startX + offsetX;
            var nY = startY + offsetY;
            //console.log('nx: ' + nX + ', ' + 'ny: ' + nY);
            return {
                nx: nX,
                ny: nY
            };

        };
    return {
        calcGrid: calcGrid,
        calcPosition: calculatePosition,
    };
});
