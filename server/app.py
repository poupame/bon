from flask import Flask, request, render_template, jsonify
from roboflow import Roboflow
import base64
import cv2
import numpy as np
from flask_socketio import SocketIO, emit

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app)

# Utilisez la clé API privée pour l'inférence
rf = Roboflow(api_key="5TpQ2h4f0Tt8VqAN7elb")
project = rf.workspace().project("playing-cards-ow27d")
model = project.version(1).model

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload():
    data = request.json
    image_data = data['image'].split(",")[1]
    image = base64.b64decode(image_data)
    np_img = np.frombuffer(image, dtype=np.uint8)
    img = cv2.imdecode(np_img, cv2.IMREAD_COLOR)
    _, buffer = cv2.imencode('.jpg', img)
    img_str = base64.b64encode(buffer).decode('utf-8')

    prediction = model.predict(img_str, hosted=True)
    cards = prediction.json()['predictions']
    detected_cards = [card['class'] for card in cards]

    socketio.emit('update', {'cards': detected_cards, 'image': data['image']})
    return jsonify({'cards': detected_cards})

@socketio.on('connect')
def handle_connect():
    print('Client connected')

if __name__ == '__main__':
    socketio.run(app, host='127.0.0.1', port=5000)
