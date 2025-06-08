// app.js

document.addEventListener('DOMContentLoaded', () => {
    // === DOM要素の取得（共通部分） ===
    const screenTitle = document.getElementById('screenTitle');
    const screens = document.querySelectorAll('.screen');
    const navItems = document.querySelectorAll('.nav-item'); // 下部ナビゲーションアイテム

    // === メッセージ表示要素 ===
    // すべてのメッセージ要素を一元的に管理
    const messageElements = {
        main: document.getElementById('message'),
        meal: document.getElementById('mealMessage'),
        exercise: document.getElementById('exerciseMessage'),
        graph: document.getElementById('graphMessage')
    };

    // === ローカルストレージのキー ===
    const STORAGE_KEY = 'fitnessRecords'; // 主要記録、食事、運動データを全てこの中に統合する


    // === ユーティリティ関数 ===

    /**
     * ローカルストレージから記録を読み込む
     * @returns {Array<Object>} 取得したデータ（存在しない場合は空の配列）。日付の新しい順にソート。
     */
    const loadRecords = () => {
        const records = localStorage.getItem(STORAGE_KEY);
        // ロード時に新しいプロパティの初期値を設定する
        const parsedRecords = records ? JSON.parse(records) : [];
        return parsedRecords.map(record => ({
            date: record.date,
            weight: record.weight !== undefined ? record.weight : null,
            bodyFat: record.bodyFat !== undefined ? record.bodyFat : null,
            muscleMass: record.muscleMass !== undefined ? record.muscleMass : null,
            waist: record.waist !== undefined ? record.waist : null,
            // mealDetailsオブジェクトの構造を保証
            mealDetails: record.mealDetails ? {
                types: record.mealDetails.types || [],
                planned: record.mealDetails.planned || '',
                actual: record.mealDetails.actual || '',
                status: record.mealDetails.status || '',
                nutrients: record.mealDetails.nutrients || { calories: null, protein: null, fat: null, sodium: null }
            } : null,
            exercise: record.exercise !== undefined ? record.exercise : null, // Array of strings
            mealCost: record.mealCost !== undefined ? record.mealCost : 0
        })).sort((a, b) => new Date(b.date) - new Date(a.date));
    };

    /**
     * 指定されたキーでデータをローカルストレージに保存する。
     * @param {Array<Object>} data - 保存するデータ。
     */
    const saveRecords = (data) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    };

    /**
     * メッセージを表示する。
     * @param {string} msg - 表示するメッセージ。
     * @param {string} type - 'success', 'error', 'info' のいずれか。
     * @param {HTMLElement} element - メッセージを表示するDOM要素。
     */
    const showMessage = (msg, type, element) => {
        element.textContent = msg;
        element.className = `app-message ${type}`; // クラス名を変更
        element.style.opacity = '1';
        element.style.display = 'block';

        setTimeout(() => {
            element.style.opacity = '0';
            element.addEventListener('transitionend', function handler() {
                element.style.display = 'none';
                element.removeEventListener('transitionend', handler);
                element.textContent = '';
                element.className = 'app-message'; // クラスをリセット
            });
        }, 2700);
    };

    /**
     * 日付文字列を 'YYYY年MM月DD日' 形式にフォーマットする。
     * @param {string} dateString - 'YYYY-MM-DD' 形式の日付文字列。
     * @returns {string} フォーマットされた日付文字列。
     */
    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('ja-JP', options);
    };

    // === 画面切り替えロジック ===
    /**
     * 指定された画面を表示し、他の画面を非表示にする
     * @param {string} screenName - 表示する画面の名前 ('home', 'food', 'sport', 'graph')
     */
    const showScreen = (screenName) => {
        screens.forEach(screen => {
            if (screen.id === `${screenName}Screen`) {
                screen.classList.add('active');
            } else {
                screen.classList.remove('active');
            }
        });

        // ヘッダータイトルを更新
        let titleText = 'Health Tracker';
        switch (screenName) {
            case 'home': titleText = 'HOME'; break;
            case 'food': titleText = 'FOOD'; break;
            case 'sport': titleText = 'SPORT'; break;
            case 'graph': titleText = 'GRAPH'; break;
        }
        screenTitle.textContent = titleText;

        // ナビゲーションアイテムのアクティブ状態を更新
        navItems.forEach(item => {
            if (item.dataset.screen === screenName) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // グラフ画面に切り替わったらグラフを更新
        if (screenName === 'graph') {
            updateChart();
        }
    };

    // === イベントリスナー（下部ナビゲーション） ===
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const screenName = e.currentTarget.dataset.screen; // currentTargetを使用
            showScreen(screenName);
        });
    });


    // === HOME画面関連 ===
    const trackerForm = document.getElementById('trackerForm');
    const dateInput = document.getElementById('date');
    const weightInput = document.getElementById('weight');
    const bodyFatInput = document.getElementById('bodyFat');
    const muscleMassInput = document.getElementById('muscleMass');
    const waistInput = document.getElementById('waist');
    const recordsTableBody = document.getElementById('recordsTableBody'); // querySelectorからgetElementById
    const clearAllRecordsButton = document.getElementById('clearAllRecords');
    const summaryDate = document.getElementById('summaryDate');
    const summaryWeight = document.getElementById('summaryWeight');
    const summaryBodyFat = document.getElementById('summaryBodyFat');
    const summaryMuscleMass = document.getElementById('summaryMuscleMass');
    const summaryWaist = document.getElementById('summaryWaist');
    const noLatestRecordMessage = document.getElementById('noLatestRecordMessage');
    const noTableRecordsMessage = document.getElementById('noTableRecordsMessage');

    // 初期設定
    dateInput.value = new Date().toISOString().split('T')[0];

    // フォーム送信ハンドラ
    trackerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const date = dateInput.value;
        const weight = parseFloat(weightInput.value);
        const bodyFat = bodyFatInput.value !== '' ? parseFloat(bodyFatInput.value) : null;
        const muscleMass = muscleMassInput.value !== '' ? parseFloat(muscleMassInput.value) : null;
        const waist = parseFloat(waistInput.value);

        if (!date || isNaN(weight) || isNaN(waist)) {
            showMessage('日付、体重、ウエストは必須項目です。', 'error', messageElements.main);
            return;
        }

        let records = loadRecords();
        const existingRecordIndex = records.findIndex(r => r.date === date);

        const newRecord = {
            date,
            weight,
            bodyFat,
            muscleMass,
            waist,
            mealDetails: null, // 初期値
            exercise: null,    // 初期値
            mealCost: 0        // 初期値
        };

        if (existingRecordIndex !== -1) {
            // 既存のレコードに新しいデータをマージ（mealDetails, exercise, mealCostは既存の値を保持）
            const existingRecord = records[existingRecordIndex];
            records[existingRecordIndex] = {
                ...newRecord,
                mealDetails: existingRecord.mealDetails,
                exercise: existingRecord.exercise,
                mealCost: existingRecord.mealCost
            };
            showMessage('記録を更新しました！', 'success', messageElements.main);
        } else {
            records.unshift(newRecord); // 新しい記録は先頭に追加し、その後ソート
            records.sort((a, b) => new Date(b.date) - new Date(a.date)); // 日付の新しい順にソート
            showMessage('記録を保存しました！', 'success', messageElements.main);
        }

        saveRecords(records);
        renderHomeRecords(); // HOME画面を再レンダリング
        updateChart(); // グラフを更新

        // フォームをクリア
        weightInput.value = '';
        bodyFatInput.value = '';
        muscleMassInput.value = '';
        waistInput.value = '';
        dateInput.value = new Date().toISOString().split('T')[0];
    });

    // 全主要記録削除ボタンの処理
    clearAllRecordsButton.addEventListener('click', () => {
        if (confirm('全ての記録を削除してもよろしいですか？この操作は元に戻せません。')) {
            localStorage.removeItem(STORAGE_KEY);
            renderHomeRecords();
            renderFoodRecords(); // 関連する画面も更新
            renderSportRecords(); // 関連する画面も更新
            updateChart(); // グラフも更新
            showMessage('全ての記録を削除しました。', 'info', messageElements.main);
        }
    });

    /**
     * HOME画面の記録一覧とサマリーをレンダリングする
     */
    const renderHomeRecords = () => {
        const records = loadRecords(); // loadRecordsはすでに日付でソート済み
        recordsTableBody.innerHTML = '';

        if (records.length === 0) {
            noTableRecordsMessage.style.display = 'block';
            clearAllRecordsButton.style.display = 'none';
        } else {
            noTableRecordsMessage.style.display = 'none';
            clearAllRecordsButton.style.display = 'block';
            records.forEach(record => {
                const row = recordsTableBody.insertRow();
                row.insertCell().textContent = formatDate(record.date);
                row.insertCell().textContent = record.weight ? record.weight.toFixed(1) : '-';
                row.insertCell().textContent = record.bodyFat !== null ? record.bodyFat.toFixed(1) : '-';
                row.insertCell().textContent = record.muscleMass !== null ? record.muscleMass.toFixed(1) : '-';
                row.insertCell().textContent = record.waist ? record.waist.toFixed(1) : '-';

                // 食事、運動、金額を簡潔に表示
                // 食事: actual があれば「済」、なければ「-」
                row.insertCell().textContent = record.mealDetails && record.mealDetails.actual && record.mealDetails.actual !== '未記録' ? '済' : '-';
                // 運動: 配列で存在し、要素があれば「済」、なければ「-」
                row.insertCell().textContent = record.exercise && record.exercise.length > 0 ? '済' : '-';
                row.insertCell().textContent = record.mealCost !== null ? record.mealCost.toLocaleString() : '-';

                const actionCell = row.insertCell();
                const deleteButton = document.createElement('button');
                deleteButton.textContent = '削除';
                deleteButton.classList.add('delete-button');
                deleteButton.addEventListener('click', () => {
                    if (confirm(`${formatDate(record.date)} の記録を本当に削除しますか？`)) {
                        let currentRecords = loadRecords().filter(r => r.date !== record.date);
                        saveRecords(currentRecords);
                        renderHomeRecords();
                        renderFoodRecords(); // 関連する画面も更新
                        renderSportRecords(); // 関連する画面も更新
                        updateChart();
                        showMessage('記録を削除しました。', 'info', messageElements.main);
                    }
                });
                actionCell.appendChild(deleteButton);
            });
        }

        // 最新記録サマリーのレンダリング
        if (records.length > 0) {
            const latestRecord = records[0];
            summaryDate.textContent = formatDate(latestRecord.date);
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


    // === FOOD画面関連 ===
    const mealInputForm = document.getElementById('mealInputForm');
    const mealDateInput = document.getElementById('mealDate');
    const mealTypeCheckboxes = document.querySelectorAll('input[name="mealType"]');
    const randomMealButton = document.getElementById('randomMealButton');
    const mealSuggestionArea = document.getElementById('mealSuggestionArea');
    const suggestedMealName = document.getElementById('suggestedMealName');
    const okMealButton = document.getElementById('okMealButton');
    const ngMealButton = document.getElementById('ngMealButton');
    const mealAchievementArea = document.getElementById('mealAchievementArea');
    const actualMealNameDisplay = document.getElementById('actualMealNameDisplay');
    const passMealButton = document.getElementById('passMealButton');
    const failMealButton = document.getElementById('failMealButton');
    const manualMealInput = document.getElementById('manualMealInput');
    const manualMealText = document.getElementById('manualMealText');
    const confirmManualMealButton = document.getElementById('confirmManualMealButton');
    const nutrientInputArea = document.getElementById('nutrientInputArea');
    const caloriesInput = document.getElementById('calories');
    const proteinInput = document.getElementById('protein');
    const fatInput = document.getElementById('fat');
    const sodiumInput = document.getElementById('sodium');
    const customNutrientFields = document.getElementById('customNutrientFields');
    const addCustomNutrientButton = document.getElementById('addCustomNutrientButton');
    const mealCostInput = document.getElementById('mealCostInput');
    const completeMealButton = document.getElementById('completeMealButton');
    const mealsTableBody = document.getElementById('mealsTableBody'); // querySelectorからgetElementById
    const clearAllMealRecordsButton = document.getElementById('clearAllMealRecords');
    const dailyCostSummaryDiv = document.getElementById('dailyCostSummary');
    const noDailyCostMessage = document.getElementById('noDailyCostMessage');
    const noMealTableRecordsMessage = document.getElementById('noMealTableRecordsMessage');


    // 食事プラン候補データ
    const mealPlans = {
        breakfast: ["トーストと目玉焼き", "オートミールとフルーツ", "和食（ご飯、味噌汁、納豆）", "プロテインスムージー", "スクランブルエッグと野菜"],
        lunch: ["鶏むね肉のサラダチキン", "玄米おにぎりと野菜スープ", "パスタ（トマトソース）", "魚定食", "サンドイッチとサラダ"],
        dinner: ["豆腐ハンバーグと温野菜", "鮭の塩焼きとご飯", "鶏肉と野菜の炒め物", "鍋物（野菜たっぷり）", "サラダチキンとブロッコリー"],
        snack: ["プロテインバー", "ヨーグルトとナッツ", "ゆで卵", "フルーツ（バナナ、リンゴなど）", "ドライフルーツ"]
    };

    let currentSuggestedMeal = null; // 現在提案中の食事

    // 初期化
    mealDateInput.value = new Date().toISOString().split('T')[0];

    // FOOD画面のイベントリスナー設定
    randomMealButton.addEventListener('click', generateRandomMealPlan);
    okMealButton.addEventListener('click', acceptSuggestedMeal);
    ngMealButton.addEventListener('click', rejectSuggestedMeal);
    passMealButton.addEventListener('click', handlePassMeal);
    failMealButton.addEventListener('click', handleFailMeal);
    confirmManualMealButton.addEventListener('click', handleConfirmManualMeal);
    addCustomNutrientButton.addEventListener('click', addCustomNutrientField);
    completeMealButton.addEventListener('click', completeMealRecord);
    clearAllMealRecordsButton.addEventListener('click', handleClearAllMealRecords);


    /**
     * ランダムな食事プランを生成し表示する
     */
    function generateRandomMealPlan() {
        const selectedMealTypes = Array.from(mealTypeCheckboxes)
                                       .filter(cb => cb.checked)
                                       .map(cb => cb.value);

        if (selectedMealTypes.length === 0) {
            showMessage('食事タイプを一つ以上選択してください。', 'error', messageElements.meal);
            return;
        }

        const availableMeals = selectedMealTypes.flatMap(type => mealPlans[type] || []);
        if (availableMeals.length === 0) {
            showMessage('選択された食事タイプに利用可能なプランがありません。', 'error', messageElements.meal);
            return;
        }

        const randomIndex = Math.floor(Math.random() * availableMeals.length);
        currentSuggestedMeal = availableMeals[randomIndex];
        suggestedMealName.textContent = currentSuggestedMeal;
        mealSuggestionArea.classList.remove('hidden-section');
        mealAchievementArea.classList.add('hidden-section'); // 非表示
        nutrientInputArea.classList.add('hidden-section'); // 非表示
        manualMealInput.classList.add('hidden-section'); // 手動入力欄も非表示
        showMessage('食事プランを提案しました。', 'info', messageElements.meal);
    }

    /**
     * 提案された食事プランを承認する
     */
    function acceptSuggestedMeal() {
        if (!currentSuggestedMeal) return;
        actualMealNameDisplay.textContent = currentSuggestedMeal;
        mealAchievementArea.classList.remove('hidden-section');
        mealSuggestionArea.classList.add('hidden-section'); // 提案エリアを非表示
        manualMealInput.classList.add('hidden-section'); // 手動入力欄も非表示
        showMessage('プランが承認されました。', 'info', messageElements.meal);
    }

    /**
     * 提案された食事プランを拒否する（再提案）
     */
    function rejectSuggestedMeal() {
        generateRandomMealPlan(); // 再度ランダム提案
    }

    /**
     * 食事をPASSとして記録する
     */
    function handlePassMeal() {
        nutrientInputArea.classList.remove('hidden-section');
        mealAchievementArea.classList.add('hidden-section'); // 達成エリアを非表示
        showMessage('栄養素を入力してください。', 'info', messageElements.meal);
    }

    /**
     * 食事をFAILとして手動入力を促す
     */
    function handleFailMeal() {
        manualMealInput.classList.remove('hidden-section');
        actualMealNameDisplay.textContent = ''; // 表示をクリア
        showMessage('実際に食べたものを入力してください。', 'info', messageElements.meal);
    }

    /**
     * 手動入力された食事を確定する
     */
    function handleConfirmManualMeal() {
        const manuallyEnteredMeal = manualMealText.value.trim();
        if (manuallyEnteredMeal === '') {
            showMessage('実際に食べたものを入力してください。', 'error', messageElements.meal);
            return;
        }
        currentSuggestedMeal = manuallyEnteredMeal; // 提案された食事として扱い、栄養素入力へ
        actualMealNameDisplay.textContent = manuallyEnteredMeal;
        nutrientInputArea.classList.remove('hidden-section');
        manualMealInput.classList.add('hidden-section'); // 手動入力欄を非表示
        mealAchievementArea.classList.add('hidden-section'); // 達成エリアを非表示
        showMessage('手動入力が確定されました。', 'info', messageElements.meal);
    }

    /**
     * カスタム栄養素の入力フィールドを追加する
     */
    function addCustomNutrientField() {
        const wrapper = document.createElement('div');
        wrapper.classList.add('input-group', 'custom-nutrient-group'); // input-groupクラスを使用

        const label = document.createElement('label');
        label.textContent = '項目名:';
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.placeholder = '例: 食物繊維';
        nameInput.classList.add('custom-nutrient-name');

        const valueLabel = document.createElement('label');
        valueLabel.textContent = '値:';
        const valueInput = document.createElement('input');
        valueInput.type = 'number';
        valueInput.step = '0.1';
        valueInput.placeholder = '例: 10.5';
        valueInput.classList.add('custom-nutrient-value');

        const removeButton = document.createElement('button');
        removeButton.textContent = '削除';
        removeButton.classList.add('button', 'danger-button', 'remove-custom-nutrient');
        removeButton.style.width = 'auto'; // ボタンの幅を自動に
        removeButton.addEventListener('click', () => {
            wrapper.remove();
        });

        wrapper.appendChild(label);
        wrapper.appendChild(nameInput);
        wrapper.appendChild(valueLabel);
        wrapper.appendChild(valueInput);
        wrapper.appendChild(removeButton);
        customNutrientFields.appendChild(wrapper);
    }

    /**
     * 食事記録を完了し、保存する
     */
    function completeMealRecord() {
        const date = mealDateInput.value;
        const selectedMealTypes = Array.from(mealTypeCheckboxes)
                                       .filter(cb => cb.checked)
                                       .map(cb => cb.value); // 選択された食事タイプ

        const plannedMeal = currentSuggestedMeal || '未提案'; // 提案がなければ「未提案」
        const actualMeal = actualMealNameDisplay.textContent || '未記録'; // 実際に食べたもの

        const calories = caloriesInput.value !== '' ? parseFloat(caloriesInput.value) : null;
        const protein = proteinInput.value !== '' ? parseFloat(proteinInput.value) : null;
        const fat = fatInput.value !== '' ? parseFloat(fatInput.value) : null;
        const sodium = sodiumInput.value !== '' ? parseFloat(sodiumInput.value) : null;
        const mealCost = mealCostInput.value !== '' ? parseInt(mealCostInput.value) : 0;

        const nutrients = {
            calories,
            protein,
            fat,
            sodium
        };

        // カスタム栄養素を収集
        document.querySelectorAll('.custom-nutrient-group').forEach(group => {
            const nameInput = group.querySelector('.custom-nutrient-name');
            const valueInput = group.querySelector('.custom-nutrient-value');
            if (nameInput && nameInput.value.trim() !== '' && valueInput && valueInput.value.trim() !== '' && !isNaN(parseFloat(valueInput.value))) {
                nutrients[nameInput.value.trim()] = parseFloat(valueInput.value);
            }
        });

        // mainRecordsから該当日のレコードを取得または作成
        let records = loadRecords();
        let targetRecordIndex = records.findIndex(r => r.date === date);
        let targetRecord;

        if (targetRecordIndex !== -1) {
            targetRecord = records[targetRecordIndex];
        } else {
            // 該当日の主要記録がない場合は新規作成（体重等はnullで初期化）
            targetRecord = {
                date: date,
                weight: null, bodyFat: null, muscleMass: null, waist: null,
                mealDetails: null, exercise: null, mealCost: 0
            };
            records.unshift(targetRecord); // 先頭に追加して日付ソートを維持
            records.sort((a, b) => new Date(b.date) - new Date(a.date)); // 日付の新しい順にソート
        }

        // 食事詳細を更新
        targetRecord.mealDetails = {
            types: selectedMealTypes, // 選択された食事タイプも保存
            planned: plannedMeal,
            actual: actualMeal,
            status: (actualMeal === plannedMeal && actualMeal !== '未記録' && plannedMeal !== '未提案') ? 'PASS' : 'FAIL', // PASS or FAIL
            nutrients: nutrients
        };
        targetRecord.mealCost = mealCost;

        saveRecords(records);
        showMessage('食事記録を完了しました！', 'success', messageElements.meal);
        renderFoodRecords(); // 食事記録画面を更新
        renderHomeRecords(); // HOME画面のテーブルも更新
        updateChart(); // グラフを更新

        // フォームをリセットし、初期状態に戻す
        mealInputForm.reset();
        mealDateInput.value = new Date().toISOString().split('T')[0];
        mealTypeCheckboxes.forEach(cb => cb.checked = false);
        mealSuggestionArea.classList.add('hidden-section');
        mealAchievementArea.classList.add('hidden-section');
        nutrientInputArea.classList.add('hidden-section');
        manualMealInput.classList.add('hidden-section');
        customNutrientFields.innerHTML = ''; // カスタムフィールドをクリア
        currentSuggestedMeal = null;
    }

    /**
     * FOOD画面の食事記録一覧、日ごとの合計金額をレンダリングする
     */
    const renderFoodRecords = () => {
        const records = loadRecords(); // 日付でソート済み

        mealsTableBody.innerHTML = '';
        const mealRecordsForTable = records.filter(r => r.mealDetails !== null && r.mealDetails.actual !== null);

        if (mealRecordsForTable.length === 0) {
            noMealTableRecordsMessage.style.display = 'block';
            clearAllMealRecordsButton.style.display = 'none';
        } else {
            noMealTableRecordsMessage.style.display = 'none';
            clearAllMealRecordsButton.style.display = 'block';

            mealRecordsForTable.forEach(record => {
                const row = mealsTableBody.insertRow();
                row.insertCell().textContent = formatDate(record.date);
                row.insertCell().textContent = record.mealDetails.types.join(', '); // 食事タイプ
                row.insertCell().textContent = record.mealDetails.planned || '-';
                row.insertCell().textContent = record.mealDetails.actual || '-';
                row.insertCell().textContent = record.mealDetails.nutrients.calories !== null ? record.mealDetails.nutrients.calories.toFixed(0) : '-';
                row.insertCell().textContent = record.mealDetails.nutrients.protein !== null ? record.mealDetails.nutrients.protein.toFixed(1) : '-';
                row.insertCell().textContent = record.mealDetails.nutrients.fat !== null ? record.mealDetails.nutrients.fat.toFixed(1) : '-';
                row.insertCell().textContent = record.mealDetails.nutrients.sodium !== null ? record.mealDetails.nutrients.sodium.toFixed(0) : '-';
                row.insertCell().textContent = record.mealCost !== null ? record.mealCost.toLocaleString() : '-';

                const actionCell = row.insertCell();
                const deleteButton = document.createElement('button');
                deleteButton.textContent = '削除';
                deleteButton.classList.add('delete-button');
                deleteButton.addEventListener('click', () => {
                    if (confirm(`${formatDate(record.date)} の食事記録を本当に削除してもよろしいですか？`)) {
                        let currentRecords = loadRecords();
                        const targetRecord = currentRecords.find(r => r.date === record.date);
                        if (targetRecord) {
                            targetRecord.mealDetails = null; // 食事詳細をリセット
                            targetRecord.mealCost = 0; // 食事金額もリセット
                            saveRecords(currentRecords);
                            renderFoodRecords();
                            renderHomeRecords(); // HOME画面も更新
                            updateChart(); // グラフも更新
                            showMessage('食事記録を削除しました。', 'info', messageElements.meal);
                        }
                    }
                });
                actionCell.appendChild(deleteButton);
            });
        }
        renderDailyMealCostSummary();
    };

    /**
     * 日ごとの食事合計金額をレンダリングする
     */
    const renderDailyMealCostSummary = () => {
        const records = loadRecords();
        dailyCostSummaryDiv.innerHTML = '';
        const dailyCosts = {};

        records.forEach(record => {
            if (record.mealCost && !isNaN(record.mealCost)) {
                dailyCosts[record.date] = (dailyCosts[record.date] || 0) + record.mealCost;
            }
        });

        const dates = Object.keys(dailyCosts).sort((a, b) => new Date(b) - new Date(a));

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

    // 全食事記録削除ハンドラ
    const handleClearAllMealRecords = () => {
        if (confirm('全ての食事記録を削除してもよろしいですか？この操作は取り消せません。')) {
            let records = loadRecords();
            records.forEach(record => {
                record.mealDetails = null; // 食事詳細をリセット
                record.mealCost = 0; // 食事金額もリセット
            });
            saveRecords(records);
            renderFoodRecords();
            renderHomeRecords(); // HOME画面も更新
            updateChart(); // グラフも更新
            showMessage('全ての食事記録を削除しました。', 'info', messageElements.meal);
        }
    };


    // === SPORT画面関連 ===
    const exerciseTrackerForm = document.getElementById('exerciseTrackerForm');
    const exerciseDateInput = document.getElementById('exerciseDate');
    const exercisePlanList = document.getElementById('exercisePlanList');
    const exercisesTableBody = document.getElementById('exercisesTableBody'); // querySelectorからgetElementById
    const clearAllExerciseRecordsButton = document.getElementById('clearAllExerciseRecords');
    const noExerciseTableRecordsMessage = document.getElementById('noExerciseTableRecordsMessage');

    // 初期設定
    exerciseDateInput.value = new Date().toISOString().split('T')[0];

    // フォーム送信ハンドラ
    exerciseTrackerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const date = exerciseDateInput.value;
        const selectedExercises = Array.from(exercisePlanList.querySelectorAll('input[name="exercise"]:checked'))
                                   .map(checkbox => checkbox.value);

        if (!date) {
            showMessage('日付は必須項目です。', 'error', messageElements.exercise);
            return;
        }

        let records = loadRecords();
        let targetRecordIndex = records.findIndex(r => r.date === date);
        let targetRecord;

        if (targetRecordIndex !== -1) {
            targetRecord = records[targetRecordIndex];
        } else {
            targetRecord = {
                date: date,
                weight: null, bodyFat: null, muscleMass: null, waist: null,
                mealDetails: null, // 初期値
                exercise: null, // 初期値
                mealCost: 0 // 初期値
            };
            records.unshift(targetRecord);
            records.sort((a, b) => new Date(b.date) - new Date(a.date)); // 日付の新しい順にソート
        }

        targetRecord.exercise = selectedExercises;
        saveRecords(records);
        showMessage('運動記録を保存しました！', 'success', messageElements.exercise);
        renderSportRecords(); // SPORT画面を更新
        renderHomeRecords(); // HOME画面のテーブルも更新
    });

    // 全運動記録削除ボタンの処理
    clearAllExerciseRecordsButton.addEventListener('click', () => {
        if (confirm('全ての運動記録を削除してもよろしいですか？この操作は元に戻せません。')) {
            let records = loadRecords();
            records.forEach(record => {
                record.exercise = null;
            });
            saveRecords(records);
            renderSportRecords();
            renderHomeRecords(); // HOME画面も更新
            showMessage('全ての運動記録を削除しました。', 'info', messageElements.exercise);
        }
    });

    /**
     * SPORT画面の運動記録一覧をレンダリングする
     */
    const renderSportRecords = () => {
        const records = loadRecords(); // 日付でソート済み
        exercisesTableBody.innerHTML = '';
        const sportRecordsForTable = records.filter(r => r.exercise !== null && r.exercise.length > 0);

        if (sportRecordsForTable.length === 0) {
            noExerciseTableRecordsMessage.style.display = 'block';
            clearAllExerciseRecordsButton.style.display = 'none';
        } else {
            noExerciseTableRecordsMessage.style.display = 'none';
            clearAllExerciseRecordsButton.style.display = 'block';
            sportRecordsForTable.forEach(record => {
                const row = exercisesTableBody.insertRow();
                row.insertCell().textContent = formatDate(record.date);
                row.insertCell().textContent = record.exercise.join(', ');

                const actionCell = row.insertCell();
                const deleteButton = document.createElement('button');
                deleteButton.textContent = '削除';
                deleteButton.classList.add('delete-button');
                deleteButton.addEventListener('click', () => {
                    if (confirm(`${formatDate(record.date)} の運動記録を本当に削除しますか？`)) {
                        let currentRecords = loadRecords();
                        const targetRecord = currentRecords.find(r => r.date === record.date);
                        if (targetRecord) {
                            targetRecord.exercise = null;
                            saveRecords(currentRecords);
                            renderSportRecords();
                            renderHomeRecords(); // HOME画面も更新
                            showMessage('運動記録を削除しました。', 'info', messageElements.exercise);
                        }
                    }
                });
                actionCell.appendChild(deleteButton);
            });
        }
    };


    // === GRAPH画面関連 ===
    const chartTypeSelect = document.getElementById('chartType');
    const chartPeriodSelect = document.getElementById('chartPeriod');
    const myChartCanvas = document.getElementById('myChart');
    const noChartDataMessageGraph = document.getElementById('noChartDataMessage'); // GRAPH画面専用のメッセージ

    let myChart;

    // イベントリスナー
    chartTypeSelect.addEventListener('change', updateChart);
    chartPeriodSelect.addEventListener('change', updateChart);


    /**
     * グラフを初期化または更新する
     */
    const updateChart = () => {
        const records = loadRecords(); // 日付でソート済み
        const selectedType = chartTypeSelect.value;
        const selectedPeriod = chartPeriodSelect.value;

        let filteredRecords = records;
        if (selectedPeriod !== 'all') {
            const today = new Date();
            const cutoffDate = new Date();
            if (selectedPeriod === '7days') cutoffDate.setDate(today.getDate() - 7);
            else if (selectedPeriod === '30days') cutoffDate.setDate(today.getDate() - 30);
            else if (selectedPeriod === '90days') cutoffDate.setDate(today.getDate() - 90);
            
            cutoffDate.setHours(0, 0, 0, 0); // 時刻を無視して日付のみで比較

            // 古い日付から新しい日付の順に並べる
            filteredRecords = records.filter(record => new Date(record.date) >= cutoffDate).sort((a, b) => new Date(a.date) - new Date(b.date));
        } else {
             // 全期間の場合も古い日付から新しい日付の順に並べる
            filteredRecords = records.sort((a, b) => new Date(a.date) - new Date(b.date));
        }


        const dataLabels = [];
        const dataValues = [];

        filteredRecords.forEach(record => {
            let value = null;
            if (selectedType === 'mealCost') {
                value = record.mealCost;
            } else if (record[selectedType] !== undefined) { // mealCost以外は直接プロパティを参照
                 value = record[selectedType];
            }
            
            // データが存在し、かつ数値であることを確認
            if (value !== null && typeof value === 'number' && !isNaN(value)) {
                dataLabels.push(formatDate(record.date)); // フォーマットされた日付をラベルに
                dataValues.push(value);
            }
        });

        // グラフ表示のためのデータがない場合のメッセージ表示
        if (dataLabels.length === 0) {
            noChartDataMessageGraph.style.display = 'block';
            if (myChart) {
                myChart.destroy();
                myChart = null;
            }
            return;
        } else {
            noChartDataMessageGraph.style.display = 'none';
        }

        const ctx = myChartCanvas.getContext('2d');
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
                        backgroundColor: getChartColor(selectedType, 0.2), // 薄い背景色
                        tension: 0.3, // 線の滑らかさ
                        fill: true, // グラフ下の塗りつぶし
                        pointRadius: 5,
                        pointBackgroundColor: chartColor,
                        pointBorderColor: '#fff',
                        pointHoverRadius: 7,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false, // カード内の幅に合わせて調整
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
            weight: `rgba(66, 133, 244, ${alpha})`,      // Google Blue
            bodyFat: `rgba(251, 188, 4, ${alpha})`,     // Google Yellow
            muscleMass: `rgba(52, 168, 83, ${alpha})`,  // Google Green
            waist: `rgba(234, 67, 53, ${alpha})`,       // Google Red
            mealCost: `rgba(139, 93, 203, ${alpha})`    // Google Purple (custom)
        };
        return colors[type] || `rgba(0, 0, 0, ${alpha})`;
    };


    // === 初期レンダリングと画面表示 ===
    // 最初にHOME画面を表示し、各画面をレンダリング
    showScreen('home'); // HOME画面をアクティブにする
    renderHomeRecords();
    renderFoodRecords();
    renderSportRecords();
    updateChart(); // グラフを初期描画
});
