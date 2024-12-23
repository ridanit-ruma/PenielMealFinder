import express from 'express';
import fetch from 'node-fetch';
import cron from 'cron';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

let mealData = {};

const fetchMealData = async () => {
    let today = '20241223'
    try {
        const response = await fetch('https://timeapi.io/api/time/current/zone?timeZone=Asia/Seoul')
        const data = await response.json();
        if (data.dateTime) {
            const date = new Date(data.dateTime);
            today = date.toISOString().slice(0, 10).replace(/-/g, '');
        } else {
            console.error(`[ERROR] Faild to load date : no data.datetime`);
        }
    } catch (error) {
        console.error(`[ERROR] Faild to load date : ${error.message}`);
    }
    const apiUrl = `https://open.neis.go.kr/hub/mealServiceDietInfo?KEY=${process.env.KEY}&Type=json&ATPT_OFCDC_SC_CODE=C10&SD_SCHUL_CODE=7191199&MMEAL_SC_CODE=2&MLSV_YMD=${today}`;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

    if (data.mealServiceDietInfo) {
        const cal = data.mealServiceDietInfo[1].row[0].CAL_INFO;
        const dish = (data.mealServiceDietInfo[1].row[0].DDISH_NM).split('<br/>');
        mealData = { date: today, cal, dish };
        console.log(`[INFO] Successfully updated meal data : ${today}`);
    } else {
        console.error(`[ERROR] No meal data: ${data}`);
        mealData = { error: "No meal data available for today" };
    }
    } catch (error) {
        console.error(`[ERROR] Faild to get meal data: ${error.message}`);
        mealData = { error: "Failed to fetch meal data" };
    }
};

const job = new cron.CronJob('0 0 * * *', fetchMealData, null, true, 'Asia/Seoul');
job.start();

fetchMealData();

app.get('/meal', (req, res) => {
    res.json(mealData);
});

app.listen(PORT, () => {
    console.log(`[INFO] express api started : http://localhost:${PORT}`);
});