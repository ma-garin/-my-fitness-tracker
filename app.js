// app.js

document.addEventListener('DOMContentLoaded', () => {
    // DOM要素の取得
    const trackerForm = document.getElementById('trackerForm');
    const dateInput = document.getElementById('date');
    const weightInput = document.getElementById('weight');
    const bodyFatInput = document.getElementById('bodyFat');
    const muscleMassInput = document.getElementById('muscleMass');
    const waistInput = document.getElementById('waist');
    const recordsTableBody = document.querySelector('#recordsTable tbody');
    const messageElement = document.getElementById('message');
    const clearAllRecordsButton = document.getElementById('clearAllRecords');

    // 最新記録サマリーのDOM要素
    const summaryDate = document.getElementById('summaryDate');
    const summaryWeight = document.getElementById('summaryWeight');
    const summaryBodyFat = document.getElementById('summaryBodyFat');
    const summaryMuscleMass = document.getElementById('summaryMuscleMass');
    const summaryWaist = document.getElementById('summaryWaist');
    const noLatestRecordMessage = document.getElementById('noLatestRecordMessage');
    const noTableRecordsMessage = document.getElementById('noTableRecordsMessage');
    const noChartDataMessage = document.getElementById('noChartDataMessage');

    // Chart.js関連
    const chartTypeSelect = document.getElementById('chartType');
    const chartPeriodSelect = document.getElementById('chartPeriod');
    let myChart; // Chartインスタンスを保持する変数

    // ローカルストレージのキー
    const STORAGE_KEY = 'fitnessRecords';

    // 今日の日付をデフォルトで設定
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    dateInput.value = `${year}-${month}-${day}`;

    /**
     * ローカルストレージから記録を読み込む
     * @returns {Object} 日付をキーとする記録オブジェクト
     */
    const loadRecords = () => {
        const recordsJson = localStorage.getItem(STORAGE_KEY);
        return recordsJson ? JSON.parse(recordsJson) : {};
    };

    /**
     * ローカルストレージに記録を保存する
     * @param {Object} records - 保存する記録オブジェクト
     */
    const saveRecords = (records) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    };

    /**
     * 記録一覧、最新記録サマリー、グラフを全てレンダリングする
     */
    const renderAll = () => {
        const records = loadRecords();
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
                const row = recordsTableBody.insertCell();
                row.textContent = date;
                row.textContent = record.weight ? record.weight.toFixed(1) : '-';
                row.textContent = record.bodyFat !== null ? record.bodyFat.toFixed(1) : '-';
                row.textContent = record.muscleMass !== null ? record.muscleMass.toFixed(1) : '-';
                row.textContent = record.waist ? record.waist.toFixed(1) : '-';

                const actionCell = row.insertCell();
                const deleteButton = document.createElement('button');
                deleteButton.textContent = '削除';
                deleteButton.classList.add('delete-button');
                deleteButton.addEventListener('click', () => {
                    deleteRecord(date);
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

        // グラフのレンダリング
        updateChart();
    };

    /**
     * 個別の記録を削除する
     * @param {string} dateToDelete - 削除する日付
     */
    const deleteRecord = (dateToDelete) => {
        if (confirm(`${dateToDelete} の記録を本当に削除しますか？`)) {
            const records = loadRecords();
            delete records[dateToDelete];
            saveRecords(records);
            renderAll(); // 全てを再レンダリング
            showMessage('記録を削除しました。', 'info');
        }
    };

    /**
     * フォーム送信時の処理
     */
    trackerForm.addEventListener('submit', (e) => {
        e.preventDefault(); // フォームのデフォルト送信を防止

        const date = dateInput.value;
        const weight = parseFloat(weightInput.value);
        const bodyFat = bodyFatInput.value !== '' ? parseFloat(bodyFatInput.value) : null;
        const muscleMass = muscleMassInput.value !== '' ? parseFloat(muscleMassInput.value) : null;
        const waist = parseFloat(waistInput.value);

        // 必須項目チェック
        if (!date || isNaN(weight) || isNaN(waist)) {
            showMessage('日付、体重、ウエストは必須項目です。正しく入力してください。', 'error');
            return;
        }

        const records = loadRecords();

        records[date] = {
            weight,
            bodyFat,
            muscleMass,
            waist
            // 食事、運動、金額はここでは扱わない
        };

        saveRecords(records);
        renderAll(); // 全てを再レンダリング
        showMessage('記録しました！', 'success');

        // フォームをクリア（日付は今日の日付に戻す）
        weightInput.value = '';
        bodyFatInput.value = '';
        muscleMassInput.value = '';
        waistInput.value = '';
        dateInput.value = `${year}-${month}-${day}`;
    });

    /**
     * メッセージを表示する
     * @param {string} msg - 表示するメッセージ
     * @param {string} type - 'success', 'error', 'info' のいずれか
     */
    const showMessage = (msg, type) => {
        messageElement.textContent = msg;
        messageElement.className = `message ${type}`;
        // メッセージを少し遅れて非表示にする
        setTimeout(() => {
            messageElement.textContent = '';
            messageElement.className = 'message';
        }, 3000);
    };

    /**
     * 全記録削除ボタンの処理
     */
    clearAllRecordsButton.addEventListener('click', () => {
        if (confirm('全ての記録を削除してもよろしいですか？この操作は元に戻せません。')) {
            localStorage.removeItem(STORAGE_KEY);
            renderAll(); // 全てを再レンダリング
            showMessage('全ての記録を削除しました。', 'info');
        }
    });

    /**
     * グラフを初期化または更新する
     */
    const updateChart = () => {
        const records = loadRecords();
        const allDates = Object.keys(records).sort((a, b) => new Date(a) - new Date(b)); // 日付で昇順ソート (グラフ用)
        const selectedType = chartTypeSelect.value;
        const selectedPeriod = chartPeriodSelect.value; // 選択された期間

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
            periodStartDate.setHours(0, 0, 0, 0); // 日付のみ比較するため時間をリセット

            filteredDates = allDates.filter(dateStr => {
                const recordDate = new Date(dateStr);
                recordDate.setHours(0, 0, 0, 0);
                return recordDate >= periodStartDate;
            });
        }
        
        // フィルターされた日付の中から、有効なデータを持つものだけを抽出
        const dataLabels = [];
        const dataValues = [];

        filteredDates.forEach(date => {
            const record = records[date];
            // データが存在し、かつ数値であることを確認
            if (record[selectedType] !== null && typeof record[selectedType] === 'number' && !isNaN(record[selectedType])) {
                dataLabels.push(date);
                dataValues.push(record[selectedType]);
            }
        });

        const ctx = document.getElementById('myChart').getContext('2d');
        const unit = getUnit(selectedType);
        const label = getLabel(selectedType);
        const chartColor = getChartColor(selectedType);

        // グラフ表示のためのデータがない場合のメッセージ表示
        if (dataLabels.length === 0) {
            noChartDataMessage.style.display = 'block';
            if (myChart) {
                myChart.destroy(); // 既存のグラフがあれば破棄
                myChart = null;
            }
            return; // データがないのでグラフの描画はしない
        } else {
            noChartDataMessage.style.display = 'none';
        }

        if (myChart) {
            myChart.data.labels = dataLabels;
            myChart.data.datasets[0].data = dataValues;
            myChart.data.datasets[0].label = label;
            myChart.data.datasets[0].borderColor = chartColor;
            myChart.data.datasets[0].backgroundColor = getChartColor(selectedType, 0.2);
            myChart.options.scales.y.title.text = unit;
            myChart.options.scales.y.beginAtZero = false; // 体重などは0から始まらないことが多い
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
                                color: '#636366' // secondary-text-color
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
                                        let value = context.parsed.y.toFixed(1);
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
                                color: '#636366' // secondary-text-color
                            },
                            ticks: {
                                color: '#636366'
                            },
                            grid: {
                                color: '#e5e5ea' // border-color
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: unit,
                                color: '#636366' // secondary-text-color
                            },
                            ticks: {
                                color: '#636366'
                            },
                            grid: {
                                color: '#e5e5ea' // border-color
                            },
                            beginAtZero: false // 体重などは0から始まらないことが多い
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
            waist: `rgba(88, 86, 214, ${alpha})`       // purple
        };
        return colors[type] || `rgba(0, 0, 0, ${alpha})`;
    };

    // グラフ表示項目変更時のイベントリスナー
    chartTypeSelect.addEventListener('change', updateChart);
    chartPeriodSelect.addEventListener('change', updateChart);

    // 初期表示時に全てをレンダリング
    renderAll();
});
