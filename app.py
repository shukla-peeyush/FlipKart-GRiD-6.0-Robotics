import os
import cv2
import base64
from flask import Flask, render_template, request, jsonify
from ocr.ocr_extracter import extract_text
from detection.object_count import count_products
from model.model_freshness import predict_freshness
from classifier.image_type_detector import detect_image_type

app = Flask(__name__)
UPLOAD_FOLDER = 'static/uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/capture', methods=['POST'])
def capture_image():
    selected_services = request.form.getlist('services')
    
    # Check if an image file was uploaded or a photo was captured
    uploaded_file = request.files.get('image')
    captured_image = request.form.get('captured_image')

    if uploaded_file:
        # Save uploaded file
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], uploaded_file.filename)
        uploaded_file.save(file_path)
    elif captured_image:
        # Decode base64 captured image and save it
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], 'captured_image.jpg')
        with open(file_path, "wb") as fh:
            fh.write(base64.b64decode(captured_image.split(",")[1]))
    else:
        return 'No image provided', 400

    # Process image as before (detection, OCR, freshness prediction)
    results = {}
    try:
        image_type = detect_image_type(file_path)
        
        if 'product_details' in selected_services:
            if image_type in ['single', 'bunch']:
                results['product_details'] = extract_text(file_path)
            else:
                results['product_details'] = "Not applicable for unbranded items like veggies."

        if 'product_count' in selected_services:
            results['product_count'] = count_products(file_path)

        if 'freshness' in selected_services:
            if image_type in ['single', 'veggies']:
                results['freshness_status'] = predict_freshness(file_path)
            else:
                results['freshness_status'] = "Freshness check is mainly for perishable items."

        return jsonify(results)

    except Exception as e:
        return str(e), 500

if __name__ == '__main__':
    app.run(debug=True)
