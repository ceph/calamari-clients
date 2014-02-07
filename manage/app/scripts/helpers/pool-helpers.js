/*global define */
(function() {
    'use strict';
    function roundUpToNextPowerOfTwo(num) {
        // reference http://bits.stephan-brumme.com/roundUpToNextPowerOfTwo.html
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

    function calculatePGNum(osdcount, size, pgmax) {
        var pgnum = roundUpToNextPowerOfTwo(osdcount * 100 / size);
        if (pgnum > pgmax) {
            pgnum = pgmax;
        }
        return pgnum;
    }

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
    define([], function() {
        return {
            calculatePGNum: calculatePGNum,
            validateMaxMin: validateMaxMin,
            roundUpToNextPowerOfTwo: roundUpToNextPowerOfTwo
        };
    });
})();
