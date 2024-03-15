import logging
import os
from logging.handlers import RotatingFileHandler

import face_recognition
from bson import ObjectId
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from pymongo import MongoClient

# Configuración de logging
log_dir = os.path.expanduser('~/facerecognition_logs')
if not os.path.exists(log_dir):
    os.makedirs(log_dir)

err_log_file = os.path.join(log_dir, 'facerecognition.err.log')
info_log_file = os.path.join(log_dir, 'facerecognition.info.log')

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('FaceRecognitionService')
logger.setLevel(logging.INFO)

info_handler = RotatingFileHandler(info_log_file, maxBytes=1e6, backupCount=3)
info_handler.setLevel(logging.INFO)
info_handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))

error_handler = RotatingFileHandler(err_log_file, maxBytes=1e6, backupCount=3)
error_handler.setLevel(logging.ERROR)
error_handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))

logger.addHandler(info_handler)
logger.addHandler(error_handler)

# Carga variables de entorno
environment = os.getenv('FLASK_ENV', 'development')
env_file = '.env.production' if environment == 'production' else '.env.development'
load_dotenv(env_file, override=True)

logger.info(f"Cargando configuración desde: {env_file}")

app = Flask(__name__)

# Conexión a MongoDB usando la variable de entorno
mongo_uri = os.getenv("MONGO_URI")
client = MongoClient(mongo_uri)
db = client['face_recognition_db']  # Nombre de la base de datos
users_collection = db['users']  # Nombre de la colección

# Mensaje de inicio para mostrar información del entorno y la base de datos
if '@' in mongo_uri:
    logger.info(f"Iniciando FaceRecognitionService en el entorno: {environment}")
    logger.info(f"Conectado a MongoDB en: {mongo_uri.split('@')[0]}...@{mongo_uri.split('@')[1].split('.')[0]} (URI oculta por seguridad)")
else:
    logger.info(f"Iniciando FaceRecognitionService en el entorno: {environment}")
    logger.info(f"Conectado a MongoDB en: {mongo_uri} (Local)")

@app.route('/', methods=['GET'])
def home():
    return jsonify({'message': 'Bienvenido al microservicio de reconocimiento facial.'}), 200

@app.route('/register', methods=['POST'])
def register():
    logger.info("Solicitud recibida en /register")
    if 'file' not in request.files:
        logger.error("No se encontró el archivo en la solicitud")
        return jsonify({'message': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        logger.error("No se seleccionó ningún archivo")
        return jsonify({'message': 'No selected file'}), 400
    if file:
        image = face_recognition.load_image_file(file)
        face_encoding = face_recognition.face_encodings(image)[0]
        face_encoding_list = face_encoding.tolist()
        result = users_collection.insert_one({'face_encoding': face_encoding_list})
        user_id = str(result.inserted_id)
        logger.info(f"Usuario registrado con éxito: {user_id}")
        return jsonify({'message': 'User registered successfully', 'user_id': user_id}), 201

@app.route('/verify', methods=['POST'])
def verify():
    logger.info("Verificación de usuario iniciada")
    face_id = request.form['faceId']  # Obtiene el faceId del formulario
    file = request.files['file']
    if not file or not face_id:
        logger.error("Archivo y faceId son requeridos")
        return jsonify({'message': 'File and faceId are required'}), 400

    unknown_image = face_recognition.load_image_file(file)
    unknown_face_encodings = face_recognition.face_encodings(unknown_image)

    if not unknown_face_encodings:
        # No se encontraron rostros en la imagen
        logger.error("No se encontraron rostros en la imagen")
        return jsonify({'message': 'No faces found in the image'}), 400

    unknown_face_encoding = unknown_face_encodings[0]

    user = users_collection.find_one({'_id': ObjectId(face_id)})
    if user and 'face_encoding' in user:
        known_face_encoding = user['face_encoding']
        match = face_recognition.compare_faces([known_face_encoding], unknown_face_encoding)
        if match[0]:
            logger.info(f"Usuario verificado: {str(user['_id'])}")
            return jsonify({'message': 'User verified', 'user_id': str(user['_id'])}), 200
        else:
            logger.error("Rostro no reconocido")
            return jsonify({'message': 'Face not recognized'}), 401
    else:
        logger.error("Usuario no encontrado")
        return jsonify({'message': 'User not found'}), 404

if __name__ == '__main__':
    app.run(debug=True, port=3007)
