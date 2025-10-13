#!/usr/bin/env python3
"""
Test script to verify object detection is working properly
"""

import cv2
import os
from detection.object_count import count_and_draw_products

def test_object_detection():
    # Check if there are any test images in the uploads folder
    upload_folder = 'static/uploads'
    
    if not os.path.exists(upload_folder):
        print("❌ Upload folder not found")
        return
    
    # Get the first image file we can find
    image_files = [f for f in os.listdir(upload_folder) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
    
    if not image_files:
        print("❌ No test images found in uploads folder")
        return
    
    test_image_path = os.path.join(upload_folder, image_files[0])
    print(f"🔍 Testing with image: {test_image_path}")
    
    try:
        # Load the image
        image = cv2.imread(test_image_path)
        if image is None:
            print("❌ Could not load image")
            return
        
        print(f"✅ Image loaded successfully: {image.shape}")
        
        # Run object detection
        _, count = count_and_draw_products(image.copy())
        
        print(f"🎯 Objects detected: {count}")
        
        if count > 0:
            print("✅ Object detection is working correctly!")
        else:
            print("⚠️  No objects detected (this might be normal depending on the image)")
            
    except Exception as e:
        print(f"❌ Detection failed: {e}")

if __name__ == "__main__":
    test_object_detection()
