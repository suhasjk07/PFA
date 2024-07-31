from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
import joblib
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
import yfinance as yf

app = Flask(__name__)
CORS(app)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///finance_app.db'
app.config['JWT_SECRET_KEY'] = 'your-secret-key'  # Change this to a secure secret key
db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)
    goals = db.relationship('Goal', backref='user', lazy=True)

class Goal(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    target_amount = db.Column(db.Float, nullable=False)
    current_amount = db.Column(db.Float, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

with app.app_context():
    db.create_all()

# Load and preprocess data
data = pd.read_csv('financial_data.csv')
X = data[['income', 'expenses', 'savings']]
y = data['future_savings']

# Train model
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
model = RandomForestRegressor(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# Save model
joblib.dump(model, 'finance_model.joblib')

@app.route('/predict', methods=['POST'])
@jwt_required()
def predict():
    data = request.json
    prediction = model.predict([[data['income'], data['expenses'], data['savings']]])
    return jsonify({'prediction': prediction[0]})

@app.route('/register', methods=['POST'])
def register():
    data = request.json
    hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    new_user = User(username=data['username'], password=hashed_password)
    db.session.add(new_user)
    db.session.commit()
    return jsonify({'message': 'User registered successfully'}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(username=data['username']).first()
    if user and bcrypt.check_password_hash(user.password, data['password']):
        access_token = create_access_token(identity=user.id)
        return jsonify({'access_token': access_token}), 200
    return jsonify({'message': 'Invalid credentials'}), 401

@app.route('/goals', methods=['GET', 'POST'])
@jwt_required()
def goals():
    user_id = get_jwt_identity()
    if request.method == 'POST':
        data = request.json
        new_goal = Goal(name=data['name'], target_amount=data['target_amount'], 
                        current_amount=data['current_amount'], user_id=user_id)
        db.session.add(new_goal)
        db.session.commit()
        return jsonify({'message': 'Goal added successfully'}), 201
    else:
        user_goals = Goal.query.filter_by(user_id=user_id).all()
        return jsonify([{'name': goal.name, 'target_amount': goal.target_amount, 
                         'current_amount': goal.current_amount} for goal in user_goals])

@app.route('/stock_data', methods=['GET'])
def stock_data():
    symbol = request.args.get('symbol','TCS.NS','HDFCBANK.NS',  'INFY.NS',  'ICICIBANK.NS',  'HINDUNILVR.NS',  'SBIN.NS',  'BAJFINANCE.NS',  'BHARTIARTL.NS',  'KOTAKBANK.NS',  'AAPL', 'RELIANCE.NS', 'TCS.NS')  # Default to Apple stock
    stock = yf.Ticker(symbol)
    hist = stock.history(period="1mo")
    return jsonify(hist.to_dict())

if __name__ == '__main__':
    app.run(debug=True)