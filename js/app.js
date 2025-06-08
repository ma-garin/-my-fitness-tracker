// js/app.js
import { showScreen, setupScreenEventListeners } from './ui/screenManager.js';
import { renderMainRecords, setupHomeEventListeners } from './ui/homeUI.js';
import { renderMealRecords, setupFoodEventListeners } from './ui/foodUI.js';
import { renderExerciseRecords, setupSportEventListeners } from './ui/sportUI.js';
import { updateChart, setupGraphEventListeners } from './ui/graphUI.js';

document.addEventListener('DOMContentLoaded', () => {
    // === サービスワーカーの登録 ===
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./service-worker.js')
                .then(registration => {
                    console.log('Service Worker registered with scope:', registration.scope);
                })
                .catch(err => {
                    console.error('Service Worker registration failed:', err);
                });
        });
    }

    // === 初期レンダリングと画面表示 ===
    // 最初にHOME画面を表示
    showScreen('home');

    // 各記録をレンダリング
    renderMainRecords();
    renderMealRecords();
    renderExerciseRecords();
    // グラフの初期化は、graph画面に切り替わった時に行われる

    // === 各画面のイベントリスナー設定 ===
    // 画面切り替えのイベントリスナーを設定し、グラフ更新関数を渡す
    setupScreenEventListeners(updateChart);

    // HOME画面のイベントリスナーを設定し、必要なコールバック関数を渡す
    setupHomeEventListeners(updateChart, () => {
        renderMealRecords(); // HOMEから主要記録削除時などに食事記録も再レンダリングが必要な場合
        renderExerciseRecords(); // HOMEから主要記録削除時などに運動記録も再レンダリングが必要な場合
    });

    // FOOD画面のイベントリスナーを設定し、必要なコールバック関数を渡す
    setupFoodEventListeners(updateChart, renderMainRecords); // renderMainRecords は HOME画面のテーブルを更新するため

    // SPORT画面のイベントリスナーを設定し、必要なコールバック関数を渡す
    setupSportEventListeners(renderMainRecords); // renderMainRecords は HOME画面のテーブルを更新するため

    // GRAPH画面のイベントリスナーを設定
    setupGraphEventListeners();
});