    humanize.relativeTime = function(timestamp) {
        timestamp = (timestamp === undefined) ? humanize.time() : timestamp;

        var currTime = humanize.time();
        var timeDiff = currTime - timestamp;

        // within 2 seconds
        if (timeDiff < 2 && timeDiff > -2) {
            return (timeDiff >= 0 ? humanize.catalog['just '] : '') + humanize.catalog['now'];
        }

        // within a minute
        if (timeDiff < 60 && timeDiff > -60) {
            return (timeDiff >= 0 ? Math.floor(timeDiff) + humanize.catalog[' seconds ago'] : humanize.catalog['in '] + Math.floor(-timeDiff) + humanize.catalog[' seconds']);
        }

        // within 2 minutes
        if (timeDiff < 120 && timeDiff > -120) {
            return (timeDiff >= 0 ? humanize.catalog['about a minute ago'] : humanize.catalog['in about a minute']);
        }

        // within an hour
        if (timeDiff < 3600 && timeDiff > -3600) {
            return (timeDiff >= 0 ? Math.floor(timeDiff / 60) + humanize.catalog[' minutes ago'] : humanize.catalog['in '] + Math.floor(-timeDiff / 60) + humanize.catalog[' minutes']);
        }

        // within 2 hours
        if (timeDiff < 7200 && timeDiff > -7200) {
            return (timeDiff >= 0 ? humanize.catalog['about an hour ago'] : humanize.catalog['in about an hour']);
        }

        // within 24 hours
        if (timeDiff < 86400 && timeDiff > -86400) {
            return (timeDiff >= 0 ? Math.floor(timeDiff / 3600) + humanize.catalog[' hours ago'] : humanize.catalog['in '] + Math.floor(-timeDiff / 3600) + humanize.catalog[' hours']);
        }

        // within 2 days
        var days2 = 2 * 86400;
        if (timeDiff < days2 && timeDiff > -days2) {
            return (timeDiff >= 0 ? humanize.catalog['1 day ago'] : humanize.catalog['in 1 day']);
        }

        // within 29 days
        var days29 = 29 * 86400;
        if (timeDiff < days29 && timeDiff > -days29) {
            return (timeDiff >= 0 ? Math.floor(timeDiff / 86400) + humanize.catalog[' days ago'] : humanize.catalog['in '] + Math.floor(-timeDiff / 86400) + humanize.catalog[' days']);
        }

        // within 60 days
        var days60 = 60 * 86400;
        if (timeDiff < days60 && timeDiff > -days60) {
            return (timeDiff >= 0 ? humanize.catalog['about a month ago'] : humanize.catalog['in about a month']);
        }

        var currTimeYears = parseInt(humanize.date('Y', currTime), 10);
        var timestampYears = parseInt(humanize.date('Y', timestamp), 10);
        var currTimeMonths = currTimeYears * 12 + parseInt(humanize.date('n', currTime), 10);
        var timestampMonths = timestampYears * 12 + parseInt(humanize.date('n', timestamp), 10);

        // within a year
        var monthDiff = currTimeMonths - timestampMonths;
        if (monthDiff < 12 && monthDiff > -12) {
            return (monthDiff >= 0 ? monthDiff + humanize.catalog[' months ago'] : humanize.catalog['in '] + (-monthDiff) + humanize.catalog[' months']);
        }

        var yearDiff = currTimeYears - timestampYears;
        if (yearDiff < 2 && yearDiff > -2) {
            return (yearDiff >= 0 ? humanize.catalog['a year ago'] : humanize.catalog['in a year']);
        }

        return (yearDiff >= 0 ? yearDiff + humanize.catalog[' years ago'] : humanize.catalog['in '] + (-yearDiff) + humanize.catalog[' years']);
    };

    humanize.catalog = {
        'just ': 'just ',
        'now': 'now',
        ' seconds ago': ' seconds ago',
        'in ': ' in',
        ' seconds': ' seconds',
        'about a minute ago': 'about a minute ago',
        'in about a minute': 'in about a minute',
        ' minutes ago': ' minutes ago',
        ' minutes': ' minutes',
        'about an hour ago': 'about an hour ago',
        'in about an hour': 'in about an hour',
        ' hours ago': ' hours ago',
        ' hours': ' hours',
        '1 day ago': '1 day ago',
        'in 1 day': 'in 1 day',
        ' days ago': ' days ago',
        ' days': ' days',
        'about a month ago': 'about a month ago',
        'in about a month': 'in about a month',
        ' months ago': ' months ago',
        ' months': ' months',
        ' a year ago': ' a year ago',
        'in a year': 'in a year',
        ' years ago': ' years ago',
        ' years': ' years'
    };

