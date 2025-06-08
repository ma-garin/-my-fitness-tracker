// js/ui/sportUI.js
import { getRecords, saveRecords, deleteRecord, clearAllRecordsByType } from '../utils/storage.js';
import { showMessage, formatDate } from '../utils/helpers.js';

// DOM要素の取得
const exerciseTrackerForm = document.getElementById('exerciseTrackerForm');
const exerciseDateInput = document.getElementById('exerciseDate');
const exercisePlanList = document.getElementById('exercisePlanList');
const exercisesTableBody = document.getElementById('exercisesTableBody');
const clearAllExerciseRecordsButton = document.getElementById('clearAllExerciseRecords');
const noExerciseTableRecordsMessage = document.getElementById('noExerciseTableRecordsMessage');

// 初期化関数
export const initializeSport = () => {
    // 今日の日付をデフォルト値としてセット
    exerciseDateInput.value = new Date().toISOString().split('T')[0];

    // フォーム送信イベントリスナー
    if (exerciseTrackerForm) {
        exerciseTrackerForm.addEventListener('submit', handleExerciseFormSubmit);
    }

    // 全削除ボタンイベントリスナー
    if (clearAllExerciseRecordsButton) {
        clearAllExerciseRecordsButton.addEventListener('click', handleClearAllExerciseRecords);
    }

    // ページロード時に記録をレンダリング
    renderExerciseRecords();
};

// 運動フォーム送信ハンドラ
const handleExerciseFormSubmit = (event) => {
    event.preventDefault();

    const date = exerciseDateInput.value;
    const selectedExercises = Array.from(exercisePlanList.querySelectorAll('input[name="exercise"]:checked'))
                                 .map(checkbox => checkbox.value);

    if (!date) {
        showMessage('日付は必須項目です。', 'error', 'exerciseMessage');
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

    // 運動内容を更新
    targetMainRecord.exercise = selectedExercises;

    saveRecords('mainRecords', mainRecords);
    showMessage('運動記録を保存しました！', 'success', 'exerciseMessage');
    renderExerciseRecords();
    exerciseTrackerForm.reset();
    exerciseDateInput.value = new Date().toISOString().split('T')[0]; // 日付をリセット
};

// 運動記録のレンダリング
export const renderExerciseRecords = () => {
    const mainRecords = getRecords('mainRecords').sort((a, b) => new Date(b.date) - new Date(a.date)); // 日付の新しい順

    exercisesTableBody.innerHTML = ''; // テーブルをクリア

    const exerciseRecordsForTable = [];
    mainRecords.forEach(record => {
        if (record.exercise && record.exercise.length > 0) {
            exerciseRecordsForTable.push({
                date: record.date,
                exerciseContent: record.exercise.join(', ')
            });
        }
    });

    if (exerciseRecordsForTable.length === 0) {
        noExerciseTableRecordsMessage.style.display = 'block';
        clearAllExerciseRecordsButton.style.display = 'none';
    } else {
        noExerciseTableRecordsMessage.style.display = 'none';
        clearAllExerciseRecordsButton.style.display = 'block';

        exerciseRecordsForTable.forEach(exerciseRecord => {
            const row = exercisesTableBody.insertRow();
            row.insertCell().textContent = formatDate(exerciseRecord.date);
            row.insertCell().textContent = exerciseRecord.exerciseContent;

            const deleteCell = row.insertCell();
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '削除';
            deleteBtn.classList.add('delete-button');
            // 運動記録の削除は、mainRecordsの該当日の運動内容をリセットする
            deleteBtn.addEventListener('click', () => handleDeleteExerciseRecord(exerciseRecord.date));
            deleteCell.appendChild(deleteBtn);
        });
    }
};

// 運動記録削除ハンドラ（mainRecordsの該当日の運動内容をリセット）
const handleDeleteExerciseRecord = (dateToDelete) => {
    if (confirm(`日付: ${formatDate(dateToDelete)} の運動記録を削除してもよろしいですか？`)) {
        let mainRecords = getRecords('mainRecords');
        const targetRecord = mainRecords.find(record => record.date === dateToDelete);

        if (targetRecord) {
            targetRecord.exercise = []; // 運動内容を空にする
            saveRecords('mainRecords', mainRecords);
            showMessage('運動記録を削除しました。', 'info', 'exerciseMessage');
            renderExerciseRecords();
        }
    }
};

// 全運動記録削除ハンドラ (mainRecordsの全ての運動内容をリセット)
const handleClearAllExerciseRecords = () => {
    if (confirm('全ての運動記録を削除してもよろしいですか？この操作は取り消せません。')) {
        let mainRecords = getRecords('mainRecords');
        mainRecords.forEach(record => {
            record.exercise = [];
        });
        saveRecords('mainRecords', mainRecords);
        showMessage('全ての運動記録を削除しました。', 'info', 'exerciseMessage');
        renderExerciseRecords();
    }
};