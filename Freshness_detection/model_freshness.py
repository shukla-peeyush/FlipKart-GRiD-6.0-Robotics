import tensorflow as tf
import cv2
import numpy as np

# Load the trained model
model = tf.keras.models.load_model('models/freshness_model.h5')

def preprocess_image(image_path):
    # Preprocess the image for model prediction
    image = cv2.imread(image_path)
    image = cv2.resize(image, (224, 224))  # Assuming model input size is 224x224
    image = image.astype('float32') / 255.0
    image = np.expand_dims(image, axis=0)
    return image

def predict_freshness(image_path):
    # Predict freshness using the trained model
    image = preprocess_image(image_path)
    prediction = model.predict(image)

    # Interpret prediction results
    if prediction[0][0] > 0.5:
        return "Fresh"
    else:
        return "Not Fresh"
