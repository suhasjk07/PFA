let accessToken = '';

async function register() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const response = await fetch('http://localhost:5000/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    alert(data.message);
}

async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const response = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    if (response.ok) {
        accessToken = data.access_token;
        document.getElementById('auth-section').style.display = 'none';
        document.getElementById('main-section').style.display = 'block';
        loadGoals();
    } else {
        alert(data.message);
    }
}

async function predict() {
    const income = document.getElementById('income').value;
    const expenses = document.getElementById('expenses').value;
    const savings = document.getElementById('savings').value;

    const response = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ income, expenses, savings }),
    });

    const data = await response.json();
    const prediction = data.prediction.toFixed(2);
    document.getElementById('result').innerText = `Predicted Future Savings: ₹ ${prediction}`;
    
    // Speak the prediction
    const speech = new SpeechSynthesisUtterance(`Your predicted future savings are ${prediction} Rupees.`);
    window.speechSynthesis.speak(speech);

    // Update chart
    updateSavingsChart(parseFloat(savings), parseFloat(prediction));
}

function startVoiceAssistant() {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'en-US';
    recognition.start();

    recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript.toLowerCase();
        if (transcript.includes('predict')) {
            predict();
        } else if (transcript.includes('income')) {
            document.getElementById('income').value = parseFloat(transcript.match(/\d+/)[0]);
        } else if (transcript.includes('expenses')) {
            document.getElementById('expenses').value = parseFloat(transcript.match(/\d+/)[0]);
        } else if (transcript.includes('savings')) {
            document.getElementById('savings').value = parseFloat(transcript.match(/\d+/)[0]);
        }
    };
}

let savingsChart;

function updateSavingsChart(currentSavings, predictedSavings) {
    const ctx = document.getElementById('savingsChart').getContext('2d');
    
    if (savingsChart) {
        savingsChart.destroy();
    }

    savingsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Current Savings', 'Predicted Savings'],
            datasets: [{
                label: 'Savings',
                data: [currentSavings, predictedSavings],
                backgroundColor: ['rgba(75, 192, 192, 0.6)', 'rgba(153, 102, 255, 0.6)'],
                borderColor: ['rgba(75, 192, 192, 1)', 'rgba(153, 102, 255, 1)'],
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

async function loadGoals() {
    const response = await fetch('http://localhost:5000/goals', {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });
    const goals = await response.json();
    const goalsList = document.getElementById('goals-list');
    goalsList.innerHTML = '';
    goals.forEach(goal => {
        const goalElement = document.createElement('div');
        goalElement.textContent = `${goal.name}: ₹${goal.current_amount} / ₹${goal.target_amount}`;
        goalsList.appendChild(goalElement);
    });
}

async function addGoal() {
    const name = document.getElementById('goal-name').value;
    const targetAmount = document.getElementById('goal-amount').value;
    
    const response = await fetch('http://localhost:5000/goals', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ name, target_amount: targetAmount, current_amount: 0 }),
    });

    if (response.ok) {
        loadGoals();
        document.getElementById('goal-name').value = '';
        document.getElementById('goal-amount').value = '';
    }
}

let stockChart;

async function fetchStockData() {
    const symbol = document.getElementById('stock-symbol').value.toUpperCase();
    const response = await fetch(`http://localhost:5000/stock_data?symbol=${symbol}`);
    const data = await response.json();

    const dates = Object.keys(data.Close);
    const closePrices = Object.values(data.Close);

    const ctx = document.getElementById('stockChart').getContext('2d');
    
    if (stockChart) {
        stockChart.destroy();
    }

    stockChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: `${symbol} Stock Price`,
                data: closePrices,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'day'
                    }
                },
                y: {
                    beginAtZero: false
                }
            }
        }
    });
}