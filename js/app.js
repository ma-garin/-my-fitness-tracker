// js/app.js
import { showScreen, initializeMenu } from './ui/domUtils.js';
import { initializeHome } from './ui/homeUI.js';
import { initializeFood } from './ui/foodUI.js';
import { initializeSport } from './ui/sportUI.js';
import { initializeGraph } from './ui/graphUI.js';
import { showMessage } from './utils/helpers.js'; // helpers.jsからshowMessageをインポート

document.addEventListener('DOMContentLoaded', () => {
    // サービスワーカーの登録
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('service-worker.js')
                .then(registration => {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                })
                .catch(err => {
                    console.log('ServiceWorker registration failed: ', err);
                });
        });
    }

    // 各UIの初期化
    initializeMenu();
    initializeHome();
    initializeFood();
    initializeSport();
    initializeGraph();

    // デフォルトでHOME画面を表示
    showScreen('home');

    // グローバルなメッセージ表示関数をwindowオブジェクトに割り当てる（必要であれば）
    // 通常はshowMessageを直接インポートして各モジュール内で使用するのが良い
    window.showMessage = showMessage;
});