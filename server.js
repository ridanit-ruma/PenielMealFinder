import express from 'express';
import fetch from 'node-fetch';
import cron from 'cron';
import dotenv from 'dotenv';
import moment from 'moment-timezone';

dotenv.config();

const app = express();
const PORT = 3000;

let breakfastMealData = { message: "Updating meal data, please wait..." };
let lunchMealData = { message: "Updating meal data, please wait..." };
let dinnerMealData = { message: "Updating meal data, please wait..." };

console.log(`[INFO] API KEY : ${process.env.KEY}`);

const errorJsonOutput = async (today) => {
    return {
        date: today,
        dish: "NEIS 서버에 급식 정보가 올라오지 않았거나나",
        cal: "내부적으로 오류가 생긴것 같아요.",
        nutritionInfo: "이 메시지를 보신다면 전자의 가능성이 높으니, 기다려주세요."
    };
}

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
            return errorJsonOutput(today);
        }
    } catch (error) {
        console.error(`[ERROR] Failed to get meal data: ${error.message}`);
        return errorJsonOutput(today);
    }
};

const updateMealData = async () => {
    let date = moment().tz('Asia/Seoul');
    if (date.hour() >= 13) {
        date = date.add(1, 'days');
    }
    const today = date.format('YYYYMMDD');
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