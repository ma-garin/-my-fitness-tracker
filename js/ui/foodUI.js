// js/ui/foodUI.js
import { loadRecords, saveRecords } from '../services/storageService.js';
import { showMessage } from '../utils/messageUtils.js';
import { getFormattedToday } from '../utils/dateUtils.js'; // 日付ユーティリティをインポート

// === DOM要素の取得 ===
const mealTrackerForm = document.getElementById('mealTrackerForm');
const mealDateInput = document.getElementById('mealDate');
const mealPlanList = document.getElementById('mealPlanList');
const mealCostInput = document.getElementById('mealCost');
const mealMessageElement = document.getElementById('mealMessage');
const mealsTableBody = document.querySelector('#mealsTable tbody');
const clearAllMealRecordsButton = document.getElementById('clearAllMealRecords');
const noMealTableRecordsMessage = document.getElementById('noMealTableRecordsMessage');
const dailyCostSummary = document.getElementById('dailyCostSummary');
const noDailyCostMessage = document.getElementById('noDailyCostMessage');

// === ローカルストレージのキー ===
const STORAGE_KEY_MEAL = 'mealRecords';

// === 初期設定 ===
mealDateInput.value = getFormattedToday(); // 今日の日付をセット

/**
 * 食事記録一覧、日ごとの合計金額をレンダリングする
 */
export const renderMealRecords = () => {
    const mealRecords = loadRecords(STORAGE_KEY_MEAL);
    const dates = Object.keys(mealRecords).sort((a, b) => new Date(b) - new Date(a));

    mealsTableBody.innerHTML = '';
    if (dates.length === 0) {
        noMealTableRecordsMessage.style.display = 'block';
        clearAllMealRecordsButton.style.display = 'none';
    } else {
        noMealTableRecordsMessage.style.display = 'none';
        clearAllMealRecordsButton.style.display = 'block';
        dates.forEach(date => {
            const record = mealRecords[date];
            const row = mealsTableBody.insertRow();
            row.insertCell().textContent = date;
            row.insertCell().textContent = record.meals && record.meals.length > 0 ? record.meals.join(', ') : '-';
            row.insertCell().textContent = record.mealCost !== null ? `${record.mealCost.toLocaleString()}円` : '-';

            const actionCell = row.insertCell();
            const deleteButton = document.createElement('button');
            deleteButton.textContent = '削除';
            deleteButton.classList.add('delete-button');
            deleteButton.addEventListener('click', () => {
                deleteMealRecord(date);
            });
            actionCell.appendChild(deleteButton);
        });
    }
    renderDailyMealCostSummary(); // 食事記録レンダリング後に合計金額も更新
};

/**
 * 個別の食事記録を削除する
 * @param {string} dateToDelete - 削除する日付
 */
const deleteMealRecord = (dateToDelete) => {
    if (confirm(`${dateToDelete} の食事記録を本当に削除しますか？`)) {
        const mealRecords = loadRecords(STORAGE_KEY_MEAL);
        delete mealRecords[dateToDelete];
        saveRecords(STORAGE_KEY_MEAL, mealRecords);
        renderMealRecords();
        // グラフや他の画面の更新は、app.jsでまとめて呼び出すようにする
        showMessage(mealMessageElement, '食事記録を削除しました。', 'info');
    }
};

/**
 * 日ごとの食事合計金額をレンダリングする
 */
const renderDailyMealCostSummary = () => {
    const mealRecords = loadRecords(STORAGE_KEY_MEAL);
    const dailyCosts = {};

    Object.keys(mealRecords).forEach(date => {
        const record = mealRecords[date];
        if (record.mealCost !== null && !isNaN(record.mealCost)) {
            dailyCosts[date] = (dailyCosts[date] || 0) + record.mealCost;
        }
    });

    const sortedDates = Object.keys(dailyCosts).sort((a, b) => new Date(b) - new Date(a));
    dailyCostSummary.innerHTML = ''; // 初期化

    if (sortedDates.length === 0) {
        noDailyCostMessage.style.display = 'block';
    } else {
        noDailyCostMessage.style.display = 'none';
        sortedDates.forEach(date => {
            const p = document.createElement('p');
            p.innerHTML = `${date}: <strong>${dailyCosts[date].toLocaleString()}</strong> 円`;
            dailyCostSummary.appendChild(p);
        });
    }
};

/**
 * FOOD画面のイベントリスナーを設定する
 * @param {Function} updateChartCallback - グラフ更新のためのコールバック関数
 * @param {Function} renderMainRecordsCallback - HOME画面の記録再レンダリングのためのコールバック関数
 */
export const setupFoodEventListeners = (updateChartCallback, renderMainRecordsCallback) => {
    // 食事記録フォーム送信時の処理
    mealTrackerForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const date = mealDateInput.value;
        const selectedMeals = Array.from(mealPlanList.querySelectorAll('input[name="meal"]:checked'))
                                 .map(checkbox => checkbox.value);
        const mealCost = mealCostInput.value !== '' ? parseInt(mealCostInput.value, 10) : null;

        if (!date) {
            showMessage(mealMessageElement, '日付は必須項目です。', 'error');
            return;
        }

        const mealRecords = loadRecords(STORAGE_KEY_MEAL);
        mealRecords[date] = { meals: selectedMeals, mealCost: mealCost };
        saveRecords(STORAGE_KEY_MEAL, mealRecords);
        renderMealRecords();
        if (typeof updateChartCallback === 'function') {
            updateChartCallback();
        }
        if (typeof renderMainRecordsCallback === 'function') {
            renderMainRecordsCallback(); // HOME画面のテーブルも更新
        }
        showMessage(mealMessageElement, '食事記録を保存しました！', 'success');

        // フォームをクリア
        mealCostInput.value = '';
        mealPlanList.querySelectorAll('input[name="meal"]').forEach(checkbox => checkbox.checked = false);
        mealDateInput.value = getFormattedToday(); // 日付を今日に戻す
    });

    // 全食事記録削除ボタンの処理
    clearAllMealRecordsButton.addEventListener('click', () => {
        if (confirm('全ての食事記録を削除してもよろしいですか？この操作は元に戻せません。')) {
            localStorage.removeItem(STORAGE_KEY_MEAL);
            renderMealRecords();
            if (typeof updateChartCallback === 'function') {
                updateChartCallback();
            }
            if (typeof renderMainRecordsCallback === 'function') {
                renderMainRecordsCallback(); // HOME画面のテーブルも更新
            }
            showMessage(mealMessageElement, '全ての食事記録を削除しました。', 'info');
        }
    });
};