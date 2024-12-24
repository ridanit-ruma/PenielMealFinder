import express from 'express';
import fetch from 'node-fetch';
import cron from 'cron';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

let breakfastMealData = {
    date: "none",
    dish: "Updating data...",
    cal: "none",
    nutritionInfo: "none",
};
let lunchMealData = {
    date: "none",
    dish: "Updating data...",
    cal: "none",
    nutritionInfo: "none",
};
let dinnerMealData = {
    date: "none",
    dish: "Updating data...",
    cal: "none",
    nutritionInfo: "none",
};

console.log(`[INFO] API KEY : ${process.env.KEY}`);

const fetchMealData = async (mealCode, today) => {
    const apiUrl = `https://open.neis.go.kr/hub/mealServiceDietInfo?KEY=${process.env.KEY}&Type=json&ATPT_OFCDC_SC_CODE=C10&SD_SCHUL_CODE=7191199&MMEAL_SC_CODE=${mealCode}&MLSV_YMD=${today}`;
    
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.mealServiceDietInfo) {
            const mealData = data.mealServiceDietInfo[1].row[0];
            return {
                date: today,
                dish: mealData.DDISH_NM.split('<br/>'),
                cal: mealData.CAL_INFO,
                nutritionInfo: mealData.NTR_INFO.split('<br/>')
            };
        } else {
            console.error(`[ERROR] No meal data: ${today}`);
            return {
                date: today,
                dish: "No meal data available for today",
                cal: "none",
                nutritionInfo: "none",
            };
        }
    } catch (error) {
        console.error(`[ERROR] Failed to get meal data: ${error.message}`);
        return {
            date: today,
            dish: "No meal data available for today",
            cal: "none",
            nutritionInfo: "none",
        };
    }
};

const updateMealData = async () => {
    let today = '20241223'
    try {
        const response = await fetch('https://timeapi.io/api/time/current/zone?timeZone=Asia/Seoul')
        const data = await response.json();
        if (data.dateTime) {
            const date = new Date(data.dateTime);
            date.setHours(date.getHours() + 11);
            today = date.toISOString().slice(0, 10).replace(/-/g, '');
        } else {
            console.error(`[ERROR] Faild to load date : no data.datetime`);
        }
    } catch (error) {
        console.error(`[ERROR] Faild to load date : ${error.message}`);
    }
    breakfastMealData = await fetchMealData('1', today);
    lunchMealData = await fetchMealData('2', today);
    dinnerMealData = await fetchMealData('3', today);
};

const job = new cron.CronJob('0 13 * * *', updateMealData, null, true, 'Asia/Seoul');
job.start();

updateMealData();

app.get('/meal/getBreakfastMealData', async (req, res) => {
    res.json(breakfastMealData);
});

app.get('/meal/getLunchMealData', async (req, res) => {
    res.json(lunchMealData);
});

app.get('/meal/getDinnerMealData', async (req, res) => {
    res.json(dinnerMealData);
});

app.listen(PORT, () => {
    console.log(`[INFO] express api started : http://localhost:${PORT}`);
});