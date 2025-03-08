import express from 'express';
import fetch from 'node-fetch';
import cron from 'cron';
import dotenv from 'dotenv';
import moment from 'moment-timezone';

dotenv.config();

const app = express();
const PORT = 3000;

const allergyList = {
    1: "난류",
    2: "우유",
    3: "메밀",
    4: "땅콩",
    5: "대두",
    6: "밀",
    7: "고등어",
    8: "게",
    9: "새우",
    10: "돼지고기",
    11: "복숭아",
    12: "토마토",
    13: "아황산류",
    14: "호두",
    15: "닭고기",
    16: "쇠고기",
    17: "오징어",
    18: "조개류"
}

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

const errorJsonOutput = async (today) => {
    return {
        date: today,
        dish: "급식 정보가 없습니다.",
        cal: "급식 정보가 없습니다.",
        nutritionInfo: "급식 정보가 없습니다."
    };
}

const cookMealData = async (dishs) => {
    return dishs.split('<br/>').map((dish, i) => {
        const cookedDish = dish.replace(/\(([\d.]+)\)/g, (match, numbers) => {
            const allergyNames = numbers.split('.').map(num => allergyList[num] || num).join(', ');
            return `(${allergyNames})`;
        });
        return `${i + 1}. ${cookedDish}`;
    });
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
                dish: await cookMealData(mealData.DDISH_NM),
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
    // let date = moment().tz('Asia/Seoul');
    // if (date.hour() >= 13) {
    //     date = date.add(1, 'days');
    // }
    // const today = date.format('YYYYMMDD');
    const today = '20250307';
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