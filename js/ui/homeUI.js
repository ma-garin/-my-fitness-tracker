// js/ui/homeUI.js
import { loadRecords, saveRecords } from '../services/storageService.js';
import { showMessage } from '../utils/messageUtils.js';
import { getFormattedToday } from '../utils/dateUtils.js'; // 日付ユーティリティをインポート

// === DOM要素の取得 ===
const trackerForm = document.getElementById('trackerForm');
const dateInput = document.getElementById('date');
const weightInput = document.getElementById('weight');
const bodyFatInput = document.getElementById('bodyFat');
const muscleMassInput = document.getElementById('muscleMass');
const waistInput = document.getElementById('waist');
const recordsTableBody = document.querySelector('#recordsTable tbody');
const messageElement = document.getElementById('message');
const clearAllRecordsButton = document.getElementById('clearAllRecords');
const summaryDate = document.getElementById('summaryDate');
const summaryWeight = document.getElementById('summaryWeight');
const summaryBodyFat = document.getElementById('summaryBodyFat');
const summaryMuscleMass = document.getElementById('summaryMuscleMass');
const summaryWaist = document.getElementById('summaryWaist');
const noLatestRecordMessage = document.getElementById('noLatestRecordMessage');
const noTableRecordsMessage = document.getElementById('noTableRecordsMessage');

// === ローカルストレージのキー ===
const STORAGE_KEY_MAIN = 'fitnessRecords';
const STORAGE_KEY_MEAL = 'mealRecords'; // 食事記録も連携
const STORAGE_KEY_EXERCISE = 'exerciseRecords'; // 運動記録も連携

// === 初期設定 ===
dateInput.value = getFormattedToday(); // 今日の日付をセット

/**
 * 主要記録一覧、最新記録サマリーをレンダリングする
 */
export const renderMainRecords = () => {
    const records = loadRecords(STORAGE_KEY_MAIN);
    const mealRecords = loadRecords(STORAGE_KEY_MEAL); // 食事記録も読み込む
    const exerciseRecords = loadRecords(STORAGE_KEY_EXERCISE); // 運動記録も読み込む

    const dates = Object.keys(records).sort((a, b) => new Date(b) - new Date(a)); // 日付で降順ソート

    // 記録一覧のレンダリング
    recordsTableBody.innerHTML = '';
    if (dates.length === 0) {
        noTableRecordsMessage.style.display = 'block';
        clearAllRecordsButton.style.display = 'none';
    } else {
        noTableRecordsMessage.style.display = 'none';
        clearAllRecordsButton.style.display = 'block';
        dates.forEach(date => {
            const record = records[date];
            const mealRecord = mealRecords[date];
            const exerciseRecord = exerciseRecords[date];

            const row = recordsTableBody.insertRow();
            row.insertCell().textContent = date;
            row.insertCell().textContent = record.weight ? record.weight.toFixed(1) : '-';
            row.insertCell().textContent = record.bodyFat !== null ? record.bodyFat.toFixed(1) : '-';
            row.insertCell().textContent = record.muscleMass !== null ? record.muscleMass.toFixed(1) : '-';
            row.insertCell().textContent = record.waist ? record.waist.toFixed(1) : '-';

            // 食事記録の表示（短縮形）
            const mealSummary = mealRecord && mealRecord.meals && mealRecord.meals.length > 0
                ? mealRecord.meals.map(m => m.charAt(0)).join('') // 例: 朝食,昼食 -> AD
                : '-';
            row.insertCell().textContent = mealSummary;

            // 運動記録の表示（短縮形）
            const exerciseSummary = exerciseRecord && exerciseRecord.exercises && exerciseRecord.exercises.length > 0
                ? exerciseRecord.exercises.map(e => e.split('(')[0].charAt(0)).join('') // 例: ランニング(30分) -> R
                : '-';
            row.insertCell().textContent = exerciseSummary;

            // 金額記録の表示
            row.insertCell().textContent = mealRecord && mealRecord.mealCost !== null ? `${mealRecord.mealCost.toLocaleString()}円` : '-';


            const actionCell = row.insertCell();
            const deleteButton = document.createElement('button');
            deleteButton.textContent = '削除';
            deleteButton.classList.add('delete-button');
            deleteButton.addEventListener('click', () => {
                deleteMainRecord(date); // 主要記録のみ削除
            });
            actionCell.appendChild(deleteButton);
        });
    }

    // 最新記録サマリーのレンダリング
    if (dates.length > 0) {
        const latestDate = dates[0]; // 最新の日付
        const latestRecord = records[latestDate];
        summaryDate.textContent = latestDate;
        summaryWeight.textContent = latestRecord.weight ? latestRecord.weight.toFixed(1) : '-';
        summaryBodyFat.textContent = latestRecord.bodyFat !== null ? latestRecord.bodyFat.toFixed(1) : '-';
        summaryMuscleMass.textContent = latestRecord.muscleMass !== null ? latestRecord.muscleMass.toFixed(1) : '-';
        summaryWaist.textContent = latestRecord.waist ? latestRecord.waist.toFixed(1) : '-';
        noLatestRecordMessage.style.display = 'none';
    } else {
        summaryDate.textContent = '-';
        summaryWeight.textContent = '-';
        summaryBodyFat.textContent = '-';
        summaryMuscleMass.textContent = '-';
        summaryWaist.textContent = '-';
        noLatestRecordMessage.style.display = 'block';
    }
};

/**
 * 個別の主要記録を削除する
 * @param {string} dateToDelete - 削除する日付
 */
const deleteMainRecord = (dateToDelete) => {
    if (confirm(`${dateToDelete} の主要記録を本当に削除しますか？`)) {
        const records = loadRecords(STORAGE_KEY_MAIN);
        delete records[dateToDelete];
        saveRecords(STORAGE_KEY_MAIN, records);
        renderMainRecords(); // 主要記録のみ再レンダリング
        // グラフや他の画面の更新は、app.jsでまとめて呼び出すようにする
        showMessage(messageElement, '主要記録を削除しました。', 'info');
    }
};

/**
 * HOME画面のイベントリスナーを設定する
 * @param {Function} updateChartCallback - グラフ更新のためのコールバック関数
 * @param {Function} renderOtherRecordsCallback - 他の記録（食事、運動）の再レンダリングのためのコールバック関数
 */
export const setupHomeEventListeners = (updateChartCallback, renderOtherRecordsCallback) => {
    // 主要記録フォーム送信時の処理
    trackerForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const date = dateInput.value;
        const weight = parseFloat(weightInput.value);
        const bodyFat = bodyFatInput.value !== '' ? parseFloat(bodyFatInput.value) : null;
        const muscleMass = muscleMassInput.value !== '' ? parseFloat(muscleMassInput.value) : null;
        const waist = parseFloat(waistInput.value);

        if (!date || isNaN(weight) || isNaN(waist)) {
            showMessage(messageElement, '日付、体重、ウエストは必須項目です。', 'error');
            return;
        }

        const records = loadRecords(STORAGE_KEY_MAIN);
        records[date] = { weight, bodyFat, muscleMass, waist };
        saveRecords(STORAGE_KEY_MAIN, records);
        renderMainRecords();
        if (typeof updateChartCallback === 'function') {
            updateChartCallback();
        }
        showMessage(messageElement, '主要記録を保存しました！', 'success');

        weightInput.value = '';
        bodyFatInput.value = '';
        muscleMassInput.value = '';
        waistInput.value = '';
        dateInput.value = getFormattedToday(); // 日付を今日に戻す
    });

    // 全主要記録削除ボタンの処理
    clearAllRecordsButton.addEventListener('click', () => {
        if (confirm('全ての主要記録を削除してもよろしいですか？この操作は元に戻せません。')) {
            localStorage.removeItem(STORAGE_KEY_MAIN);
            renderMainRecords();
            if (typeof updateChartCallback === 'function') {
                updateChartCallback();
            }
            showMessage(messageElement, '全ての主要記録を削除しました。', 'info');
        }
    });

    // 各主要記録の削除ボタンのイベントリスナーは renderMainRecords 内で設定されるため、
    // ここでまとめて設定する必要はないが、renderMainRecords が呼び出される度に再設定される点に注意。
    // （今回はこれで問題ないが、大規模アプリではイベント委譲などを検討）
};