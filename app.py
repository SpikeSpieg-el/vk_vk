from flask import Flask, request, jsonify, render_template
import uuid

app = Flask(__name__)

# Временное хранилище для пользователей и их кликов
users = {}

@app.route('/')
def index():
    # Отладка параметров запроса
    print("Query parameters:", request.args)
    return render_template('index.html')

@app.route('/register', methods=['POST'])
def register():
    data = request.json
    nickname = data.get('nickname')

    if not nickname:
        return jsonify({'status': 'error', 'message': 'Nickname is required'}), 400

    # Проверяем, существует ли уже пользователь с таким ником
    for user_id, user_info in users.items():
        if user_info['nickname'] == nickname:
            return jsonify({'status': 'success', 'user_id': user_id})

    user_id = str(uuid.uuid4())  # Генерация уникального идентификатора
    users[user_id] = {'nickname': nickname, 'clicks': 0}
    
    return jsonify({'status': 'success', 'user_id': user_id})

@app.route('/click', methods=['POST'])
def click():
    data = request.json
    user_id = data.get('user_id')
    clicks = data.get('clicks')

    if user_id in users:
        users[user_id]['clicks'] += clicks
        return jsonify({'status': 'success'})
    else:
        return jsonify({'status': 'error', 'message': 'User not found'}), 404

@app.route('/get_leaderboard', methods=['GET'])
def get_leaderboard():
    sorted_users = sorted(users.items(), key=lambda item: item[1]['clicks'], reverse=True)
    leaderboard = [{**{'user_id': user_id}, **info} for user_id, info in sorted_users]
    return jsonify(leaderboard)

if __name__ == '__main__':
    app.run(port=8080, debug=True)
