// js/ui/homeUI.js
import { getRecords, saveRecords, deleteRecord, clearAllRecordsByType } from '../utils/storage.js';
import { showMessage, formatDate } from '../utils/helpers.js';

// DOM要素の取得
const trackerForm = document.getElementById('trackerForm');
const dateInput = document.getElementById('date');
const weightInput = document.getElementById('weight');
const bodyFatInput = document.getElementById('bodyFat');
const muscleMassInput = document.getElementById('muscleMass');
const waistInput = document.getElementById('waist');
const recordsTableBody = document.getElementById('recordsTableBody');
const clearAllRecordsButton = document.getElementById('clearAllRecords');
const noLatestRecordMessage = document.getElementById('noLatestRecordMessage');
const noTableRecordsMessage = document.getElementById('noTableRecordsMessage');

// 最新記録のサマリー表示要素
const summaryDate = document.getElementById('summaryDate');
const summaryWeight = document.getElementById('summaryWeight');
const summaryBodyFat = document.getElementById('summaryBodyFat');
const summaryMuscleMass = document.getElementById('summaryMuscleMass');
const summaryWaist = document.getElementById('summaryWaist');

// 初期化関数
export const initializeHome = () => {
    // 今日の日付をデフォルト値としてセット
    dateInput.value = new Date().toISOString().split('T')[0];

    // フォーム送信イベントリスナー
    if (trackerForm) {
        trackerForm.addEventListener('submit', handleFormSubmit);
    }

    // 全削除ボタンイベントリスナー
    if (clearAllRecordsButton) {
        clearAllRecordsButton.addEventListener('click', handleClearAllRecords);
    }

    // ページロード時に記録をレンダリング
    renderMainRecords();
};

// フォーム送信ハンドラ
const handleFormSubmit = (event) => {
    event.preventDefault();

    const date = dateInput.value;
    const weight = parseFloat(weightInput.value);
    const bodyFat = bodyFatInput.value ? parseFloat(bodyFatInput.value) : null;
    const muscleMass = muscleMassInput.value ? parseFloat(muscleMassInput.value) : null;
    const waist = parseFloat(waistInput.value);

    // 必須入力項目のチェック
    if (!date || isNaN(weight) || isNaN(waist)) {
        showMessage('日付、体重、ウエストは必須項目です。', 'error', 'message');
        return;
    }

    const newRecord = {
        date,
        weight,
        bodyFat,
        muscleMass,
        waist,
        meal: [], // 食事記録は別途管理
        exercise: [], // 運動記録は別途管理
        mealCost: 0 // 食事金額は別途管理
    };

    let records = getRecords('mainRecords');
    // 同じ日付の記録があれば更新、なければ追加
    const existingIndex = records.findIndex(record => record.date === date);

    if (existingIndex !== -1) {
        // 既存の食事と運動の情報を保持して更新
        const existingRecord = records[existingIndex];
        newRecord.meal = existingRecord.meal || [];
        newRecord.exercise = existingRecord.exercise || [];
        newRecord.mealCost = existingRecord.mealCost || 0;
        records[existingIndex] = newRecord;
        showMessage('記録を更新しました！', 'success', 'message');
    } else {
        records.push(newRecord);
        showMessage('記録を保存しました！', 'success', 'message');
    }

    saveRecords('mainRecords', records);
    renderMainRecords();
    trackerForm.reset();
    dateInput.value = new Date().toISOString().split('T')[0]; // 日付をリセット
};

// 主要記録のレンダリング
export const renderMainRecords = () => {
    const records = getRecords('mainRecords').sort((a, b) => new Date(b.date) - new Date(a.date)); // 日付の新しい順

    recordsTableBody.innerHTML = ''; // テーブルをクリア

    if (records.length === 0) {
        noTableRecordsMessage.style.display = 'block';
        clearAllRecordsButton.style.display = 'none';
    } else {
        noTableRecordsMessage.style.display = 'none';
        clearAllRecordsButton.style.display = 'block';

        records.forEach(record => {
            const row = recordsTableBody.insertRow();
            row.insertCell().textContent = formatDate(record.date);
            row.insertCell().textContent = record.weight !== null ? record.weight.toFixed(1) : '-';
            row.insertCell().textContent = record.bodyFat !== null ? record.bodyFat.toFixed(1) : '-';
            row.insertCell().textContent = record.muscleMass !== null ? record.muscleMass.toFixed(1) : '-';
            row.insertCell().textContent = record.waist !== null ? record.waist.toFixed(1) : '-';
            row.insertCell().textContent = record.meal && record.meal.length > 0 ? record.meal.join(', ') : '-';
            row.insertCell().textContent = record.exercise && record.exercise.length > 0 ? record.exercise.join(', ') : '-';
            row.insertCell().textContent = record.mealCost !== null ? record.mealCost.toLocaleString() : '-';

            const deleteCell = row.insertCell();
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '削除';
            deleteBtn.classList.add('delete-button');
            deleteBtn.addEventListener('click', () => handleDeleteRecord(record.date));
            deleteCell.appendChild(deleteBtn);
        });
    }

    // 最新記録のサマリーを更新
    if (records.length > 0) {
        const latestRecord = records[0]; // 最新の記録はソート済み配列の最初の要素
        summaryDate.textContent = formatDate(latestRecord.date);
        summaryWeight.textContent = latestRecord.weight !== null ? latestRecord.weight.toFixed(1) : '-';
        summaryBodyFat.textContent = latestRecord.bodyFat !== null ? latestRecord.bodyFat.toFixed(1) : '-';
        summaryMuscleMass.textContent = latestRecord.muscleMass !== null ? latestRecord.muscleMass.toFixed(1) : '-';
        summaryWaist.textContent = latestRecord.waist !== null ? latestRecord.waist.toFixed(1) : '-';
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

// 記録削除ハンドラ
const handleDeleteRecord = (dateToDelete) => {
    if (confirm('この記録を削除してもよろしいですか？')) {
        deleteRecord('mainRecords', dateToDelete);
        showMessage('記録を削除しました。', 'info', 'message');
        renderMainRecords();
    }
};

// 全主要記録削除ハンドラ
const handleClearAllRecords = () => {
    if (confirm('全ての主要記録を削除してもよろしいですか？この操作は取り消せません。')) {
        clearAllRecordsByType('mainRecords');
        showMessage('全ての主要記録を削除しました。', 'info', 'message');
        renderMainRecords();
    }
};

// 日付フォーマットの関数（helpers.jsからインポート済みだが、念のためここに記載）
// function formatDate(dateString) {
//     const options = { year: 'numeric', month: 'long', day: 'numeric' };
//     return new Date(dateString).toLocaleDateString('ja-JP', options);
// }