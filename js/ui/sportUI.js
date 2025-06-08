// js/ui/sportUI.js
import { loadRecords, saveRecords } from '../services/storageService.js';
import { showMessage } from '../utils/messageUtils.js';
import { getFormattedToday } from '../utils/dateUtils.js'; // 日付ユーティリティをインポート

// === DOM要素の取得 ===
const exerciseTrackerForm = document.getElementById('exerciseTrackerForm');
const exerciseDateInput = document.getElementById('exerciseDate');
const exercisePlanList = document.getElementById('exercisePlanList');
const exerciseMessageElement = document.getElementById('exerciseMessage');
const exercisesTableBody = document.querySelector('#exercisesTable tbody');
const clearAllExerciseRecordsButton = document.getElementById('clearAllExerciseRecords');
const noExerciseTableRecordsMessage = document.getElementById('noExerciseTableRecordsMessage');

// === ローカルストレージのキー ===
const STORAGE_KEY_EXERCISE = 'exerciseRecords';

// === 初期設定 ===
exerciseDateInput.value = getFormattedToday(); // 今日の日付をセット

/**
 * 運動記録一覧をレンダリングする
 */
export const renderExerciseRecords = () => {
    const exerciseRecords = loadRecords(STORAGE_KEY_EXERCISE);
    const dates = Object.keys(exerciseRecords).sort((a, b) => new Date(b) - new Date(a));

    exercisesTableBody.innerHTML = '';
    if (dates.length === 0) {
        noExerciseTableRecordsMessage.style.display = 'block';
        clearAllExerciseRecordsButton.style.display = 'none';
    } else {
        noExerciseTableRecordsMessage.style.display = 'none';
        clearAllExerciseRecordsButton.style.display = 'block';
        dates.forEach(date => {
            const record = exerciseRecords[date];
            const row = exercisesTableBody.insertRow();
            row.insertCell().textContent = date;
            row.insertCell().textContent = record.exercises && record.exercises.length > 0 ? record.exercises.join(', ') : '-';

            const actionCell = row.insertCell();
            const deleteButton = document.createElement('button');
            deleteButton.textContent = '削除';
            deleteButton.classList.add('delete-button');
            deleteButton.addEventListener('click', () => {
                deleteExerciseRecord(date);
            });
            actionCell.appendChild(deleteButton);
        });
    }
};

/**
 * 個別の運動記録を削除する
 * @param {string} dateToDelete - 削除する日付
 */
const deleteExerciseRecord = (dateToDelete) => {
    if (confirm(`${dateToDelete} の運動記録を本当に削除しますか？`)) {
        const exerciseRecords = loadRecords(STORAGE_KEY_EXERCISE);
        delete exerciseRecords[dateToDelete];
        saveRecords(STORAGE_KEY_EXERCISE, exerciseRecords);
        renderExerciseRecords();
        // HOME画面の更新は、app.jsでまとめて呼び出すようにする
        showMessage(exerciseMessageElement, '運動記録を削除しました。', 'info');
    }
};

/**
 * SPORT画面のイベントリスナーを設定する
 * @param {Function} renderMainRecordsCallback - HOME画面の記録再レンダリングのためのコールバック関数
 */
export const setupSportEventListeners = (renderMainRecordsCallback) => {
    // 運動記録フォーム送信時の処理
    exerciseTrackerForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const date = exerciseDateInput.value;
        const selectedExercises = Array.from(exercisePlanList.querySelectorAll('input[name="exercise"]:checked'))
                                   .map(checkbox => checkbox.value);

        if (!date) {
            showMessage(exerciseMessageElement, '日付は必須項目です。', 'error');
            return;
        }

        const exerciseRecords = loadRecords(STORAGE_KEY_EXERCISE);
        exerciseRecords[date] = { exercises: selectedExercises };
        saveRecords(STORAGE_KEY_EXERCISE, exerciseRecords);
        renderExerciseRecords();
        if (typeof renderMainRecordsCallback === 'function') {
            renderMainRecordsCallback(); // HOME画面のテーブルも更新
        }
        showMessage(exerciseMessageElement, '運動記録を保存しました！', 'success');

        // フォームをクリア
        exercisePlanList.querySelectorAll('input[name="exercise"]').forEach(checkbox => checkbox.checked = false);
        exerciseDateInput.value = getFormattedToday(); // 日付を今日に戻す
    });

    // 全運動記録削除ボタンの処理
    clearAllExerciseRecordsButton.addEventListener('click', () => {
        if (confirm('全ての運動記録を削除してもよろしいですか？この操作は元に戻せません。')) {
            localStorage.removeItem(STORAGE_KEY_EXERCISE);
            renderExerciseRecords();
            if (typeof renderMainRecordsCallback === 'function') {
                renderMainRecordsCallback(); // HOME画面のテーブルも更新
            }
            showMessage(exerciseMessageElement, '全ての運動記録を削除しました。', 'info');
        }
    });
};