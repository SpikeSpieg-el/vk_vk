from flask import Flask, render_template, jsonify

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/data')
def data():
    # Пример маршрута, который возвращает данные
    return jsonify({"message": "Hello from the server!"})

if __name__ == '__main__':
    app.run(debug=True, port=5173)
