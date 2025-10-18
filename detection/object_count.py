import cv2
import numpy as np

def count_and_draw_products(image, 
                            min_contour_area=1500,      # Balanced: not too strict, not too loose
                            min_width=25,                # Minimum width in pixels
                            min_height=25,               # Minimum height in pixels
                            max_aspect_ratio=8.0):       # Max width/height ratio
    """
    Detect and count products in an image with noise reduction.
    
    Parameters:
    - min_contour_area: Minimum area in pixels² (default 3000)
    - min_width: Minimum bounding box width (default 40)
    - min_height: Minimum bounding box height (default 40)
    - max_aspect_ratio: Maximum width/height ratio to filter elongated shapes (default 5.0)
    """
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    
    # Apply morphological operations to reduce noise
    kernel = np.ones((3, 3), np.uint8)
    morph = cv2.morphologyEx(blurred, cv2.MORPH_CLOSE, kernel, iterations=2)
    
    thresh = cv2.adaptiveThreshold(morph, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                   cv2.THRESH_BINARY_INV, 11, 2)
    
    # Additional morphological cleaning
    thresh = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel, iterations=1)
    
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    # Apply multiple filters to reduce noise
    filtered_contours = []
    for cnt in contours:
        area = cv2.contourArea(cnt)
        
        # Filter 1: Area threshold
        if area < min_contour_area:
            continue
        
        # Get bounding rectangle
        x, y, w, h = cv2.boundingRect(cnt)
        
        # Filter 2: Minimum width and height
        if w < min_width or h < min_height:
            continue
        
        # Filter 3: Aspect ratio (avoid very elongated shapes)
        aspect_ratio = max(w, h) / min(w, h)
        if aspect_ratio > max_aspect_ratio:
            continue
        
        filtered_contours.append(cnt)

    # Draw bounding boxes and labels
    for idx, contour in enumerate(filtered_contours):
        x, y, w, h = cv2.boundingRect(contour)
        cv2.rectangle(image, (x, y), (x + w, y + h), (0, 255, 0), 2)
        cv2.putText(image, str(idx + 1), (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 0, 0), 2)

    return image, len(filtered_contours)

def process_realtime_video(source):
    cap = cv2.VideoCapture(source)

    if not cap.isOpened():
        print("Error: Could not open video stream.")
        return

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            print("Failed to grab frame.")
            break

        processed_frame, count = count_and_draw_products(frame)
        
        cv2.putText(processed_frame, f'Total Items: {count}', (10, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)

        cv2.imshow("Real-Time Object Detection", processed_frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

# Commented out to prevent automatic camera access when imported
# Uncomment the line below if you want to run real-time video processing
# process_realtime_video(0)

if __name__ == "__main__":
    # Only run real-time video when script is executed directly
    process_realtime_video(0)
