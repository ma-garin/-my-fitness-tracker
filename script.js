document.addEventListener('DOMContentLoaded', () => {
    // === DOM要素の取得 ===
    // ヘッダーとナビゲーション
    const menuButton = document.getElementById('menuButton');
    const sideMenu = document.getElementById('sideMenu');
    const overlay = document.getElementById('overlay');
    const menuItems = document.querySelectorAll('.menu-item');
    const screenTitle = document.getElementById('screenTitle'); // ヘッダーのタイトル

    // 各画面セクション
    const homeScreen = document.getElementById('homeScreen');
    const foodScreen = document.getElementById('foodScreen');
    const sportScreen = document.getElementById('sportScreen');
    const graphScreen = document.getElementById('graphScreen');

    // HOME画面関連
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

    // FOOD画面関連
    const mealTrackerForm = document.getElementById('mealTrackerForm');
    const mealDateInput = document.getElementById('mealDate');
    const mealPlanList = document.getElementById('mealPlanList');
    const mealCostInput = document.getElementById('mealCost');
    const mealMessageElement = document.getElementById('mealMessage');
    const mealsTableBody = document.querySelector('#mealsTable tbody');
    const clearAllMealRecordsButton = document.getElementById('clearAllMealRecords');
    const noMealTableRecordsMessage = document.getElementById('noMealTableRecordsMessage');
    const dailyCostSummary = document.getElementById('dailyCostSummary'); // 日ごとの合計金額表示エリア
    const noDailyCostMessage = document.getElementById('noDailyCostMessage');

    // SPORT画面関連
    const exerciseTrackerForm = document.getElementById('exerciseTrackerForm');
    const exerciseDateInput = document.getElementById('exerciseDate');
    const exercisePlanList = document.getElementById('exercisePlanList');
    const exerciseMessageElement = document.getElementById('exerciseMessage');
    const exercisesTableBody = document.querySelector('#exercisesTable tbody');
    const clearAllExerciseRecordsButton = document.getElementById('clearAllExerciseRecords');
    const noExerciseTableRecordsMessage = document.getElementById('noExerciseTableRecordsMessage');

    // GRAPH画面関連
    const chartTypeSelect = document.getElementById('chartType');
    const chartPeriodSelect = document.getElementById('chartPeriod');
    const noChartDataMessage = document.getElementById('noChartDataMessage');
    let myChart; // Chartインスタンスを保持する変数

    // === ローカルストレージのキー ===
    const STORAGE_KEY_MAIN = 'fitnessRecords'; // 体重などの主要記録
    const STORAGE_KEY_MEAL = 'mealRecords'; // 食事記録と金額
    const STORAGE_KEY_EXERCISE = 'exerciseRecords'; // 運動記録

    // === 初期設定 ===
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const formattedToday = `${year}-${month}-${day}`;

    // 各日付入力フィールドに今日の日付をデフォルトで設定
    dateInput.value = formattedToday;
    mealDateInput.value = formattedToday;
    exerciseDateInput.value = formattedToday;

    // === ヘッダータイトルと初期画面設定 ===
    const screens = {
        home: { element: homeScreen, title: 'Health Tracker' },
        food: { element: foodScreen, title: 'FOOD' },
        sport: { element: sportScreen, title: 'SPORT' },
        graph: { element: graphScreen, title: 'GRAPH' }
    };
    let currentScreen = 'home'; // 初期表示画面

    // === ユーティリティ関数 ===

    /**
     * ローカルストレージから記録を読み込む
     * @param {string} key - ローカルストレージのキー
     * @returns {Object} 日付をキーとする記録オブジェクト
     */
    const loadRecords = (key) => {
        const recordsJson = localStorage.getItem(key);
        return recordsJson ? JSON.parse(recordsJson) : {};
    };

    /**
     * ローカルストレージに記録を保存する
     * @param {string} key - ローカルストレージのキー
     * @param {Object} records - 保存する記録オブジェクト
     */
    const saveRecords = (key, records) => {
        localStorage.setItem(key, JSON.stringify(records));
    };

    /**
     * メッセージを表示する
     * @param {HTMLElement} element - メッセージを表示するDOM要素
     * @param {string} msg - 表示するメッセージ
     * @param {string} type - 'success', 'error', 'info' のいずれか
     */
    const showMessage = (element, msg, type) => {
        element.textContent = msg;
        element.className = `message ${type}`;
        setTimeout(() => {
            element.textContent = '';
            element.className = 'message';
        }, 3000);
    };

    // === 画面切り替え ===

    /**
     * 指定された画面を表示し、他の画面を非表示にする
     * @param {string} screenName - 表示する画面の名前 ('home', 'food', 'sport', 'graph')
     */
    const showScreen = (screenName) => {
        // すべての画面を非表示
        Object.values(screens).forEach(screen => {
            screen.element.classList.remove('active');
        });

        // 指定された画面を表示
        const targetScreen = screens[screenName];
        if (targetScreen) {
            targetScreen.element.classList.add('active');
            screenTitle.textContent = targetScreen.title; // ヘッダータイトルを更新
            currentScreen = screenName; // 現在の画面を更新
            // グラフ画面に切り替わったらグラフを更新
            if (screenName === 'graph') {
                updateChart();
            }
        }
        // サイドメニューとオーバーレイを閉じる
        sideMenu.classList.remove('active');
        overlay.classList.remove('active');

        // メニューアイテムのアクティブ状態を更新
        menuItems.forEach(item => {
            if (item.dataset.screen === screenName) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    };

    // === 主要記録（体重など）関連 ===

    /**
     * 主要記録一覧、最新記録サマリーをレンダリングする
     */
    const renderMainRecords = () => {
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
            updateChart(); // グラフも更新
            showMessage(messageElement, '主要記録を削除しました。', 'info');
        }
    };

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
        updateChart();
        showMessage(messageElement, '主要記録を保存しました！', 'success');

        weightInput.value = '';
        bodyFatInput.value = '';
        muscleMassInput.value = '';
        waistInput.value = '';
        dateInput.value = formattedToday;
    });

    // 全主要記録削除ボタンの処理
    clearAllRecordsButton.addEventListener('click', () => {
        if (confirm('全ての主要記録を削除してもよろしいですか？この操作は元に戻せません。')) {
            localStorage.removeItem(STORAGE_KEY_MAIN);
            renderMainRecords();
            updateChart();
            showMessage(messageElement, '全ての主要記録を削除しました。', 'info');
        }
    });

    // === 食事記録関連 ===

    /**
     * 食事記録一覧、日ごとの合計金額をレンダリングする
     */
    const renderMealRecords = () => {
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
            updateChart(); // グラフも更新
            renderMainRecords(); // HOME画面のテーブルも更新
            showMessage(mealMessageElement, '食事記録を削除しました。', 'info');
        }
    };

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
        updateChart();
        renderMainRecords(); // HOME画面のテーブルも更新
        showMessage(mealMessageElement, '食事記録を保存しました！', 'success');

        // フォームをクリア
        mealCostInput.value = '';
        mealPlanList.querySelectorAll('input[name="meal"]').forEach(checkbox => checkbox.checked = false);
        mealDateInput.value = formattedToday;
    });

    // 全食事記録削除ボタンの処理
    clearAllMealRecordsButton.addEventListener('click', () => {
        if (confirm('全ての食事記録を削除してもよろしいですか？この操作は元に戻せません。')) {
            localStorage.removeItem(STORAGE_KEY_MEAL);
            renderMealRecords();
            updateChart();
            renderMainRecords(); // HOME画面のテーブルも更新
            showMessage(mealMessageElement, '全ての食事記録を削除しました。', 'info');
        }
    });

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


    // === 運動記録関連 ===

    /**
     * 運動記録一覧をレンダリングする
     */
    const renderExerciseRecords = () => {
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
            renderMainRecords(); // HOME画面のテーブルも更新
            showMessage(exerciseMessageElement, '運動記録を削除しました。', 'info');
        }
    };

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
        renderMainRecords(); // HOME画面のテーブルも更新
        showMessage(exerciseMessageElement, '運動記録を保存しました！', 'success');

        // フォームをクリア
        exercisePlanList.querySelectorAll('input[name="exercise"]').forEach(checkbox => checkbox.checked = false);
        exerciseDateInput.value = formattedToday;
    });

    // 全運動記録削除ボタンの処理
    clearAllExerciseRecordsButton.addEventListener('click', () => {
        if (confirm('全ての運動記録を削除してもよろしいですか？この操作は元に戻せません。')) {
            localStorage.removeItem(STORAGE_KEY_EXERCISE);
            renderExerciseRecords();
            renderMainRecords(); // HOME画面のテーブルも更新
            showMessage(exerciseMessageElement, '全ての運動記録を削除しました。', 'info');
        }
    });

    // === グラフ関連 ===

    /**
     * グラフを初期化または更新する
     */
    const updateChart = () => {
        const mainRecords = loadRecords(STORAGE_KEY_MAIN);
        const mealRecords = loadRecords(STORAGE_KEY_MEAL); // 食事金額の取得元
        const allDates = Array.from(new Set([...Object.keys(mainRecords), ...Object.keys(mealRecords)]))
                              .sort((a, b) => new Date(a) - new Date(b)); // 全記録から日付を結合し昇順ソート

        const selectedType = chartTypeSelect.value;
        const selectedPeriod = chartPeriodSelect.value;

        let filteredDates = [];
        const today = new Date();

        if (selectedPeriod === 'all') {
            filteredDates = allDates;
        } else {
            let daysToSubtract;
            if (selectedPeriod === '7days') daysToSubtract = 7;
            else if (selectedPeriod === '30days') daysToSubtract = 30;
            else if (selectedPeriod === '90days') daysToSubtract = 90;

            const periodStartDate = new Date(today);
            periodStartDate.setDate(today.getDate() - daysToSubtract);
            periodStartDate.setHours(0, 0, 0, 0);

            filteredDates = allDates.filter(dateStr => {
                const recordDate = new Date(dateStr);
                recordDate.setHours(0, 0, 0, 0);
                return recordDate >= periodStartDate;
            });
        }
        
        const dataLabels = [];
        const dataValues = [];

        filteredDates.forEach(date => {
            let value = null;
            if (selectedType === 'mealCost') {
                const record = mealRecords[date];
                if (record && record.mealCost !== null && !isNaN(record.mealCost)) {
                    value = record.mealCost;
                }
            } else {
                const record = mainRecords[date];
                if (record && record[selectedType] !== null && !isNaN(record[selectedType])) {
                    value = record[selectedType];
                }
            }
            
            // データが存在する場合のみ追加
            if (value !== null) {
                dataLabels.push(date);
                dataValues.push(value);
            }
        });

        const ctx = document.getElementById('myChart').getContext('2d');
        const unit = getUnit(selectedType);
        const label = getLabel(selectedType);
        const chartColor = getChartColor(selectedType);

        if (myChart) {
            myChart.data.labels = dataLabels;
            myChart.data.datasets[0].data = dataValues;
            myChart.data.datasets[0].label = label;
            myChart.data.datasets[0].borderColor = chartColor;
            myChart.data.datasets[0].backgroundColor = getChartColor(selectedType, 0.2);
            myChart.options.scales.y.title.text = unit;
            myChart.options.scales.y.beginAtZero = selectedType === 'mealCost'; // 金額は0から開始
            myChart.options.plugins.tooltip.callbacks.label = function(context) {
                let label = context.dataset.label || '';
                if (label) {
                    label += ': ';
                }
                if (context.parsed.y !== null) {
                    let value = context.parsed.y.toFixed(selectedType === 'mealCost' ? 0 : 1);
                    label += value + ' ' + unit;
                }
                return label;
            };
            myChart.update();
        } else {
            myChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: dataLabels,
                    datasets: [{
                        label: label,
                        data: dataValues,
                        borderColor: chartColor,
                        backgroundColor: getChartColor(selectedType, 0.2),
                        tension: 0.3,
                        fill: true,
                        pointRadius: 5,
                        pointBackgroundColor: chartColor,
                        pointBorderColor: '#fff',
                        pointHoverRadius: 7,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top',
                            labels: {
                                font: {
                                    size: 14
                                },
                                color: '#636366'
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    let label = context.dataset.label || '';
                                    if (label) {
                                        label += ': ';
                                    }
                                    if (context.parsed.y !== null) {
                                        let value = context.parsed.y.toFixed(selectedType === 'mealCost' ? 0 : 1);
                                        label += value + ' ' + unit;
                                    }
                                    return label;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: '日付',
                                color: '#636366'
                            },
                            ticks: {
                                color: '#636366'
                            },
                            grid: {
                                color: '#e5e5ea'
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: unit,
                                color: '#636366'
                            },
                            ticks: {
                                color: '#636366'
                            },
                            grid: {
                                color: '#e5e5ea'
                            },
                            beginAtZero: selectedType === 'mealCost' // 金額は0から開始
                        }
                    }
                }
            });
        }

        if (dataLabels.length === 0) {
            noChartDataMessage.style.display = 'block';
            if (myChart) {
                myChart.destroy();
                myChart = null;
            }
        } else {
            noChartDataMessage.style.display = 'none';
        }
    };

    /**
     * 選択された項目に応じたラベルを返す
     * @param {string} type - 項目タイプ
     * @returns {string} 表示ラベル
     */
    const getLabel = (type) => {
        switch (type) {
            case 'weight': return '体重';
            case 'bodyFat': return '体脂肪率';
            case 'muscleMass': return '筋肉量';
            case 'waist': return 'ウエスト';
            case 'mealCost': return '食事金額';
            default: return '';
        }
    };

    /**
     * 選択された項目に応じた単位を返す
     * @param {string} type - 項目タイプ
     * @returns {string} 単位
     */
    const getUnit = (type) => {
        switch (type) {
            case 'weight':
            case 'muscleMass': return 'kg';
            case 'bodyFat': return '%';
            case 'waist': return 'cm';
            case 'mealCost': return '円';
            default: return '';
        }
    };

    /**
     * 選択された項目に応じたグラフの色を返す
     * @param {string} type - 項目タイプ
     * @param {number} alpha - 透明度 (0-1)
     * @returns {string} 色の文字列
     */
    const getChartColor = (type, alpha = 1) => {
        const colors = {
            weight: `rgba(0, 122, 255, ${alpha})`,      // primary-color (blue)
            bodyFat: `rgba(255, 149, 0, ${alpha})`,     // orange
            muscleMass: `rgba(52, 199, 89, ${alpha})`,  // secondary-color (green)
            waist: `rgba(88, 86, 214, ${alpha})`,       // purple
            mealCost: `rgba(255, 45, 85, ${alpha})`    // reddish-pink (for money)
        };
        return colors[type] || `rgba(0, 0, 0, ${alpha})`;
    };

    // === イベントリスナー ===

    // ハンバーガーメニューボタン
    menuButton.addEventListener('click', () => {
        sideMenu.classList.toggle('active');
        overlay.classList.toggle('active');
    });

    // オーバーレイクリックでメニューを閉じる
    overlay.addEventListener('click', () => {
        sideMenu.classList.remove('active');
        overlay.classList.remove('active');
    });

    // メニューアイテムクリック
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const screenName = e.target.dataset.screen;
            showScreen(screenName);
        });
    });

    // グラフ表示項目変更時のイベントリスナー
    chartTypeSelect.addEventListener('change', updateChart);
    chartPeriodSelect.addEventListener('change', updateChart);

    // === 初期レンダリングと画面表示 ===
    // 最初にHOME画面を表示
    showScreen('home');
    // 各記録をレンダリング
    renderMainRecords();
    renderMealRecords();
    renderExerciseRecords();
    // グラフの初期化はshowScreen('graph')が呼び出された時に行われる
});