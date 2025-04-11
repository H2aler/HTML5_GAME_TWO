class StockSimulator {
    constructor() {
        this.initialCash = 1000000;
        this.cash = this.initialCash;
        this.holdings = 0;
        this.currentPrice = 50000;
        this.priceHistory = [this.currentPrice];
        this.chart = null;
        this.gameInterval = null;
        this.timeLeft = 300; // 5분
        this.isGameRunning = false;
        this.difficulty = 'normal';
        this.volatility = 0.02;
        this.trendStrength = 0.5;
        this.trend = 0;
        
        this.loadLeaderboard();
        this.initializeChart();
        this.setupEventListeners();
        this.showTutorial();
    }

    loadLeaderboard() {
        const savedScores = localStorage.getItem('stockGameScores');
        this.leaderboard = savedScores ? JSON.parse(savedScores) : [];
        this.updateLeaderboard();
    }

    saveScore(playerName) {
        const totalAssets = this.cash + (this.holdings * this.currentPrice);
        const profitRate = ((totalAssets - this.initialCash) / this.initialCash * 100).toFixed(2);
        const gameTime = new Date().toISOString();
        
        const score = {
            name: playerName,
            score: totalAssets,
            profitRate: profitRate,
            difficulty: this.difficulty,
            time: gameTime
        };
        
        this.leaderboard.push(score);
        this.leaderboard.sort((a, b) => b.score - a.score);
        this.leaderboard = this.leaderboard.slice(0, 10); // 상위 10개만 유지
        
        localStorage.setItem('stockGameScores', JSON.stringify(this.leaderboard));
        this.updateLeaderboard();
    }

    updateLeaderboard() {
        const rankingsDiv = document.getElementById('rankings');
        rankingsDiv.innerHTML = this.leaderboard.map((score, index) => `
            <div class="ranking-item">
                <span>${index + 1}위</span>
                <span>${score.name}</span>
                <span>${this.formatNumber(score.score)}원 (${score.profitRate}%)</span>
                <span class="difficulty-badge ${score.difficulty}">${score.difficulty === 'easy' ? '쉬움' : score.difficulty === 'normal' ? '보통' : '어려움'}</span>
                <span class="time">${new Date(score.time).toLocaleString()}</span>
            </div>
        `).join('');
    }

    showTutorial() {
        document.getElementById('tutorial').classList.remove('hidden');
    }

    initializeChart() {
        const ctx = document.getElementById('stockChart').getContext('2d');
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['0'],
                datasets: [{
                    label: '주가',
                    data: this.priceHistory,
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1,
                    fill: false,
                    pointRadius: 0,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                animation: {
                    duration: 0
                },
                elements: {
                    line: {
                        tension: 0.1
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        grid: {
                            display: true,
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    setupEventListeners() {
        document.getElementById('buy-btn').addEventListener('click', () => this.buy());
        document.getElementById('sell-btn').addEventListener('click', () => this.sell());
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('tutorial-close').addEventListener('click', () => {
            document.getElementById('tutorial').classList.add('hidden');
        });
        document.getElementById('difficulty').addEventListener('change', (e) => {
            this.difficulty = e.target.value;
            this.updateDifficultySettings();
        });
        document.getElementById('save-score').addEventListener('click', () => {
            const playerName = document.getElementById('player-name').value.trim();
            if (playerName) {
                this.saveScore(playerName);
                document.getElementById('game-over').classList.add('hidden');
                document.getElementById('leaderboard').classList.remove('hidden');
            }
        });
        document.getElementById('restart-btn').addEventListener('click', () => {
            document.getElementById('game-over').classList.add('hidden');
            this.resetGame();
        });
    }

    updateDifficultySettings() {
        switch (this.difficulty) {
            case 'easy':
                this.volatility = 0.015;
                this.trendStrength = 0.3;
                this.updateInterval = 1000; // 1초
                break;
            case 'normal':
                this.volatility = 0.02;
                this.trendStrength = 0.5;
                this.updateInterval = 1000; // 1초
                break;
            case 'hard':
                this.volatility = 0.03;
                this.trendStrength = 0.7;
                this.updateInterval = 400; // 0.4초
                break;
        }
    }

    startGame() {
        if (this.isGameRunning) return;
        
        this.resetGame();
        this.isGameRunning = true;
        document.getElementById('start-btn').disabled = true;
        document.getElementById('buy-btn').disabled = false;
        document.getElementById('sell-btn').disabled = false;
        document.getElementById('difficulty').disabled = true;
        document.getElementById('timer').classList.remove('hidden');
        
        this.gameInterval = setInterval(() => {
            this.updatePrice();
            this.updateTimer();
        }, this.updateInterval);
    }

    resetGame() {
        this.cash = this.initialCash;
        this.holdings = 0;
        this.currentPrice = 50000;
        this.priceHistory = [this.currentPrice];
        this.timeLeft = 300;
        this.trend = 0;
        this.updateChart();
        this.updateUI();
        
        document.getElementById('start-btn').disabled = false;
        document.getElementById('buy-btn').disabled = true;
        document.getElementById('sell-btn').disabled = true;
        document.getElementById('difficulty').disabled = false;
        document.getElementById('timer').classList.add('hidden');
    }

    updateTimer() {
        this.timeLeft--;
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        document.getElementById('timer').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        if (this.timeLeft <= 0) {
            this.endGame();
        }
    }

    endGame() {
        clearInterval(this.gameInterval);
        this.isGameRunning = false;
        
        const totalAssets = this.cash + (this.holdings * this.currentPrice);
        const profitRate = ((totalAssets - this.initialCash) / this.initialCash * 100).toFixed(2);
        
        document.getElementById('final-assets').textContent = this.formatNumber(totalAssets);
        document.getElementById('final-profit-rate').textContent = profitRate;
        document.getElementById('game-over').classList.remove('hidden');
    }

    updatePrice() {
        // 트렌드 기반 가격 변동
        this.trend = this.trend * this.trendStrength + (Math.random() - 0.5) * (1 - this.trendStrength);
        const change = this.trend * this.volatility;
        this.currentPrice = Math.max(1000, Math.round(this.currentPrice * (1 + change)));
        this.priceHistory.push(this.currentPrice);
        
        if (this.priceHistory.length > 200) { // 데이터 포인트 수를 200개로 증가
            this.priceHistory.shift();
        }

        this.updateChart();
        this.updateUI();
    }

    updateChart() {
        const labels = Array.from({ length: this.priceHistory.length }, (_, i) => i.toString());
        this.chart.data.labels = labels;
        this.chart.data.datasets[0].data = this.priceHistory;
        
        // 차트의 y축 범위를 현재 가격의 ±20%로 설정
        const currentPrice = this.currentPrice;
        const minPrice = Math.max(0, currentPrice * 0.8);
        const maxPrice = currentPrice * 1.2;
        
        this.chart.options.scales.y.min = minPrice;
        this.chart.options.scales.y.max = maxPrice;
        
        this.chart.update('none'); // 애니메이션 없이 업데이트
    }

    buy() {
        if (!this.isGameRunning) return;
        
        const quantity = parseInt(document.getElementById('quantity').value);
        const totalCost = this.currentPrice * quantity;

        if (totalCost > this.cash) {
            alert('잔액이 부족합니다!');
            return;
        }

        this.cash -= totalCost;
        this.holdings += quantity;
        this.updateUI();
    }

    sell() {
        if (!this.isGameRunning) return;
        
        const quantity = parseInt(document.getElementById('quantity').value);
        
        if (quantity > this.holdings) {
            alert('보유 주식이 부족합니다!');
            return;
        }

        this.cash += this.currentPrice * quantity;
        this.holdings -= quantity;
        this.updateUI();
    }

    updateUI() {
        document.getElementById('cash').textContent = this.formatNumber(this.cash);
        document.getElementById('current-price').textContent = this.formatNumber(this.currentPrice);
        
        const totalAssets = this.cash + (this.holdings * this.currentPrice);
        document.getElementById('total-assets').textContent = this.formatNumber(totalAssets);
        
        const profitRate = ((totalAssets - this.initialCash) / this.initialCash * 100).toFixed(2);
        const profitRateElement = document.getElementById('profit-rate');
        profitRateElement.textContent = profitRate;
        profitRateElement.className = profitRate > 0 ? 'positive' : 'negative';
        
        const priceChange = this.priceHistory.length > 1 
            ? ((this.currentPrice - this.priceHistory[this.priceHistory.length - 2]) / this.priceHistory[this.priceHistory.length - 2] * 100).toFixed(2)
            : '0.00';
        
        const priceChangeElement = document.getElementById('price-change');
        priceChangeElement.textContent = priceChange;
        priceChangeElement.className = priceChange > 0 ? 'price-up' : 'price-down';

        const holdingsElement = document.getElementById('holdings');
        holdingsElement.innerHTML = `
            <div class="holding-item">
                <span>보유 수량: ${this.holdings}주</span>
                <span>평가 금액: ${this.formatNumber(this.holdings * this.currentPrice)}원</span>
            </div>
        `;
    }

    formatNumber(number) {
        return number.toLocaleString('ko-KR');
    }
}

// 시뮬레이터 시작
window.onload = () => {
    new StockSimulator();
}; 