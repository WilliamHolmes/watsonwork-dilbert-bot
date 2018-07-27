// const _ = require('underscore');

// const ID = 'bdd714e6-645f-4f0d-b031-f0020ac08492';

const constants = {
    TODAY: 'Today',
    TOMORROW: 'Tomorrow',
    COMMANDS: 'Commands',
    COLOR: '#666666',
    title: {
        HELP: 'Help',
        STATUS: 'Status'
    },
    status: {
        RUNNING: 'RUNNING',
        NOT_RUNNING: 'NOT RUNNING'
    },
    STRIP: 'http://dilbert.com/strip',
    TEMP_DIR: './temp_files',
    regex: {
        START: /^@dd start(?:\n\s*)?$/mi,
        STOP: /^@dd stop(?:\n\s*)?$/mi,
        HELP: /^@dd help(?:\n\s*)?$/mi,
        STATUS: /^@dd status(?:\n\s*)?$/mi
    }
};

module.exports = constants;