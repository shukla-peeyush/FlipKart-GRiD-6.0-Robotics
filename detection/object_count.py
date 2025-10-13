import cv2

def count_and_draw_products(image, min_contour_area=500):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    thresh = cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                   cv2.THRESH_BINARY_INV, 11, 2)
    
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    filtered_contours = [cnt for cnt in contours if cv2.contourArea(cnt) > min_contour_area]

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
