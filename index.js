const _ = require('underscore');
const scrape = require('html-metadata');
const request = require('request');
const fs = require('fs');
const del = require('delete');
const moment = require('moment');
const CronJob = require('cron').CronJob;

const appFramework = require('watsonworkspace-bot');
appFramework.level('verbose');
appFramework.startServer();
const app = appFramework.create();

const myId = process.env.APP_ID;

const constants = require('./js/constants');

const UI = require('watsonworkspace-sdk').UI;

app.authenticate().then(() => app.uploadPhoto('./appicon.jpg'));

const getName = url => _.last(url.split('/'));

const cronJobs = {};

const postAnnotation = ({ spaceId }, name, title, text) => {
    app.sendMessage(spaceId, {
        actor: { name },
        color: constants.COLOR,
        text,
        title,
        type: 'generic',
        version: '1'
    });
}

const postComic = ({ url }, spaceId) => {
    return scrape(url).then(data => {
        const { openGraph: { image: { url: img } } } = data;
        const dest = `${constants.TEMP_DIR}/${getName(img)}.jpg`;
        return new Promise((resolve, reject) => {
            request(img).pipe(fs.createWriteStream(dest)
            .on('error', reject)
            .on('finish', () => {
                app.sendFile(spaceId, dest);
                del.sync(dest, { force: true });
                resolve();
            })).on('error', reject);
        });
    });
};

const removeJob = spaceId => {
    cronJobs[spaceId].stop();
    delete cronJobs[spaceId];
}

const onRemoveSpace = data => {
    const { spaceId } = data;
    if(cronJobs[spaceId]) {
        removeJob(spaceId);
    }
}

const onMemberRemoved = data => {
    if(_.contains(data.memberIds, myId)) {
        onRemoveSpace(data);
    }
}

const onMemberAdded = data => {
    if(_.contains(data.memberIds, myId)) {
        onStatus(data);
    }
}

const getComicURL = dateObj => {
    var month = dateObj.getUTCMonth() + 1;
    var day = dateObj.getUTCDate();
    var year = dateObj.getUTCFullYear();
    return `${constants.STRIP}/${year}-${month}-${day}`;
}

const onStartJob = message => {
    const { spaceId } = message;
    if (cronJobs[spaceId]) {
        return onStatus(message);
    }
    const d = new Date();
    cronJobs[spaceId] =  new CronJob({
        cronTime: `${d.getSeconds()} ${d.getMinutes()} ${d.getHours()} * * 0-6`,
        onTick: () => {
            const dateObj = new Date();
            const url = getComicURL(dateObj);
            postComic({ url }, spaceId);
            if(cronJobs[spaceId]) {
                cronJobs[spaceId].lastPost = dateObj.getTime();
                cronJobs[spaceId].comicURL = url;
            }
        },
        start: true,
        runOnInit: true,
        timeZone: 'Europe/Dublin'
    });
    cronJobs[spaceId].lastPost = d.getTime();
    cronJobs[spaceId].comicURL = getComicURL(d);
    delete d;
}

const onStopJob = message => {
    onRemoveSpace(message);
    onStatus(message);
}

const onHelp = message => {
    postAnnotation(message, constants.title.HELP, constants.COMMANDS, '*START*: `@dd start`\n*STOP*: `@dd stop`\n*STATUS*: `@dd status`\n*HELP*: `@dd help`');
};

const onStatus = message => {
    cronJobs[message.spaceId] ? onActive(message) : onInactive(message);
};

const onActive = message => {
    const { comicURL, latest } = cronJobs[message.spaceId];
    const day = moment(latest).isSame(Date.now(), 'days') ? constants.TOMORROW : constants.TODAY;
    postAnnotation(message, constants.title.STATUS, constants.status.RUNNING, `LastPost: ${comicURL}\nNext Post: *${day}*`);
};

const onInactive = message => {
    postAnnotation(message, constants.title.STATUS, constants.status.NOT_RUNNING, '`@dd start` to activate');
};

const onMessageReceived = (message, annotation) => {
    const { content = '', spaceId } = message;
    if (constants.regex.START.test(content)) {
        onStartJob(message);
    }
    if (constants.regex.STOP.test(content)) {
        onStopJob(message);
    }
    if (constants.regex.HELP.test(content)) {
        onHelp(message, annotation);
    }
    if (constants.regex.STATUS.test(content)) {
        onStatus(message, annotation);
    }
};

app.on('message-created', onMessageReceived);

app.on('space-deleted', onRemoveSpace);
app.on('space-members-added', onMemberAdded);
app.on('space-members-removed', onMemberRemoved);
