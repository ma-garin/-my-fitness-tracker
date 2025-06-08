// js/ui/foodUI.js
import { getRecords, saveRecords, deleteRecord, clearAllRecordsByType } from '../utils/storage.js';
import { showMessage, formatDate } from '../utils/helpers.js';

// DOM要素の取得
const mealTrackerForm = document.getElementById('mealTrackerForm');
const mealDateInput = document.getElementById('mealDate');
const mealPlanList = document.getElementById('mealPlanList');
const mealCostInput = document.getElementById('mealCost');
const mealsTableBody = document.getElementById('mealsTableBody');
const clearAllMealRecordsButton = document.getElementById('clearAllMealRecords');
const dailyCostSummaryDiv = document.getElementById('dailyCostSummary');
const noDailyCostMessage = document.getElementById('noDailyCostMessage');
const noMealTableRecordsMessage = document.getElementById('noMealTableRecordsMessage');

// 初期化関数
export const initializeFood = () => {
    // 今日の日付をデフォルト値としてセット
    mealDateInput.value = new Date().toISOString().split('T')[0];

    // フォーム送信イベントリスナー
    if (mealTrackerForm) {
        mealTrackerForm.addEventListener('submit', handleMealFormSubmit);
    }

    // 全削除ボタンイベントリスナー
    if (clearAllMealRecordsButton) {
        clearAllMealRecordsButton.addEventListener('click', handleClearAllMealRecords);
    }

    // ページロード時に記録をレンダリング
    renderMealRecords();
};

// 食事フォーム送信ハンドラ
const handleMealFormSubmit = (event) => {
    event.preventDefault();

    const date = mealDateInput.value;
    const selectedMeals = Array.from(mealPlanList.querySelectorAll('input[name="meal"]:checked'))
                               .map(checkbox => checkbox.value);
    const mealCost = mealCostInput.value ? parseInt(mealCostInput.value) : 0;

    if (!date) {
        showMessage('日付は必須項目です。', 'error', 'mealMessage');
        return;
    }

    // mainRecordsから該当日のレコードを取得または作成
    let mainRecords = getRecords('mainRecords');
    let targetMainRecord = mainRecords.find(record => record.date === date);

    if (!targetMainRecord) {
        // 該当日の主要記録がない場合は新規作成
        targetMainRecord = {
            date: date,
            weight: null, bodyFat: null, muscleMass: null, waist: null,
            meal: [],
            exercise: [],
            mealCost: 0
        };
        mainRecords.push(targetMainRecord);
    }

    // 食事内容を更新
    targetMainRecord.meal = selectedMeals;
    // 食事金額を加算（既存の金額に今回の金額を追加する）
    targetMainRecord.mealCost = (targetMainRecord.mealCost || 0) + mealCost;

    saveRecords('mainRecords', mainRecords);
    showMessage('食事記録を保存しました！', 'success', 'mealMessage');
    renderMealRecords();
    mealTrackerForm.reset();
    mealDateInput.value = new Date().toISOString().split('T')[0]; // 日付をリセット
};

// 食事記録のレンダリング
export const renderMealRecords = () => {
    const mainRecords = getRecords('mainRecords').sort((a, b) => new Date(b.date) - new Date(a.date)); // 日付の新しい順

    mealsTableBody.innerHTML = ''; // テーブルをクリア

    const mealRecordsForTable = [];
    mainRecords.forEach(record => {
        if (record.meal && record.meal.length > 0) {
            mealRecordsForTable.push({
                date: record.date,
                mealContent: record.meal.join(', '),
                cost: record.mealCost || 0
            });
        }
    });

    if (mealRecordsForTable.length === 0) {
        noMealTableRecordsMessage.style.display = 'block';
        clearAllMealRecordsButton.style.display = 'none';
    } else {
        noMealTableRecordsMessage.style.display = 'none';
        clearAllMealRecordsButton.style.display = 'block';

        mealRecordsForTable.forEach(mealRecord => {
            const row = mealsTableBody.insertRow();
            row.insertCell().textContent = formatDate(mealRecord.date);
            row.insertCell().textContent = mealRecord.mealContent;
            row.insertCell().textContent = mealRecord.cost.toLocaleString();

            const deleteCell = row.insertCell();
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '削除';
            deleteBtn.classList.add('delete-button');
            // 食事記録の削除は、mainRecordsの該当日の食事内容と金額をリセットする
            deleteBtn.addEventListener('click', () => handleDeleteMealRecord(mealRecord.date));
            deleteCell.appendChild(deleteBtn);
        });
    }

    renderDailyMealCostSummary(mainRecords);
};

// 日ごとの食事合計金額のレンダリング
const renderDailyMealCostSummary = (mainRecords) => {
    dailyCostSummaryDiv.innerHTML = '';
    const dailyCosts = {};

    mainRecords.forEach(record => {
        if (record.mealCost) {
            dailyCosts[record.date] = (dailyCosts[record.date] || 0) + record.mealCost;
        }
    });

    const dates = Object.keys(dailyCosts).sort((a, b) => new Date(b) - new Date(a)); // 日付の新しい順

    if (dates.length === 0) {
        noDailyCostMessage.style.display = 'block';
    } else {
        noDailyCostMessage.style.display = 'none';
        dates.forEach(date => {
            const p = document.createElement('p');
            p.innerHTML = `<strong>${formatDate(date)}:</strong> ${dailyCosts[date].toLocaleString()} 円`;
            dailyCostSummaryDiv.appendChild(p);
        });
    }
};

// 食事記録削除ハンドラ（mainRecordsの該当日の食事内容と金額をリセット）
const handleDeleteMealRecord = (dateToDelete) => {
    if (confirm(`日付: ${formatDate(dateToDelete)} の食事記録を削除してもよろしいですか？`)) {
        let mainRecords = getRecords('mainRecords');
        const targetRecord = mainRecords.find(record => record.date === dateToDelete);

        if (targetRecord) {
            targetRecord.meal = []; // 食事内容を空にする
            targetRecord.mealCost = 0; // 食事金額を0にする
            saveRecords('mainRecords', mainRecords);
            showMessage('食事記録を削除しました。', 'info', 'mealMessage');
            renderMealRecords();
        }
    }
};

// 全食事記録削除ハンドラ (mainRecordsの全ての食事内容と金額をリセット)
const handleClearAllMealRecords = () => {
    if (confirm('全ての食事記録を削除してもよろしいですか？この操作は取り消せません。')) {
        let mainRecords = getRecords('mainRecords');
        mainRecords.forEach(record => {
            record.meal = [];
            record.mealCost = 0;
        });
        saveRecords('mainRecords', mainRecords);
        showMessage('全ての食事記録を削除しました。', 'info', 'mealMessage');
        renderMealRecords();
    }
};