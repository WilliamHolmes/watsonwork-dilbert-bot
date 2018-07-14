// const _ = require('underscore');
const scrape = require('html-metadata');
// const request = require('request');
// const fs = require('fs');
// const del = require('delete');
const CronJob = require('cron').CronJob;

const appFramework = require('watsonworkspace-bot');
appFramework.level('verbose');
appFramework.startServer();
const app = appFramework.create();

const constants = require('./js/constants');

const UI = require('watsonworkspace-sdk').UI;

app.authenticate().then(() => app.uploadPhoto('./appicon.jpg'));

const postComic = ({ url }, spaceId) => {
    return scrape(url).then(data => {
        console.log(data);
        // const { openGraph: { image: { url: img } } } = data;
        // const dest = `${constants.TEMP_DIR}/${getName(img)}`;
        // return new Promise((resolve, reject) => {
        //     request(img).pipe(fs.createWriteStream(dest)
        //     .on('error', reject)
        //     .on('finish', () => {
        //         app.sendFile(spaceId, dest);
        //         del.sync(dest, { force: true });
        //         resolve();
        //     })).on('error', reject);
        // });
    });
};

const onTick = () => {
    var dateObj = new Date();
    var month = dateObj.getUTCMonth() + 1;
    var day = dateObj.getUTCDate();
    var year = dateObj.getUTCFullYear();
    const url = `${constants.STRIP}/${year}-${month}-${day}`;
    postComic({ url });
};

new CronJob({
  cronTime: '00 13 23 * * 0-6',
  onTick: onTick,
  start: true,
  timeZone: 'Europe/Dublin'
});