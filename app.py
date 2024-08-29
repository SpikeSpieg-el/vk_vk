from flask import Flask, render_template, jsonify, request
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///data.db'  # Используйте SQLite для простоты
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False  # Отключите отслеживание изменений
db = SQLAlchemy(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    clicks = db.Column(db.Integer, default=0)
    score = db.Column(db.Integer, default=0)

with app.app_context():
    db.create_all()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/update', methods=['POST'])
def update_user_data():
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        clicks = data.get('clicks')
        score = data.get('score')

        if not user_id or clicks is None or score is None:
            return jsonify({"error": "Missing data"}), 400

        user = User.query.get(user_id)
        if user:
            user.clicks = clicks
            user.score = score
        else:
            user = User(id=user_id, clicks=clicks, score=score)
            db.session.add(user)

        db.session.commit()
        return jsonify({"success": True})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/getUserData', methods=['GET'])
def get_user_data():
    try:
        user_id = request.args.get('user_id')
        if not user_id:
            return jsonify({"error": "User ID not provided"}), 400

        user = User.query.get(user_id)
        if user:
            data = {
                'clicks': user.clicks,
                'score': user.score
            }
            return jsonify(data)
        else:
            return jsonify({"error": "User not found"}), 404

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/leaderboard', methods=['GET'])
def leaderboard():
    try:
        top_users = User.query.order_by(User.score.desc()).limit(10).all()
        data = [{'id': user.id, 'score': user.score} for user in top_users]
        return jsonify(data)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5173)
